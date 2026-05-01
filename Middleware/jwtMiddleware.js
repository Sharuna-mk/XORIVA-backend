const jwt = require('jsonwebtoken');

const jwtMiddleware = async(req,res,next)=>{
    const token = req.headers.authorization?.split(" ")[1]

        try {
            const jwtVerification = await jwt.verify(token,process.env.JWT_SECRET)        
            req.payload = jwtVerification
            
            next()
        }catch (error) {
          res.status(401).json({message:"Unauthorized",error})   
        }
    
}

module.exports = jwtMiddleware