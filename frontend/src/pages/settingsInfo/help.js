// if the user needs help with something - make pre-asked questions
// function Help() {
//     return <div><h3>Page to help users with certain questions</h3>
//     <p>Pre-made question prompts</p></div>;
//   }
// export default Help;
import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // for navigation
import "../../styles/settings.css"; // adjust path if needed

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);

  return (
    <li
      className={`faq-item ${open ? "open" : ""}`}
      onClick={() => setOpen(!open)}
    >
      <div className="faq-header">
        <span className="faq-question">{question}</span>
        <span className={`faq-arrow ${open ? "rotated" : ""}`}>›</span>
      </div>
      {open && <div className="faq-answer">{answer}</div>}
    </li>
  );
}

function Help() {
  const navigate = useNavigate();

  const faqs = [
    {
      question: "How do I reset my password?",
      answer:
        "Go to the Settings page (click the back button), click 'Change password', and follow the instructions sent to your email!",
    },
    {
      question: "How do I update my dietary restrictions?",
      answer:
        "Navigate to your profile page by clicking on 'User Profile' in the left navigation page. From there, you can click on the 'Dietary Restrictions' tab and add/delete any restrictions you want!",
    },
    {
      question: "How do I update my user profile picture?",
      answer:
        "Navigate to your profile page by clicking on 'User Profile' in the left navigation page. Click on the edit button on the top right corner and from there you can upload a new photo.",
    },
    {
      question: "How do I change my food preferences?",
      answer:
        "Navigate to your profile page by clicking on 'User Profile' in the left navigation page. Either scroll to the food prefrence section or click on it under 'Profile Management'. From there you can update your preferences.",
    },
    {
      question: "How do I access my favorite restaurants/dishes?",
      answer:
        "There is a 'Favorites' tab on the left navigation bar. You can filter what you have favorited by restaurant or dishes.",
    },
  ];

  return (
    <div className="Set-settings-body">
      {/* Back button */}
      <button className="Set-back-button" onClick={() => navigate("/settings")} > ← Back to Settings </button>

      <div className="Set-settings-card">
        <div className="Set-settings-title">Frequently Asked Questions</div>
        <ul className="Set-help">
          {faqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Help;

