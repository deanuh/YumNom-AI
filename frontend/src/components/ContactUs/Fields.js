import React, { useState } from "react";
const Fields = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [showSubjectDropdown, setShowSubjectDropdown] = useState(null);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [message, setMessage] = useState("");
    const toggleSubject = () => {
    setShowSubjectDropdown(!showSubjectDropdown);
  };

    return(

        <div className="fieldsColumn">
            <h5>Name</h5>
            <input
                className="field"
                type="text"
                value={name}
                onChange={() => setName}
            />

            <h5>Email</h5>
            <input
                className="field"
                type="text"
                value={email}
                onChange={() => setEmail}
            />
            <h5>Subject</h5>
            <div className="subject-dropdown">
                <button className="subject-pill" onClick={toggleSubject}>Select query type{selectedSubject ? `: ${selectedSubject} `: ""}</button>
                {showSubjectDropdown && (
                    <div className="dropdown-menu">
                        <label><input type="radio" name="distance" value="query placeholder 1" checked={selectedSubject === "query placeholder 1"} onChange={(e) => setSelectedSubject(e.target.value)}/>query placeholder 1</label>
                        <label><input type="radio" name="distance" value="query placeholder 2" checked={selectedSubject === "query placeholder 2"} onChange={(e) => setSelectedSubject(e.target.value)}/>query placeholder 2</label>
                        <label><input type="radio" name="distance" value="query placeholder 3" checked={selectedSubject === "query placeholder 3"} onChange={(e) => setSelectedSubject(e.target.value)}/>query placeholder 3</label>
                    </div>
                )}
            </div>
            <h5>Message</h5>
            <input 
                className="messageBox"
                type="text"
                value={message}
                onChange={() => setMessage}
            />
            <div>
                <button className="submitButton">Submit</button>
            </div>
        </div>
    );
}
export default Fields;
