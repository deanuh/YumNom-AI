// this file will handle the chat input, what the user sends to the chatbox

import React from "react";

export default function ChatInput({ value, onChange, onSend, disabled }) {
    return (
        <div className="chatBot-input-area">
            <input type="text" placeholder="Type Here" value={value} onChange={(e) => onChange(e.target.value)} 
                onKeyDown={(e) => (e.key === "Enter" ? onSend() : null)}
                disabled={disabled}
            />
            <button onClick={onSend} disabled={disabled}>ENTER</button>
        </div>
    );
}