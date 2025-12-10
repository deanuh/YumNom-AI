import axios from "axios";
import "dotenv/config";

const secret_key = process.env.LOGO_SECRET_KEY;
const public_key = process.env.LOGO_PUBLIC_KEY;
const base_url = "https://api.logo.dev";
const emptyToUndef = (v) => (v && String(v).trim() !== "" ? v : undefined);

export async function getLogo(req, res, next) {
	try {
		const q = emptyToUndef(req.query.q);	
		if (!q) return res.status(400).json({error: "Missing required fields."});

		const response = await axios.get(`${base_url}/search`, {
			headers: { "Authorization": `Bearer: ${secret_key}` },
      params: { 
				q
			},
    });
		const name = response.data[0].name;
		const logo_url = response.data[0].logo_url;
		return res.json({name, logo_url});

		
	} catch (err) {
		console.error(err.message);
	}
}

export async function fetchLogoData(query) {
	try {
		const q = emptyToUndef(query);	
		if (!q) throw new Error("No query for fetchLogoData.");

		const response = await axios.get(`${base_url}/search`, {
			headers: { "Authorization": `Bearer: ${secret_key}` },
      params: { 
				q
			},
    });

    const first = response.data?.[0];
    if (!first) throw new Error(`No logo found for query "${q}"`);

		const name = query;
		const logo_url = response.data[0].logo_url;
		return {name, logo_url};

		
	} catch (err) {
		console.error(err.message);
		return null;
	}
}


