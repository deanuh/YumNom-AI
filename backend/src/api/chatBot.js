// // chotBot.js file
// // this file is the backend logic for the ChatBot
// // it loads a pre-trained text embedding model (MiniLM-L6-v2) 
// // computes semantic similarites betwen user queries and FAQ entries

// import fs from "fs";   // this is the Node.js filesystem module
// import path from "path";  
// import express from "express";
// import { pipeline } from "@xenova/transformers";  // loads pre-trained models (embeddings)

// // going to include openAI to make some answers a lil more personal
// import OpenAI from "openai";
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


// const router = express.Router();
// router.use(express.json());  // middleware to parse JSON request bodies

// // ---------- Paths ----------
// // these define where to find the chatbot's data files
// // the system looks for 2 files:
// //        - faqs.json: contains raw questions/answers and routes to lead the user there
// //        - faqs_index.json: contains the embedding for each faq built with build_index.js
// const DATA_DIR = process.env.CHATBOT_DATA_DIR
//   ? path.resolve(process.env.CHATBOT_DATA_DIR)
//   : path.resolve("chatBotData");
// const FAQS_PATH = path.join(DATA_DIR, "faqs.json");
// const INDEX_PATH = path.join(DATA_DIR, "faqs_index.json");

// // ---------- Hold Faqs ----------
// // These hold the FAQ data and embeddings in memory after being loaded once
// // They are only loaded the first time someone queries the chatbot
// let faqs = [];  // array of all faq entries (question, answer, route...)
// let index = []; // [{ id, vector, meta:{question, route} }]
// let faqById = new Map();  // quick lookup for faq by ID
// let docsForKeyword = [];  // tokenized faq text for keyword-based scoring (how mucha  user text matching these words)
// let idf = new Map();  // inverse document frequency map for weighting words
// let embedderPromise = null;  // lazy loader for the embedding model

// // ---------- Helpers (match build_index.js) ----------
// // normalize and tokenize strings to prepare them for embedding and keyword
// // analysis. This matches the same logic used in build_index.js.
// function normalize(str = "") {
//   return str
//     .toLowerCase()  //lower case everything to make it easier
//     .replace(/y[\s\-_]*u[\s\-_]*m[\s\-_]*n[\s\-_]*o[\s\-_]*m/gi, "yumnom")
//     .replace(/[^\p{L}\p{N}\s]/gu, " ")    // Remove non-letter/number characters
//     .replace(/\s+/g, " ")     // Collapse multiple spaces
//     .trim();    // Remove leading/trailing whitespace
// }
// function tokenize(str = "") {
//   // splits text into individual tokens (words)
//   return normalize(str).split(" ").filter(Boolean);
// }

// // compute cosine similarity between two vectors to measure semantic closeness. ML CLASS IMPORTANT
// function cosine(a, b) {
//   let dot = 0, na = 0, nb = 0;
//   for (let i = 0; i < a.length; i++) {
//     const x = a[i], y = b[i];
//     dot += x * y; na += x * x; nb += y * y;
//   }
//   // Formula: dot(A,B) / (||A|| * ||B||)
//   return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
// }

// // load the MiniLM model (only once). this model converts text → vector.
// async function getEmbedder() {
//   if (!embedderPromise) {
//     console.log("[chatBot] Loading Xenova/all-MiniLM-L6-v2 …");
//     embedderPromise = pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
//   }
//   return embedderPromise;
// }

// // convert input text into an embedding vector
// async function embed(text) {
//   const embedder = await getEmbedder();
//   // the model outputs a matrix of token embeddings; we take the mean (pooling)
//   // and normalize the result to get a single consistent vector per input.
//   const out = await embedder(text, { pooling: "mean", normalize: true });
//   return Array.from(out.data);   // convert tensor --> array
// }

// const BRAND_ALIASES = ["yumnom", "yum nom", "YumNom", "YumNom AI", "yumnom app", "yumnom support"];
// // These define some common brand terms and special intents used to slightly
// // bias or adjust matching results for specific types of questions.
// // add more if needed/want
// const INTENT = {
//   delete: new Set(["delete", "remove", "terminate", "close", "erase", "permanently", "cancel"]),
//   contact: new Set(["contact", "support", "email", "phone", "call", "reach"]),
//   password: new Set(["password", "passcode", "reset", "change", "forgot"]),
//   deactivate: new Set(["deactivate", "disable", "pause"]),
// };

