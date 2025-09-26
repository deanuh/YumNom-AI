// this file is for the different options that the user can choose when given an answer
// like if the user ha a question about changing password, the chatbot will tell it the steps and then
// give the option to go to that tab (in the works fr)

import React from "react";

export default function OptionButons({ cta, alternatives = [], options = [], onOpenRoute}) {
    return (
        <>
        {cta && (
            <div style={{ marginTop: "0.4rem"}}>
                <button onClick={() => onOpenRoute(cta.route)}>
                    {cta.label || cta.title || "Open"}
                </button>
            </div>
        )}

        {options && options.length > 0 && (
            <div className="alts" style={{ marginTop: "0.3rem" }}>
                <span>Opetions:&nbsp;</span>
                {options.map(o => (
                    <button key={o.id} onClick={() => onOpenRoute(o.route)}>{o.label}</button>
                ))}
            </div>
        )}

        {alternatives && alternatives.length > 0 && (
            <div className="alts" style={{marginTop: "0.3rem"}}>
                <span>Related:&nbsp;</span>
                {alternatives.map(a => (
                    <button key={a.id} onClick={() => onOpenRoute(a.route)}>{a.title}</button>
                ))}
            </div>
        )}
        </>
            
    )
}
