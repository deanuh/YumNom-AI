export default function Wait(props) {

return (
    <div className="voting-page">
    <div class="voting-title-container">
      <h1 className="voting-title">THE VOTES ARE IN!</h1>
      </div>
			<div className="voting-timer">{props.timer}</div>
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

	      <div className="Wait-voting-results-section">
					<h4 className="Wait-voting-results-title">Results</h4>
	        {props.finalRestaurants.filter(restaurant => 
						Object.keys(props.results).includes(restaurant.id)
					).map((r, i) => (

	          <div key={i} className="Wait-result-row">
	            <img src={r.image} alt={r.name} className="Wait-result-icon" />
	            <div className="Wait-result-bar-container">
	              <div className="Wait-result-bar" style={{ width: `${((props.tally[r.id] || 0) / Object.keys(props.partyMembers).length) * 100}%` }}  // the 110 is for how long the vote will appear on the bar
	              />
	            </div>
	            <div className="Wait-vote-count">({props.tally[r.id] || 0})</div>
	          </div>
	        ))}
	      </div>

      </div>
		</div>
);
}
