
export default function Join(props) {
return (
    <div className="voting-page">
    <div class="voting-title-container">
      <h1 className="voting-title">GROUP PARTY</h1>
      </div>
      <h3 className="round-title">Join</h3>
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

    </div>

    </div>
  );
}
