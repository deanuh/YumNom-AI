
export default function Wait(props) {

return (
    <div className="voting-page">
    <div class="voting-title-container">
      <h1 className="voting-title">PLACEHOLDER</h1>
      </div>
      <h3 className="round-title">Waiting...</h3>
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
        <div className="Voting-results-section">
          {(props.finalRestaurants || []).map((r, i) => (
            <div key={i} className="result-row">
              <img src={r.image} alt={r.name} className="result-icon" />
              <div className="result-bar-container">
                <div className="result-bar"/>
              </div>
              <div className="vote-count">({props.tally[r.id] || 0})</div>
            </div>
          ))}
        </div>

        </div>

      </div>

      <h2 className="Voting-results-title">Results</h2>
          </div>
);
}
