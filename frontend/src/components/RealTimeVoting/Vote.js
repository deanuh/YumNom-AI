import React, { useRef, useEffect, useState } from "react";
export default function Vote(props) {
	const resultBarRef = useRef(null);
	const [ resultBarSize, setResultBarSize] = useState({width: 0, height: 0});
  const formattedPhase = {
  "round_one": "Round One",
  "round_two": "Round Two",
  "tiebreaker":"Tiebreaker"
  }

  useEffect(() => {
   	const getResultBarSize = () => {
			const { width, height } = resultBarRef.current.getBoundingClientRect();
			setResultBarSize({ width, height });
		}
		if (resultBarRef.current) {
			getResultBarSize();
		}
		window.addEventListener("resize", getResultBarSize);

    return () => {
   		window.removeEventListener("resize", getResultBarSize);
    };

  }, []);

return (
    <div className="voting-page">
    <div className="voting-title-container">
      <h1 className="voting-title">VOTING BEGINS</h1>
      </div>
      <h3 className="round-title">{formattedPhase[props.phaseState]}</h3>
			<p> {props.timer} </p>
      <div className="voting-section">
        <div className="party-column">
        <h4>Party Members</h4>
            {Object.keys(props.partyMembers).map((memberKey) => {
            const member = props.partyMembers[memberKey];
            return (
            <div key={memberKey} className="party-avatar">
              <img src={`/${member.profile_picture}`} alt={member.username} />
              <div>{member.username}</div>
            </div>
          );
          })}
        </div>

        <div className="Voting-restaurant-grid">
          {props.finalRestaurants.map(r => (
            <div
              key={r.id}
              className={`Voting-restaurant-option ${props.vote === r.id ? "selected" : ""}`}
              onClick={() => props.setVote(r.id)}
            >
              <img src={r.image} alt={r.name} />
            </div>
          ))}
          <button className="Voting-submit-button" onClick={props.sendVote} >
            Submit
          </button>
        </div>
      </div>

      <h2 className="Voting-results-title">Results</h2>
      <div className="Voting-results-section">
        {props.finalRestaurants.map((r, i) => (
          <div key={i} className="result-row">
            <img src={r.image} alt={r.name} className="result-icon" />
            <div ref={resultBarRef} className="result-bar-container">
              <div
                className="result-bar"
                style={{ width: `${(props.tally[r.id] || 0) / Object.keys(props.partyMembers).length * resultBarSize.width}px` }}  // the 110 is for how long the vote will appear on the bar
              />
            </div>
            <div className="vote-count">({props.tally[r.id] || 0})</div>
          </div>
        ))}
      </div>
    </div>
  );
}
