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