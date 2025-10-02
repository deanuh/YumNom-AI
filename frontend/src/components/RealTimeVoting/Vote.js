import React, { useRef, useEffect, useState } from "react";
export default function Vote(props) {
	const resultBarRef = useRef(null);
	const [ resultBarSize, setResultBarSize] = useState({width: 0, height: 0});
	const gridRef = useRef(null);
	const [gridSize, setGridSize] = useState({width:0, height: 0});
	const animationClass = props.timer <= 15 ? "animate" : "";
  const formattedPhase = {
  "round_one": "ROUND ONE",
  "round_two": "ROUND TWO",
  "tiebreaker":"TIEBREAKER"
  }

	const restaurantItems = props.finalRestaurants.filter(restaurant =>
    (props.choices || []).includes(restaurant.id)
  );
	const dummyCount = 10;
	const itemCount = restaurantItems.length + dummyCount;
	const squareGridSize = Math.ceil(Math.sqrt(itemCount));
	let { width } = gridSize
	console.log(gridSize);
	const max_grid_w = Math.trunc(width / 200); // approximately the size of the grid cell.
	let gridStyle = {
			gridTemplateColumns: `repeat(${squareGridSize}, 1fr)`,
			gridTemplateRows: `repeat(${squareGridSize},  1fr)`
		}

	if (max_grid_w < squareGridSize) {
			gridStyle.gridTemplateColumns = `repeat(${max_grid_w},  1fr)`;
			gridStyle.gridTemplateRows = `repeat(${Math.ceil(itemCount / max_grid_w)}, 1fr)`;
	}

  useEffect(() => {

   	const getGridSize = () => {
			const { width, height } = gridRef.current.getBoundingClientRect();
			setGridSize({ width, height });
		}
		if (gridRef.current) {
			getGridSize();
		}
		window.addEventListener("resize", getGridSize);


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
   		window.removeEventListener("resize", getGridSize);
    };

  }, []);

return (
    <div className="voting-page">
    <div className="voting-title-container">
      <h1 className="voting-title">{formattedPhase[props.phaseState]}</h1>
      </div>
			<div key={props.timer} className={`voting-timer ${animationClass}`}> {props.timer} </div>
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
				<div className="Voting-restaurant-grid-container">
        	<div ref={gridRef} className="Voting-restaurant-grid"
						style={gridStyle}
						>
						{props.finalRestaurants.filter(restaurant => 
							(props.choices || []).includes(restaurant.id)
						).map(r => (
        	    <div
        	      key={r.id}
        	      className={`Voting-restaurant-option ${props.vote === r.id ? "selected" : ""}`}
        	      onClick={() => props.setVote(r.id)}
        	    >
        	      <img src={r.image} alt={r.name} />
        	    </div>
        	  ))}
						{(() => {
							const gridItems = [];
							for (let i = 0; i < dummyCount; i++) {
								gridItems.push(
									<div className="Voting-restaurant-option">
        	      		<img src={props.finalRestaurants[0].image} alt="dummy" />
        	    		</div>);
							}
							return gridItems
						})()}
        	</div>
      	  <button className="Voting-submit-button" onClick={props.sendVote} >
      	    Submit
      	  </button>
				</div>
      </div>

      <h2 className="Voting-results-title">Results</h2>
      <div className="Voting-results-section">
        {props.finalRestaurants.filter(restaurant => 
					(props.choices || []).includes(restaurant.id)
				).map((r, i) => (
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
