import  jwt  from "jsonwebtoken"
import ENV from '../config.js'
import { client } from "../model/client.js";


export default async function Auth(req, res, next){
    try {
        
        const token = req.headers.authorization.split(" ")[1];

        const decodedToken = jwt.verify(token, ENV.JWT_SECRET);

        req.user = decodedToken;

        // res.json(decodedToken);
        next();

    } catch (error) {
        res.status(401).json({err: "Authentication Failed"})
    }
}

export function localVariables(req,res,next){
    req.app.locals = {
        OTP : null,
        resetSession : false
    }
    next()
}


// Database session monitoring functions
export async function getActiveSession(userId) {
    const query = `*[_type == "session" && userId == $userId][0]`;
    const session = await client.fetch(query, { userId });
  
    return session || null;
  }

  export async function createActiveSession(userId, deviceInfo) {
    // First, remove any existing session for the user.
    const existingSession = await getActiveSession(userId);
    if (existingSession) {
      await client.delete(existingSession._id);
    }
  
    // Now, create a new session for the user.
    const sessionData = {
      _type: "session",
      userId: userId,
      createdAt: new Date().toISOString(),
      deviceInfo: deviceInfo
    };
  
    const newSession = await client.create(sessionData);
    return newSession;
  }

export async function clearActiveSession(userId) {
    try {
       
         // Fetch the session id for the given userId
         const query = `*[_type == "session" && userId == $userId]`;
         const params = { userId };
         
         const sessions = await client.fetch(query, params);
        
         if (sessions && sessions.length > 0) {
            // Use the first session's _id to delete (assuming one session per user)
            // If there can be multiple sessions, you might want to loop over the results and delete each one
            await client.delete(sessions[0]._id);
        }
        return true;
    } catch (error) {
        console.error("Error clearing active session:", error);
        return false;
    }
}

  