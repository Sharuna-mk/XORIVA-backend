const User = require("../Model/userModel");

const adminMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.payload?.id).select("role");
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    req.admin = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Admin access required" });
  }
};

module.exports = adminMiddleware;