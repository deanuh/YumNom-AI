// this file is for the different options that the user can choose when given an answer
// like if the user ha a question about changing password, the chatbot will tell it the steps and then
// give the option to go to that tab (in the works fr)

import React from "react";

// export default function OptionButons({ cta, alternatives = [], options = [], onOpenRoute}) {
//     return (
//         <>
//         {cta && (
//             <div style={{ marginTop: "0.4rem"}}>
//                 <button onClick={() => onOpenRoute(cta.route)}>
//                     {cta.label || cta.title || "Open"}
//                 </button>
//             </div>
//         )}

//         {options && options.length > 0 && (
//             <div className="alts" style={{ marginTop: "0.3rem" }}>
//                 <span>Opetions:&nbsp;</span>
//                 {options.map(o => (
//                     <button key={o.id} onClick={() => onOpenRoute(o.route)}>{o.label}</button>
//                 ))}
//             </div>
//         )}

//         {alternatives && alternatives.length > 0 && (
//             <div className="alts" style={{marginTop: "0.3rem"}}>
//                 <span>Related:&nbsp;</span>
//                 {alternatives.map(a => (
//                     <button key={a.id} onClick={() => onOpenRoute(a.route)}>{a.title}</button>
//                 ))}
//             </div>
//         )}
//         </>
            
//     )
// }
import { Link } from "react-router-dom";

export default function OptionButtons({ cta, alternatives = [], options = [], onOpenRoute, onPickRelated }) {
    return (
      <div className="chatbot-bot-actions">
        {cta && (
          <div className="chatbot-cta-wrap">
            <Link to={cta.route} className="chatbot-cta">
              {cta.label || cta.title || "Open"}
            </Link>
          </div>
        )}
  
        {options?.length > 0 && (
          <div className="chatbot-meta-row">
            <span className="chatbot-meta-label">Options:</span>
            <div className="chatbot-pill-row">
              {options.map((o) => (
                <Link key={o.id} to={o.route} className="chatbot-pill">
                  {o.label || o.title || o.question || "Option"}
                </Link>
              ))}
            </div>
          </div>
        )}
  
        {alternatives?.length > 0 && (
          <div className="chatbot-meta-row">
            <span className="chatbot-meta-label">Related:</span>
            <div className="chatbot-pill-row">
              {alternatives.map((a) => (
                <button
                  key={a.id || a.route}
                  type="button"
                  className="chatbot-pill"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onPickRelated) onPickRelated(a);
                  }} >
                  {a.label ||a.title || a.question || "Related Topic"}
                  </button>
                // <Link key={a.id} to={a.route} className="chatbot-pill">
                //   {a.question}
                // </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }