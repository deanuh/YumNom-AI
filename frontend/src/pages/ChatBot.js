// the js file for the chatbot...going to try just putting a place holder about the app
import React, { useState, useRef, useEffect } from "react";
// import { useNavigate } from "react-router-dom";

import "../styles/ChatBot.css";

const initialMessages = [
  { sender: "bot", text: "Hello, what can we assist you with today?" },
  { sender: "bot", text: "1. Account Inquiry" },
  { sender: "bot", text: "2. User preference/dietary concern" },
  { sender: "bot", text: "3. How to...?" }
];

const responses = {
  "1": "Sure! Let’s look into your account inquiry...",
  "2": "Got it. Tell us about your preferences or concerns!",
  "3": "Here’s a guide on how to get started..."
};

function ChatBot({toggleChat}) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const chatEndRef = useRef(null);

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessages = [
      ...messages,
      { sender: "user", text: input },
      { sender: "bot", text: responses[input.trim()] || "Please choose 1, 2, or 3." }
    ];

    setMessages(newMessages);
    setInput("");
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // const navigate = useNavigate();

  const handleExit = () => {
    toggleChat(); // change to the route to AI REC
  };


  return (
    <div className="chatbot-wrapper">
      <h2 className="chatbot-header">CHATTING WITH NOMBOT</h2>
      <div className="chat-window">
        <div className="message-container">
            {messages.map((msg, i) => (
                <div key={i} className={`message-row ${msg.sender}`}>
                <div className={`bubble ${msg.sender}`}>{msg.text}</div>
                </div>
            ))}
            <div ref={chatEndRef} />
        </div>

        <div className="input-area">
          <input
            type="text"
            placeholder="Type Here"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button onClick={handleSend}>ENTER</button>
        </div>
      </div>
      <button className="exit-button" onClick={handleExit}>EXIT CHAT</button>

    </div>
  );
}

export default ChatBot;
