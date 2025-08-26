// this is the code to search for a restaurant when entering a restaurant into the search bar.
//
import axios from "axios";
const base_url = process.env.REACT_APP_BACKEND_URL;

export const getRestaurant = async (longitude='', latitude='', radius='', radiusUnits='') => {
	try {
		var options = {
			url: base_url + '/restaurant',
			params: {
				...(latitude && longitude && radius && radiusUnits ? {latitude, longitude, radius, radiusUnits} : {}),
			},
		}
		const response = await axios(options);
		return response.data;
	}
	catch (err) {
		console.log(err);
	}
}
