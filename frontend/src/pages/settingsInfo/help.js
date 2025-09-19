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

  const faqs = [  // the questions that user might ask
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
    {
      question: "What is Group Meal Party?",
      answer:
        "Group Meal Party is a way for you and your friends who also have a YumNom account to choose where to eat. Each memeber will choose a restaurant of their choice and then there will be a voting poll to decide a winning location on where to eat!",
    },
    {
      question: "Do I need to sign a contract?",
      answer:
        "Not at all! The only thing we require from you is your location which you can turn on or off in the 'Location Preference' tab in settings",
    },
    {
      question: "Do you have any physical locations?",
      answer:
        "No we do not, but if you have any questions or concerns you can reach out to us at the 'Contact Us' tab. Type in your full name, your YumNom account email, and your message!",
    },
    {
      question: "How do I contact YumNom representatives",
      answer:
        "Go to the 'Contact Us' tab on the left side navigation bar and fill out the form!",
    },
    {
      question: "How do I delete my account?",
      answer:
        "Go to the settings page by clicking the 'Back' button on the top of the page, or the 'Settings' tab on the navigation bar on the left. Scroll down to the bottom of the page and click 'Delete Account'. Follow the steps and then you're set!",
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

