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

        <div className="contactUsFieldsColumn">
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
            <div className="subject-dropdown">
                <button className="contactUsSubjectPill" onClick={toggleSubject}>Select query type{selectedSubject ? `: ${selectedSubject} `: ""}</button>
                {showSubjectDropdown && (
                    <div className="dropdown-menu">
                        <label><input type="radio" name="distance" value="query placeholder 1" checked={selectedSubject === "query placeholder 1"} onChange={(e) => setSelectedSubject(e.target.value)}/>query placeholder 1</label>
                        <label><input type="radio" name="distance" value="query placeholder 2" checked={selectedSubject === "query placeholder 2"} onChange={(e) => setSelectedSubject(e.target.value)}/>query placeholder 2</label>
                        <label><input type="radio" name="distance" value="query placeholder 3" checked={selectedSubject === "query placeholder 3"} onChange={(e) => setSelectedSubject(e.target.value)}/>query placeholder 3</label>
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
                <button className="contactUssubmitButton">Submit</button>
            </div>
        </div>
    );
}
export default Fields;
