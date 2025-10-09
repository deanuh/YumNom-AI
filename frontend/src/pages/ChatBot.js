// // src/pages/ChatBot.js
// import React, { useEffect, useRef, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import "../styles/ChatBot.css";

// import MessageBubble from "../components/ChatBot/MessageBubble";
// import ChatInput from "../components/ChatBot/ChatInput";
// import TypingIndicator from "../components/ChatBot/TypingIndicator";
// import OptionButtons from "../components/ChatBot/OptionButtons";

// const initialMessages = [
//   { sender: "bot", text: "Hello, what can we assist you with today?" },
//   { sender: "bot", text: "Try asking about: Password • Preferences • Dietary • Location • Privacy" }
// ];

// export default function ChatBot({ toggleChat }) {
//   const [messages, setMessages] = useState(initialMessages);
//   const [input, setInput] = useState("");
//   const [loading, setLoading] = useState(false);
//   const chatEndRef = useRef(null);
//   const navigate = useNavigate();
  


//   // auto scroll
//   useEffect(() => {
//     chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages, loading]);

//   function handleExit() {
//     if (typeof toggleChat === "function") toggleChat();
//     else navigate(-1);
//   }

//   function appendUser(text) {
//     setMessages(m => [...m, { sender: "user", text }]);
//   }

//   function appendBot(payload) {
//     // payload can be: { text }, or FAQ with CTAs/alternatives/options
//     setMessages(m => [...m, { sender: "bot", ...payload }]);
//   }

//   async function askBackend(query) {  // hardcoded the port for right not to actually connect to backend. can add as proxy in package.json later
//     const res = await fetch("http://localhost:5001/api/chatBot/ask", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ message: query })
//     });
//     if (!res.ok) throw new Error("Server error");
//     return res.json();
//   }

//   async function handleSend() {
//     const text = input.trim();
//     if (!text || loading) return;
//     setInput("");
//     appendUser(text);
//     setLoading(true);

//     try {
//       const data = await askBackend(text);

//       if (data.type === "faq") {
//         appendBot({
//           text: data.match.answer,
//           cta: { label: data.match.title, route: data.match.route },
//           alternatives: data.alternatives
//         });
//       } else if (data.type === "fallback") {
//         appendBot({
//           text: data.message,
//           options: data.options
//         });
//       } else {
//         appendBot({ text: "I couldn’t classify that. Try: Password, Preferences, Dietary, Location, Privacy." });
//       }
//     } catch (e) {
//       appendBot({ text: "Sorry—something went wrong. Please try again." });
//       // optional: log error
//     } finally {
//       setLoading(false);
//     }
//   }

//   function openRoute(route) {
//     if (!route) return;
//     navigate(route);
//     // Optional: also close the chat
//     // if (typeof toggleChat === "function") toggleChat();
//   }

//   return (
//     <div className="chatbot-wrapper">
//       <h2 className="chatbot-header">CHATTING WITH NOMBOT</h2>

//       <div className="chat-window">
//         <div className="chatBot-message-container">
//           {messages.map((msg, idx) => (
//             <MessageBubble key={idx} sender={msg.sender} text={msg.text}>
//               {/* Render CTAs/alternatives/options only on bot messages when present */}
//               {msg.sender === "bot" && (msg.cta || msg.alternatives || msg.options) && (
//                 <OptionButtons
//                   cta={msg.cta}
//                   alternatives={msg.alternatives}
//                   options={msg.options}
//                   onOpenRoute={openRoute}
//                   // onPickRelated={handlePickRelated} 
//                 />
//               )}
//             </MessageBubble>
//           ))}

//           <TypingIndicator show={loading} />
//           <div ref={chatEndRef} />
//         </div>

//       </div>
//       <ChatInput
//           value={input}
//           onChange={setInput}
//           onSend={handleSend}
//           disabled={loading}
//         />

//       <button className="exit-button" onClick={handleExit}>EXIT CHAT</button>
//     </div>
//   );
// }



// src/pages/ChatBot.js
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ChatBot.css";

import MessageBubble from "../components/ChatBot/MessageBubble";
import ChatInput from "../components/ChatBot/ChatInput";
import TypingIndicator from "../components/ChatBot/TypingIndicator";
import OptionButtons from "../components/ChatBot/OptionButtons";

const initialMessages = [
  { sender: "bot", text: "Hello, what can we assist you with today?" },
  { sender: "bot", text: "Try asking about: Password • Preferences • Dietary • Location • Privacy" }
];

export default function ChatBot({ toggleChat }) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);
  const navigate = useNavigate();

  // --- helpers ---------------------------------------------------------------

  const appendUser = useCallback((text) => {
    setMessages((m) => [...m, { sender: "user", text }]);
  }, []);

  const appendBot = useCallback((payload) => {
    // payload can contain: text, cta, alternatives, options
    setMessages((m) => [...m, { sender: "bot", ...payload }]);
  }, []);

  const openRoute = useCallback((route) => {
    if (!route) return;
    navigate(route);
  }, [navigate]);

  function handleExit() {
    if (typeof toggleChat === "function") toggleChat();
    else navigate(-1);
  }

  // auto scroll when messages/loading change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // --- backend call ----------------------------------------------------------

  async function askBackend(query) {
    const res = await fetch("http://localhost:5001/api/chatBot/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: query })
    });
    if (!res.ok) throw new Error("Server error");
    return res.json();
  }

  // --- send main user query --------------------------------------------------

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    appendUser(text);
    setLoading(true);

    try {
      const data = await askBackend(text);

      if (data.type === "faq") {
        // main answer bubble + show related pills
        appendBot({
          text: data.match.answer,
          cta: { label: data.match.title || data.match.question, route: data.match.route },
          alternatives: data.alternatives // these will render as pills
        });
      } else if (data.type === "fallback") {
        appendBot({ text: data.message, options: data.options });
      } else {
        appendBot({ text: "I couldn’t classify that. Try: Password, Preferences, Dietary, Location, Privacy." });
      }
    } catch (e) {
      appendBot({ text: "Sorry—something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  // --- when a Related pill is clicked ---------------------------------------

  const handlePickRelated = useCallback((faq) => {
    // Append a new bot bubble that shows this related FAQ's answer
    // and includes a CTA button to navigate if the user wants.
    appendBot({
      text: faq.answer || "Here’s what I found.",
      cta: {
        label: faq.question || faq.title || "Open",
        route: faq.route
      }
    });
  }, [appendBot]);

  // --- render ----------------------------------------------------------------

  return (
    <div className="chatbot-wrapper">
      <button className="exit-button" onClick={handleExit}>X</button> 
      <h2 className="chatbot-header">CHATTING WITH NOMBOT</h2>
      

      <div className="chat-window">
        <div className="chatBot-message-container">
          {messages.map((msg, idx) => (
            <MessageBubble key={idx} sender={msg.sender} text={msg.text}>
              {msg.sender === "bot" && (msg.cta || msg.alternatives || msg.options) && (
                <OptionButtons
                  cta={msg.cta}
                  alternatives={msg.alternatives}
                  options={msg.options}
                  onOpenRoute={openRoute}
                  onPickRelated={handlePickRelated}   // <-- important
                />
              )}
            </MessageBubble>
          ))}

          <TypingIndicator show={loading} />
          <div ref={chatEndRef} />
        </div>
      </div>

      <ChatInput
        value={input}
        onChange={setInput}
        onSend={handleSend}
        disabled={loading}
      />

      {/* <button className="exit-button" onClick={handleExit}>EXIT CHAT</button> */}
    </div>
  );
}
