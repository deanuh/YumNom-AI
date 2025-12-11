// this file will show the user that the chatbot is coming up with an answer to their question

import React from "react";

export default function TypingIndicator({ show }) {
    if (!show) return null;  
    return (
        <div className="message-row bot">
            <div className="bubble bot">NomBot is typing ...</div>
        </div>
    );
}