// // keyword overlap with tiny IDF
// // these functions provide a small “keyword” boost in addition to embeddings.
// // they use an IDF-weighted approach (like TF-IDF) to emphasize rare words.
// function keywordScore(docTokens, queryTokens) {
//   let s = 0;
//   for (const tok of queryTokens) if (docTokens.has(tok)) s += (idf.get(tok) || 0);
//   return s / Math.max(1, docTokens.size);
// }

// // check if two token sets share any words
// function sharesAny(docTokens, group) {
//   for (const t of group) if (docTokens.has(t)) return true;
//   return false;
// }

// // ---------- Load index/faq once (on first request) ----------
// function loadDataOnce() {
//   if (faqs.length && index.length) return;

//    // ensure data files exist
//   if (!fs.existsSync(FAQS_PATH)) throw new Error(`[chatBot] Missing ${FAQS_PATH}`);
//   if (!fs.existsSync(INDEX_PATH)) throw new Error(`[chatBot] Missing ${INDEX_PATH} (run build_index.js)`);
//   // load FAQ JSON and vector index
//   faqs = JSON.parse(fs.readFileSync(FAQS_PATH, "utf-8"));
//   index = JSON.parse(fs.readFileSync(INDEX_PATH, "utf-8"));
//   faqById = new Map(faqs.map(f => [f.id, f]));

//   // Build token views + IDF from question+tags (matches build_index’s idea)
//   const df = new Map();
//   docsForKeyword = index.map(doc => {
//     const f = faqById.get(doc.id) || {};
//     const tokens = new Set(tokenize([f.question, ...(f.tags || [])].join(" ")));
//     for (const t of tokens) df.set(t, (df.get(t) || 0) + 1);
//     return { id: doc.id, tokens };
//   });
//   const N = index.length;
//   idf = new Map(Array.from(df.entries()).map(([t, c]) => [t, Math.log(1 + N / (1 + c))]));

//   console.log(`[chatBot] Loaded ${faqs.length} FAQs & ${index.length} vectors from ${DATA_DIR}`);
// }

// // ---------- Core search (hybrid, same spirit as build_index CLI test) ----------
// // This is where the “AI” part happens: it combines embedding similarity
// // with keyword overlap to rank FAQs for a given user query.
// async function searchFAQs(query, topK = 3) {
//   loadDataOnce();

//   const q = query || "";
//   // // Reject if too short or contains no vowels -- like if user type in eafiubae or something random
//   // if (q.length < 15 || !/[aeiou]/i.test(q)) {
//   //   return res.json({
//   //     type: "fallback",
//   //     message: "Hmm, that doesn’t look like a valid question. Could you try rephrasing it?",
//   //     related: []
//   //   });
//   // }

//   const qTokens = new Set(tokenize(q));
//   const qvec = await embed(q + "\n" + BRAND_ALIASES.join(" | "));

//   // detect user intent based on keywords (used for small scoring penalties)
//   const qHas = {
//     delete: Array.from(INTENT.delete).some(t => qTokens.has(t)),
//     contact: Array.from(INTENT.contact).some(t => qTokens.has(t)),
//     password: Array.from(INTENT.password).some(t => qTokens.has(t)),
//     deactivate: Array.from(INTENT.deactivate).some(t => qTokens.has(t)),
//   };

//   // compute similarity scores for all FAQ documents
//   const ranked = index.map((doc, i) => {
//     const docTokens = docsForKeyword[i].tokens;
//     const sem = cosine(qvec, doc.vector);  // semantic (embedding) similarity
//     const kw = keywordScore(docTokens, qTokens);  // keyword overlap score

//     // gentle, query-aware guardrails to stop “password reset” from beating “delete account”, etc.
//     let penalty = 0;
//     if (qHas.delete && !sharesAny(docTokens, INTENT.delete)) penalty -= 0.12;
//     if (qHas.contact && !sharesAny(docTokens, INTENT.contact)) penalty -= 0.12;
//     if (qHas.password && !sharesAny(docTokens, INTENT.password)) penalty -= 0.08;
//     if (qHas.deactivate && !sharesAny(docTokens, INTENT.deactivate)) penalty -= 0.08;

//     const score = 0.78 * sem + 0.22 * Math.tanh(kw) + penalty;

