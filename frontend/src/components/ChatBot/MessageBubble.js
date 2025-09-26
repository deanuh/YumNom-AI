// this file will handle the message bubbles that show up in the chatBox

import React from "react";

export default function MessageBubble({sender, text, children}) {
    return (
        <div className={`message-row ${sender}`}>
            <div className={`bubble ${sender}`}>
                {text}
                {children}
            </div>
        </div>
    );
}