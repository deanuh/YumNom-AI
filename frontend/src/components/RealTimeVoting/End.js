export default function End(props) {

return (
    <div className="voting-page">
      <div class="voting-title-container">
        <h1 className="voting-title">RESULTS</h1>
      </div>
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
			<div className="End-results-section">
			{(() => { 
				const restaurantObject = props.finalRestaurants.find(restaurant => restaurant.id === props.winner);
				return (
					<div>
						<img className="End-results-icon" src={restaurantObject.image} alt={restaurantObject.name} />
						<div>{restaurantObject.name}</div>
					</div>
				);
			})()}

			</div>

      </div>
    </div>
);
}