//     const f = faqById.get(doc.id);
//     return {
//       id: doc.id,
//       question: f?.question ?? doc.meta?.question ?? "",
//       answer: f?.answer ?? "",
//       route: f?.route ?? doc.meta?.route ?? "",
//       score, sem, kw
//     };
//   });

//   // Sort all FAQs by descending score and return top results
//   ranked.sort((a, b) => b.score - a.score);
//   return ranked.slice(0, topK);
// }

// router.post("/ask", async (req, res) => {
//   try {
//     const message = (req.body && req.body.message) || "";
//     if (!message.trim()) return res.status(400).json({ error: "Empty message" });

//     const results = await searchFAQs(message, 5);
//     const primary = results[0];
//     const threshold = 0.78; // adjustable cutoff for confident FAQ matches

//     if (!primary || primary.score < threshold) {
//       // --- fallback: generate a personal OpenAI reply ---
//       const completion = await openai.chat.completions.create({
//         model: "gpt-4o-mini",
//         max_tokens: 80,
//         messages: [
//           { role: "system", content: `
//                     You are NomBot, the friendly in-app chatbot for the YumNom AI food recommendation platform.

//                     Your role:
//                     - Help users navigate the YumNom app by explaining where to find features and how to use them.
//                     - If the user asks about something not in the FAQ, respond conversationally and still try to connect it to YumNom’s app features (e.g., profile, favorites, AI dish recommendations, or group meal party).
//                     - Keep responses under 3 short paragraphs and use a warm, approachable tone.
//                     - When appropriate, add brief encouragement like "hope that helps!" or "you got this!"
//                     - Do not mention that you are an AI model. You are NomBot, part of the YumNom team.
//                     - If the question is unrelated to food, the app, or user help, politely redirect them to focus on YumNom.
//                     - if the user asks about where they should go to eat, if a certain item has certain ingredients, what restaurants are near them; you cannot answer those, redirect them to the restaraunt search or AI dish recommendation instead.
//                     - you will answer question about how to access 
//                     ` },
//           { role: "user", content: message }
//         ],
//         temperature: 0.3
//       });

//       const aiText = completion.choices[0].message.content.trim();

//       return res.json({
//         type: "personalized",
//         message: aiText
//       });
//     }

//     // --- confident FAQ match ---
//     const related = results.slice(1, 3).map(r => ({
//       id: r.id,
//       answer: r.answer,
//       question: r.question,
//       route: r.route
//     }));

//     return res.json({
//       type: "faq",
//       match: {
//         id: primary.id,
//         score: Number(primary.score.toFixed(3)),
//         title: primary.question,
//         answer: primary.answer,
//         route: primary.route
//       },
//       alternatives: related
//     });

//   } catch (e) {
//     console.error("[chatBot] /ask error:", e);
//     return res.status(500).json({ error: "Server error in chatbot route" });
//   }
// });


// // Optional: quick health check
// router.get("/health", (_req, res) => res.json({ ok: true }));

// export default router;




// chatBot.js
// YumNom AI Chatbot Backend — hybrid FAQ + OpenAI system
// -------------------------------------------------------------







import fs from "fs";
import path from "path";
import express from "express";
import { pipeline } from "@xenova/transformers";
import OpenAI from "openai";

const router = express.Router();
router.use(express.json());

// -------------------------------------------------------------
// Paths
// -------------------------------------------------------------
const DATA_DIR = process.env.CHATBOT_DATA_DIR
  ? path.resolve(process.env.CHATBOT_DATA_DIR)
  : path.resolve("chatBotData");
const FAQS_PATH = path.join(DATA_DIR, "faqs.json");
const INDEX_PATH = path.join(DATA_DIR, "faqs_index.json");

// -------------------------------------------------------------
// Globals
// -------------------------------------------------------------
let faqs = [];
let index = [];
let faqById = new Map();
let docsForKeyword = [];
let idf = new Map();
let embedderPromise = null;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// -------------------------------------------------------------
// Helpers
// -------------------------------------------------------------
function normalize(str = "") {
  return str
    .toLowerCase()
    .replace(/y[\s\-_]*u[\s\-_]*m[\s\-_]*n[\s\-_]*o[\s\-_]*m/gi, "yumnom")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(str = "") {
  return normalize(str).split(" ").filter(Boolean);
}

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i], y = b[i];
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

