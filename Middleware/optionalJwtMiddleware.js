const jwt = require("jsonwebtoken");

const optionalJwtMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return next();
  try {
    req.payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
  next();
};

module.exports = optionalJwtMiddleware;