import axios from "axios";
const base_url = process.env.REACT_APP_BACKEND_URL;

export const createUser = async (
	first_name = "",
	last_name = "",
	username = "",
	JWT = "",
  ) => {
	try {
	  const options = {
			method: "POST",
			url: base_url + "/users",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${JWT}`
			},
			data: {
			  first_name,
				last_name,
				username
			}
	  };
	  const response = await axios(options);
	  return response.data;
	} catch (err) {
	  console.log(err);
	}
};
  