async function getEmbedder() {
  if (!embedderPromise) {
    console.log("[chatBot] Loading Xenova/all-MiniLM-L6-v2 …");
    embedderPromise = pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return embedderPromise;
}

async function embed(text) {
  const embedder = await getEmbedder();
  const out = await embedder(text, { pooling: "mean", normalize: true });
  return Array.from(out.data);
}

function keywordScore(docTokens, queryTokens) {
  let s = 0;
  for (const tok of queryTokens) if (docTokens.has(tok)) s += (idf.get(tok) || 0);
  return s / Math.max(1, docTokens.size);
}

function sharesAny(docTokens, group) {
  for (const t of group) if (docTokens.has(t)) return true;
  return false;
}

function loadDataOnce() {
  if (faqs.length && index.length) return;

  if (!fs.existsSync(FAQS_PATH)) throw new Error(`[chatBot] Missing ${FAQS_PATH}`);
  if (!fs.existsSync(INDEX_PATH)) throw new Error(`[chatBot] Missing ${INDEX_PATH} (run build_index.js)`);

  faqs = JSON.parse(fs.readFileSync(FAQS_PATH, "utf-8"));
  index = JSON.parse(fs.readFileSync(INDEX_PATH, "utf-8"));
  faqById = new Map(faqs.map(f => [f.id, f]));

  const df = new Map();
  docsForKeyword = index.map(doc => {
    const f = faqById.get(doc.id) || {};
    const tokens = new Set(tokenize([f.question, ...(f.tags || [])].join(" ")));
    for (const t of tokens) df.set(t, (df.get(t) || 0) + 1);
    return { id: doc.id, tokens };
  });
  const N = index.length;
  idf = new Map(Array.from(df.entries()).map(([t, c]) => [t, Math.log(1 + N / (1 + c))]));

  console.log(`[chatBot] Loaded ${faqs.length} FAQs & ${index.length} vectors from ${DATA_DIR}`);
}

// -------------------------------------------------------------
// Search logic
// -------------------------------------------------------------
const BRAND_ALIASES = ["yumnom", "yum nom", "YumNom", "YumNom AI", "yumnom app", "yumnom support"];
const INTENT = {
  delete: new Set(["delete", "remove", "terminate", "close", "erase", "cancel"]),
  contact: new Set(["contact", "support", "email", "phone", "call", "reach"]),
  password: new Set(["password", "reset", "change", "forgot"]),
  deactivate: new Set(["deactivate", "disable", "pause"])
};

async function searchFAQs(query, topK = 3) {
  loadDataOnce();

  const q = query || "";
  const qTokens = new Set(tokenize(q));
  const qvec = await embed(q + "\n" + BRAND_ALIASES.join(" | "));

  const qHas = {
    delete: Array.from(INTENT.delete).some(t => qTokens.has(t)),
    contact: Array.from(INTENT.contact).some(t => qTokens.has(t)),
    password: Array.from(INTENT.password).some(t => qTokens.has(t)),
    deactivate: Array.from(INTENT.deactivate).some(t => qTokens.has(t))
  };

  const ranked = index.map((doc, i) => {
    const docTokens = docsForKeyword[i].tokens;
    const sem = cosine(qvec, doc.vector);
    const kw = keywordScore(docTokens, qTokens);
    let penalty = 0;
    if (qHas.delete && !sharesAny(docTokens, INTENT.delete)) penalty -= 0.12;
    if (qHas.contact && !sharesAny(docTokens, INTENT.contact)) penalty -= 0.12;
    if (qHas.password && !sharesAny(docTokens, INTENT.password)) penalty -= 0.08;
    if (qHas.deactivate && !sharesAny(docTokens, INTENT.deactivate)) penalty -= 0.08;

    const score = 0.78 * sem + 0.22 * Math.tanh(kw) + penalty;
    const f = faqById.get(doc.id);
    return {
      id: doc.id,
      question: f?.question ?? doc.meta?.question ?? "",
      answer: f?.answer ?? "",
      route: f?.route ?? doc.meta?.route ?? "",
      score, sem, kw
    };
  });

  ranked.sort((a, b) => b.score - a.score);
  return ranked.slice(0, topK);
}

// -------------------------------------------------------------
// Helper: enforce one-sentence limit
// -------------------------------------------------------------
async function oneSentence(text, context = "") {
  const raw = (text || "").trim();
  if (!raw) return "";

  if (!process.env.OPENAI_API_KEY) {
    const words = raw.split(/\s+/).slice(0, 20).join(" ");
    const end = /[.!?]$/.test(words) ? "" : "...";
    return words + end;
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    max_tokens: 80,
    messages: [
      {
        role: "system",
        content: ` You are NomBot, the in-app assistant for YumNom.
              - You will only answer questions about the YumNom web app"
              - Rewrite any answer into ONE short sentence (<=25 words).
              - Be clear, friendly, and mention YumNom UI paths exactly if relevant.
              - Do not list, summarize, or expand beyond the given info.
              - Help users navigate the YumNom app by explaining where to find features and how to use them.
              - If the user asks about something not in the FAQ, respond conversationally and still try to connect it to YumNom’s app features (e.g., profile, favorites, AI dish recommendations, or group meal party).
              - Keep responses under 3 short paragraphs and use a warm, approachable tone.
              - When appropriate, add brief encouragement like "hope that helps!" or "you got this!"
              - Do not mention that you are an AI model. You are NomBot, part of the YumNom team.
              - If the question is unrelated to food, the app, or user help, politely redirect them to focus on YumNom.
              - if the user asks about where they should go to eat, if a certain item has certain ingredients, what restaurants are near them; you cannot answer those, redirect them to the restaraunt search or AI dish recommendation instead.
              - you will answer question about how to access 
              ` 

        .trim()
      },
      { role: "user", content: `User question: ${context}` },
      { role: "user", content: `Shorten this answer: "${raw}"` }
    ]
  });

  return (completion.choices?.[0]?.message?.content || raw).trim();
}

