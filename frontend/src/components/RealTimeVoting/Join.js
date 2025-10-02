import React, { useRef, useEffect, useState } from "react";

export default function Join(props) {
	const gridRef = useRef(null);
	const [gridSize, setGridSize] = useState({width:0, height: 0});

	const dummyCount = 2;
	const partyMemberList = Object.keys(props.partyMembers);
	const itemCount = partyMemberList.length + dummyCount;
	const squareGridSize = Math.ceil(Math.sqrt(itemCount));
	const animationClass = props.timer <= 15 ? "animate" : "";


	let { width } = gridSize
	console.log(gridSize);
	const max_grid_w = Math.trunc(width / 300); // approximately the size of the grid cell.
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

		return () => {
   		window.removeEventListener("resize", getGridSize);
		};
	}, []);


	return (
    <div className="voting-page">
      <div className="voting-title-container">
        <h1 className="voting-title">WAITING FOR MEMBERS...</h1>
        </div>
        <div key={props.timer} className={`voting-timer ${animationClass}`}> {props.timer} </div>
        <div className="Join-party-section">
          <h4 className="Join-party-title">Party Members</h4>
          <div ref={gridRef} style={gridStyle} className="Join-party-grid">
                { partyMemberList.map((memberKey)=> {
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
									for (let i = 0; i < dummyCount; i++) {
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
