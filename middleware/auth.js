import  jwt  from "jsonwebtoken"
import ENV from '../config.js'


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
    const existingSession = await getActiveSession(userId);
    if (existingSession) {
      await client.delete(existingSession._id);
    }
    return true;
  }
  
  