import { getAuth } from "firebase-admin/auth";

// IMPORTANT: ALWAYS USE THIS FUNCTION AS MIDDLEWARE BEFORE ROUTING YOUR OWN FUNCTION 
// This validates via TOKEN instead of information presented from the user.
// Never trust data from the frontend. Always verify using JWT.
export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No authorization token provided" });
    }

    const idToken = authHeader.split(" ")[1];
    const decodedToken = await getAuth().verifyIdToken(idToken);

    req.uid = decodedToken.uid;
    next();
  } catch (err) {
    console.error("authMiddleware failed:", err);
    return res.status(401).json({ error: "Unauthorized" });
  }
}

