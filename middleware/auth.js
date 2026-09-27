const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    const token = authHeader && authHeader.split(' ')[1];

    if(!token){
        return res.status(401).json({message: 'Access denied. no Token Provided Please login to access this resource.'});
    }

    try{
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    }catch(err){
        res.status(403).json({message: 'Invalid or Expired Token, Please login again to access this resource.'});
        console.error('Token verification error:', err);
    }

};

module.exports = verifyToken;