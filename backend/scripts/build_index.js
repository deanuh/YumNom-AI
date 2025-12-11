// // backend/scripts/build_index.js
// Build vector index for FAQs using Hugging Face MiniLM embeddings via @xenova/transformers
// Enhancements:
//  - Text augmentation with synonyms/aliases (esp. contact/support & brand names)
//  - Keep index shape stable: [{ id, vector, meta: { question, route } }, ...]
//  - Add optional hybrid scoring in the CLI test (semantic + keyword overlap)

import fs from "fs";
import path from "path";
import { pipeline } from "@xenova/transformers";

// --- Paths ---
const DATA_DIR = path.resolve("chatBotData");
const FAQS_PATH = path.join(DATA_DIR, "faqs.json");
const INDEX_PATH = path.join(DATA_DIR, "faqs_index.json");

// --- Load FAQ data ---
if (!fs.existsSync(FAQS_PATH)) {
  console.error(`Could not find ${FAQS_PATH}`);
  process.exit(1);
}
const faqs = JSON.parse(fs.readFileSync(FAQS_PATH, "utf-8"));
console.log(`Loaded ${faqs.length} FAQs from ${FAQS_PATH}`);

// --- Embeddings pipeline (MiniLM, 384-dim) ---
const embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");

// --- Utilities ---
function normalize(str) {
  return str
    .toLowerCase()
    .replace(/y[\s\-_]*u[\s\-_]*m[\s\-_]*n[\s\-_]*o[\s\-_]*m/gi, "yumnom") // collapse Yum Nom -> yumnom
    .replace(/[^\p{L}\p{N}\s]/gu, " ") // drop punctuation
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(str) {
  if (!str) return [];
  return normalize(str).split(" ").filter(Boolean);
}

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i], y = b[i];
    dot += x * y; na += x * x; nb += y * y;
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

// Targeted synonyms/aliases to densify embeddings for common intents
const SYNONYM_MAP = [
  {
    keys: ["contact", "support", "help", "email", "phone", "reach", "message", "call"],
    expansions: [
      "contact us", "contact yumnom", "get in touch", "reach out",
      "customer support", "customer service", "help center",
      "email address", "support email", "phone number", "call us", "send a message"
    ]
  },
  {
    keys: ["password", "passcode", "login", "account"],
    expansions: [
      "reset password", "change password", "forgot password",
      "update login", "account recovery"
    ]
  },
  {
    keys: ["preference", "diet", "allergen", "food"],
    expansions: [
      "update preferences", "dietary restrictions", "allergy settings",
      "food preferences", "edit profile preferences"
    ]
  }
];

// Brand/route aliases that users might type
const BRAND_ALIASES = [
  "yumnom", "yum nom", "YumNom", "YumNom AI", "yumnom app", "yumnom support"
];

function expandWithSynonyms(text) {
  const n = normalize(text);
  const expansions = new Set();

  // Always include brand aliases so the brand term anchors the vector space
  BRAND_ALIASES.forEach((a) => expansions.add(a));

  for (const group of SYNONYM_MAP) {
    if (group.keys.some(k => n.includes(k))) {
      group.expansions.forEach(e => expansions.add(e));
    }
  }
  return text + "\n\n" + Array.from(expansions).join(" | ");
}

async function embed(text) {
  const result = await embedder(text, { pooling: "mean", normalize: true });
  return Array.from(result.data);
}

// --- Build (and lightly annotate) index ---
const index = [];
const docsForKeyword = []; // keep a minimal keyword view for test scoring

// Gather corpus tokens for simple IDF
const corpusTokenSets = [];
for (const item of faqs) {
  const baseText = `${item.question}\n${item.answer}\n${(item.tags || []).join(" ")}`;
  const augmented = expandWithSynonyms(baseText);
  const tokens = new Set(tokenize(item.question + " " + (item.tags || []).join(" ")));

  corpusTokenSets.push(tokens);

  console.log(`Embedding: ${item.id}`);
  const vector = await embed(augmented);

  index.push({
    id: item.id,
    vector,
    meta: {
      question: item.question,
      route: item.route
    }
  });

  docsForKeyword.push({
    id: item.id,
    tokens
  });
}

// Build a tiny IDF map over question+tags tokens
const df = new Map();
for (const tset of corpusTokenSets) {
  for (const tok of tset) {
    df.set(tok, (df.get(tok) || 0) + 1);
  }
}
const N = faqs.length;
const idf = new Map();
for (const [tok, c] of df.entries()) {
  // Smooth IDF
  idf.set(tok, Math.log(1 + N / (1 + c)));
}

// --- Save index (same shape as before) ---
fs.writeFileSync(INDEX_PATH, JSON.stringify(index));
console.log(`\nWrote ${INDEX_PATH} with ${index.length} items.`);

// --- CLI test: hybrid ranking for sanity check ---
const query = process.argv[2] || "how do I contact yumnom";
console.log(`\nQuery: "${query}"`);

const qvec = await embed(query + "\n" + BRAND_ALIASES.join(" | "));
const qTokens = new Set(tokenize(query));

// Simple keyword overlap score with light IDF weighting
function keywordScore(docTokens, queryTokens) {
  let s = 0;
  for (const tok of queryTokens) {
    if (docTokens.has(tok)) s += (idf.get(tok) || 0);
  }
  // small normalization by token count to avoid bias to huge questions
  return s / Math.max(1, docTokens.size);
}

// Extra boost if doc looks like a contact/support entry
function intentBoost(meta, docTokens) {
  const q = normalize(meta.question);
  const isContacty =
    q.includes("contact") ||
    q.includes("support") ||
    docTokens.has("contact") ||
    docTokens.has("support") ||
    (meta.route && /contact|support/i.test(meta.route));
  return isContacty ? 0.05 : 0.0; // gentle boost
}

const byScore = index
  .map((doc, i) => {
    const sem = cosine(qvec, doc.vector); // [−1,1]
    const kw = keywordScore(docsForKeyword[i].tokens, qTokens); // ~[0, ~]
    const boost = intentBoost(doc.meta, docsForKeyword[i].tokens);

    // Hybrid score: semantic carries most weight, keywords sharpen intent
    const score = 0.78 * sem + 0.22 * Math.tanh(kw) + boost;

    return {
      id: doc.id,
      question: doc.meta.question,
      route: doc.meta.route,
      sem,
      kw,
      score
    };
  })
  .sort((a, b) => b.score - a.score);

console.log("\nTop matches:");
byScore.slice(0, 2).forEach((s, i) => {
  console.log(`${i + 1}. [${s.id}] ${s.question}`);
  console.log(`   route: ${s.route}`);
  console.log(`   scores → hybrid:${s.score.toFixed(3)}  sem:${s.sem.toFixed(3)}  kw:${s.kw.toFixed(3)}\n`);
});
