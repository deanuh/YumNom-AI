
export default function Join(props) {
return (
    <div className="voting-page">
      <div className="voting-title-container">
        <h1 className="voting-title">WAITING FOR MEMBERS...</h1>
        </div>
        <p> {props.timer} </p>
        <div className="Join-party-section">
          <h4 className="Join-party-title">Party Members</h4>
          <div className="Join-party-grid">
                {Object.keys(props.partyMembers).map((memberKey) => {
                const member = props.partyMembers[memberKey];
                return (
                	<div key={memberKey} className="Join-party-avatar">
                  	<img src={`/${member.profile_picture}`} alt={member.username} />
                  	<div>{member.username}</div>
                	</div>
              );
              })}
								{(() => {
									const dummies = [];
									for (let i = 0; i < 21; i++) {
										dummies.push(
											<div className="Join-party-avatar">
												<img src="/ban_gato.png" alt="gato" />
												<div>dummy</div> 
											</div>
										);
									}
									return dummies;
								})()}
				</div>
      </div>
    </div>
  );
}
