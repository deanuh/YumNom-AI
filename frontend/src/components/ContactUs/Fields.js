import React, { useState } from "react";
import { isEmail }from "validator";

const Fields = () => {

	const validSubjectTypes = ["Question", "Issue", "Feature Request"];
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(null);
  const [subject, setSubject] = useState(null);
  const [message, setMessage] = useState("");
	const [errorMessage, setErrorMessage] = useState("");

  const toggleSubject = () => {
    setShowSubjectDropdown(!showSubjectDropdown);
  };
	const submitIssue = async () => {
		if (!isEmail(email)) {
			setErrorMessage("Email must be valid.");
			console.error(`email not correct format`);
			return;
		}
		if (!name) {
			setErrorMessage("Name must be non-empty.");
			console.error(`name not correct format`);
			return;
		}
		if (!validSubjectTypes.includes(subject)) {
			setErrorMessage("Choose a subject type");
			console.error(`subject not correct format`);
			return;
		}
		if (!message) {
			setErrorMessage("Message must be non-empty.");
			console.error(`message not correct format`);
			return;
		}


	  const issueInfo = { email, name, subject, message };

	
	  try {
	    const options = {
	      method: "POST",
	      headers: { "Content-Type": "application/json" },
	      body: JSON.stringify(issueInfo)
	    };
	
	    await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/contact`, options);
			setErrorMessage("");

	  } catch (err) {
			setErrorMessage("Error sending contact form. Try again later.");
	    console.error(`submitIssue failed: ${err.message}`);
	  }
	};	


    return(

        <div onClick={() => setShowSubjectDropdown(false)} className="contactUsFieldsColumn">
            <h5>Name</h5>
            <input
                className="contactUsField"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />

            <h5>Email</h5>
            <input
                className="contactUsField"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <h5>Subject</h5>
            <div className="contactUsSubjectDropdown" onClick={(e) => e.stopPropagation()}>
                <button className="contactUsSubjectPill" onClick={toggleSubject}>{subject ? `${subject} `: "Select query type"}</button>
                {showSubjectDropdown && (
                    <div className="contactUsDropdownMenu">
									{validSubjectTypes.map((s, i) => (
                        <label key={i}><input type="radio" name="distance" value={s} checked={subject === s} onChange={(e) => setSubject(e.target.value)}/>{s}</label>))}
                    </div>
                )}
            </div>
            <h5>Message</h5>
            <textarea
                className="contactUsMessageBox"
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
            />
            <div>
                <button onClick={submitIssue} className="contactUsSubmitButton">Submit</button>
            </div>
            {errorMessage && <p className="contactUsErrorText">{errorMessage}</p>}
        </div>
    );
}
export default Fields;
