import React, { useRef, useEffect, useState, useCallback } from "react";
import SearchRestaurant from "../GroupMealParty/SearchRestaurant";
import SelectedRestaurantDisplay from "../GroupMealParty/SelectedRestaurantDisplay";
import axios from "axios";
export default function Join(props) {
	const base_url = process.env.REACT_APP_BACKEND_URL;

	const gridRef = useRef(null);
	const [gridSize, setGridSize] = useState({width:0, height: 0});

  const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState(search);
	const [selectedRestaurant, setSelectedRestaurant] = useState("");
	const [restaurantObject, setRestaurantObject] = useState(null);
	const [restaurantOptions, setRestaurantOptions] = useState([]);

	const searchRestaurant = useCallback(async () => {
		const response = await axios.get(`${base_url}/restaurantFatSecret`, {
			params: {
				q: debouncedSearch,
			}
		});
		const objectData = response.data;

    let restaurantList = Array.isArray(objectData?.food_brands.food_brand) ? objectData.food_brands.food_brand : [];
		return restaurantList
	}, [base_url, debouncedSearch]);


	const searchLogo = useCallback(async () => {
		const response = await axios.get(`${base_url}/logo`, {
			params: {
				q: selectedRestaurant,
			}
		});
		return response.data;
	}, [base_url, selectedRestaurant]);
		
	useEffect(() => {
		const timeoutRef = setTimeout(() => {
				setDebouncedSearch(search);
		}, 2 * 1000);

		return () => {
			clearTimeout(timeoutRef)
		};
	}, [search]);
	
	useEffect(() => {
	  (async () => {
			if (debouncedSearch === "") {
				setRestaurantOptions([]);
			} else {
	    	const data = await searchRestaurant();
	    	setRestaurantOptions(data);
			}
	  })();
	}, [debouncedSearch, searchRestaurant]);
	
	// Fetch logo when selectedRestaurant changes
	useEffect(() => {
	  if (!selectedRestaurant) return;
	
	  (async () => {
	    const logoData = await searchLogo();
			console.log(logoData);
	    setRestaurantObject(logoData);
	  })();
	}, [selectedRestaurant, searchLogo]);

	const dummyCount = 0;
	const partyMemberList = Object.keys(props.partyMembers);
	const itemCount = partyMemberList.length + dummyCount;
	const squareGridSize = Math.ceil(Math.sqrt(itemCount));
	const animationClass = props.timer <= 15 ? "animate" : "";


	let { width } = gridSize
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
				<div className="Join-section"> 
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
      		<SearchRestaurant
      		  restaurantOptions={restaurantOptions}
      		  search={search}
      		  setSearch={setSearch}
      		  setSelectedRestaurant={setSelectedRestaurant}
      		/>
      	</div>

      		<SelectedRestaurantDisplay restaurantObject={restaurantObject} handleContinue={props.sendNomination} />
    </div>
  );
}