// -------------------------------------------------------------
// Routes
// -------------------------------------------------------------
router.post("/ask", async (req, res) => {
  try {
    const message = (req.body && req.body.message) || "";
    if (!message.trim()) return res.status(400).json({ error: "Empty message" });

    const results = await searchFAQs(message, 5);
    const primary = results[0];
    const HIGH = 0.82;
    const LOW = 0.70;

    if (primary && primary.score >= LOW) {
      const related = results.slice(1, 3).map(r => ({
        id: r.id,
        answer: r.answer,
        question: r.question,
        route: r.route
      }));

      const concise = await oneSentence(
        primary.answer,
        `User question: "${message}". Route: ${primary.route}`
      );

      return res.json({
        type: "faq",
        match: {
          id: primary.id,
          score: Number(primary.score.toFixed(3)),
          title: primary.question,
          answer: concise,
          route: primary.route
        },
        alternatives: related
      });
    }

    // Fallback: personalized OpenAI response (one sentence)
    let personalized = "I couldn’t find that—try Profile, Favorites, or AI Recommendations.";
    if (process.env.OPENAI_API_KEY) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.6,
        max_tokens: 80,
        messages: [
          {
            role: "system",
            content: ` You are NomBot, the in-app assistant for YumNom.
              - You will only answer questions about the YumNom web app, if a user asks about anything else than what is prompted below, you do not answer. Say "Sorry I am unable to answer that, please ask about YumNom!"
              - Rewrite any answer into ONE short sentence (<=25 words).
              - Be clear, friendly, and mention YumNom UI paths exactly if relevant.
              - Do not list, summarize, or expand beyond the given info.
              - Help users navigate the YumNom app by explaining where to find features and how to use them.
              - If the user asks about something not in the FAQ, respond conversationally and still try to connect it to YumNom’s app features (e.g., profile, favorites, AI dish recommendations, or group meal party).
              - Keep responses under 3 short paragraphs and use a warm, approachable tone.
              - When appropriate, add brief encouragement like "hope that helps!" or "you got this!"
              - Do not mention that you are an AI model. You are NomBot, part of the YumNom team.
              - If the question is unrelated to food, the app, or user help, politely redirect them to focus on YumNom.
              - if the user asks about where they should go to eat, if a certain item has certain ingredients, what restaurants are near them; you cannot answer those, redirect them to the restaraunt search or AI dish recommendation instead.
              - you will answer question about how to access 
              ` 
              .trim()
          },
          { role: "user", content: message }
        ]
      });
      personalized = (completion.choices?.[0]?.message?.content || personalized).trim();
    }

    return res.json({ type: "personalized", message: personalized });

  } catch (e) {
    console.error("[chatBot] /ask error:", e);
    return res.status(500).json({ error: "Server error in chatbot route" });
  }
});

router.get("/health", (_req, res) => res.json({ ok: true }));

export default router;
