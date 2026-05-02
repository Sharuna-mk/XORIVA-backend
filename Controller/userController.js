const User = require('../Model/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const crypto = require('crypto');
const { sendEmail } = require('../config/sendEmail');



//register

exports.registerUser = async (req, res) => {
    const { username, email, password, phone } = req.body

    try {
        const existingUser = await User.findOne({ email })

        if (!existingUser) {
            return res.status(400).json({ message: "Please complete email verification first" });
        }

        if (!existingUser.otpVerified) {
            return res.status(400).json({ message: "Please verify email first" });
        }

        //otp generation
        const hashedPassword = await bcrypt.hash(password, 10)
        await User.findByIdAndUpdate(existingUser._id, { username, email, phone, password: hashedPassword, isVerified: true }, { new: true })
        res.status(201).json({ message: "User registered successfully" })

    } catch (error) {
        res.status(500).json({ message: "Internal server error", error })
    }
}

//verify user 
exports.sendSignupOTP = async (req, res) => {
    const { email } = req.body;

    try {
        console.log(email);

        const existingUser = await User.findOne({ email });

        if (existingUser && existingUser.isVerified) {
            return res.status(400).json({ message: "User already exists" });
        }
        if (
            (existingUser?.otpLastSentAt) &&
            (Date.now() - existingUser.otpLastSentAt) < 30 * 1000
        ) {
            return res.status(429).json({
                message: "Please wait 30 seconds before requesting OTP again"
            });
        }
        const otp = crypto.randomInt(100000, 999999).toString();

        const hashedOtp = await bcrypt.hash(otp, 6)
        const user = await User.findOneAndUpdate(
            { email },
            {
                email,
                otp: hashedOtp,
                otpExpiry: Date.now() + 5 * 60 * 1000,
                isVerified: false,
                otpLastSentAt: Date.now()
            },
            { upsert: true, returnDocument: 'after' }
        );

        res.status(200).json({ message: "OTP sent", user });

        sendEmail(email, otp).catch(err => {
            console.error("Email failed:", err);
        });

    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.verifySignupOTP = async (req, res) => {
    const { email, otp } = req.body;

    try {

        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required" });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }


        if (user.isVerified) {
            return res.status(400).json({ message: "User already verified" });
        }


        if (!user.otp || !user.otpExpiry) {
            return res.status(400).json({ message: "OTP not found or already used" });
        }

        if (user.otpExpiry < Date.now()) {
            return res.status(400).json({ message: "OTP expired" });
        }

        const isMatch = await bcrypt.compare(otp, user.otp);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            {
                otp: null,
                otpExpiry: null,
                otpVerified: true
            },
            { returnDocument: "after" }
        );

        return res.status(200).json({
            success: true,
            message: "OTP verified successfully",
            user: {
                _id: updatedUser._id,
                email: updatedUser.email,
                otpVerified: updatedUser.otpVerified,
            }
        });

    } catch (error) {
        console.error("OTP VERIFY ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// LOGIN

//user login -password 
exports.loginUsingPassword = async (req, res) => {
    const { email, phone, password } = req.body

    try {
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(400).json({ message: "User not found" });
        }

        if (!existingUser.isVerified) {
            return res.status(400).json({
                message: "Please verify your email first"
            });
        }


        const passwordMatch = await bcrypt.compare(password, existingUser.password)
        if (passwordMatch) {
            const token = jwt.sign({ id: existingUser._id }, process.env.JWT_SECRET, { expiresIn: "7d" })
            res.status(200).json({ message: "Login successful", token })
        }
        else {
            res.status(400).json({ message: "Invalid credentials" })
        }


    } catch (error) {
        res.status(500).json({ message: "Internal server error", error })
    }
}


exports.otpGenerate = async (req, res) => {
    const { email } = req.body

    try {
        const existingUser = await User.findOne({ email })
        if (!existingUser) {
            return res.status(400).json({ message: "User not found" });
        }

        if (!existingUser.isVerified) {
            return res.status(400).json({
                message: "Please verify your email first"
            });
        }


        if (
            existingUser.otpLastSentAt &&
            Date.now() - existingUser.otpLastSentAt < 30 * 1000
        ) {
            return res.status(429).json({
                message: "Please wait 30 seconds before requesting OTP again"
            });
        }

        if (existingUser.otpBlockedUntil && existingUser.otpBlockedUntil > Date.now()) {
            return res.status(403).json({ message: "Too many failed attempts. Please try again later." })
        }

        const otp = crypto.randomInt(100000, 999999).toString();
        const hashedOtp = await bcrypt.hash(otp, 6)

        await User.findByIdAndUpdate(existingUser._id, {
            loginOtp: hashedOtp,
            loginOtpExpiry: Date.now() + 5 * 60 * 1000,
            otpLastSentAt: Date.now()
        });
        res.status(200).json({ message: "OTP sent", user });

        sendEmail(email, otp).catch(err => {
            console.error("Email failed:", err);
        });

    } catch (error) {
        console.error("otpGenerate error:", error.message);
        res.status(500).json({ message: "Internal server error", error: error.message })
    }
}

exports.loginUsingOtp = async (req, res) => {
    const { email, otp } = req.body;

    try {
        if (!email || !otp) {
            return res.status(400).json({ message: "Missing fields" });
        }

        const existingUser = await User.findOne({ email });

        if (!existingUser) {
            return res.status(400).json({ message: "User not found" });
        }

        if (!existingUser.isVerified) {
            return res.status(400).json({ message: "User not verified" });
        }

        if (existingUser.otpBlockedUntil && existingUser.otpBlockedUntil > Date.now()) {
            return res.status(403).json({
                message: "Too many failed attempts. Try again tomorrow."
            });
        }


        if (!existingUser.loginOtp || !existingUser.loginOtpExpiry) {
            return res.status(400).json({ message: "No OTP found. Please request a new one." });
        }


        if (existingUser.loginOtpExpiry < Date.now()) {
            return res.status(400).json({ message: "OTP expired. Please request a new one." });
        }


        const otpMatch = await bcrypt.compare(otp, existingUser.loginOtp);

        if (!otpMatch) {

            const today = new Date().toDateString();

            if (!existingUser.otpAttemptsDate ||
                existingUser.otpAttemptsDate.toDateString() !== today) {
                existingUser.attemptCount = 0;
                existingUser.otpAttemptsDate = new Date();
            }

            existingUser.attemptCount += 1;

            if (existingUser.attemptCount >= 5) {
                existingUser.otpBlockedUntil = Date.now() + 24 * 60 * 60 * 1000;
            }

            await existingUser.save();

            const attemptsLeft = 5 - existingUser.attemptCount;
            return res.status(400).json({
                message: attemptsLeft > 0
                    ? `Invalid OTP. ${attemptsLeft} attempt(s) left.`
                    : "Too many failed attempts. Blocked for 24 hours."
            });
        }


        await User.findByIdAndUpdate(existingUser._id, {
            loginOtp: null,
            loginOtpExpiry: null,
            attemptCount: 0,
            otpAttemptsDate: null,
            otpBlockedUntil: null
        });

        const token = jwt.sign(
            { id: existingUser._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(200).json({ message: "Login successful", token });

    } catch (error) {
        console.error("Login OTP error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Delete User

exports.deleteUser = async (req, res) => {
    const userId = req.params.id
    const { id } = req.payload

    try {


        if (id !== userId) {
            return res.status(403).json({ message: "Unauthorized" })
        }
        await User.findByIdAndDelete(userId, { new: true })
        res.status(200).json({ message: "User deleted successfully" })

    }
    catch (error) {
        res.status(500).json({ message: "Internal server error", error })
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////

//update User

exports.updateUser = async (req, res) => {
    const userId = req.params.id
    const { id } = req.payload
    const { username, email, phone } = req.body

    try {
        if (id !== userId) {
            return res.status(403).json({ message: "Unauthorized" });
        }


        const currentUser = await User.findById(userId);
        if (!currentUser) {
            return res.status(404).json({ message: "User not found" });
        }
        if (!currentUser.isVerified) {
            return res.status(400).json({ message: "Please verify email first" });
        }
        const conflict = await User.findOne({
            $or: [{ email }, { phone }],
            _id: { $ne: userId }
        });

        if (conflict) {
            if (conflict.email === email) {
                return res.status(400).json({ message: "Email already in use" });
            }
            if (conflict.phone === phone) {
                return res.status(400).json({ message: "Phone number already in use" });
            }
        }

        await User.findByIdAndUpdate(userId, { username, email, phone }, { new: true });
        res.status(200).json({ message: "User updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error })
    }
}


//find user

exports.User = async (req, res) => {
    const { email } = req.body
    try {
        const user = await User.findOne({ email })
        if (user && user.isVerified) {
            res.status(200).json({ message: "User found", user })

        }
        else {
            return res.status(400).json({ message: "User not found" })
        }

    } catch (error) {
        res.status(500).json({ message: "Internal server error", error })
    }
}


const admin = require('../config/firebaseAdmin');

exports.googleLogin = async (req, res) => {
    const { token } = req.body;

    try {
        if (!token) {
            return res.status(400).json({ message: "Token missing" });
        }

        const decoded = await admin.auth().verifyIdToken(token);

        const { name, email, picture, uid } = decoded;

        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({
                username: name,
                email,
                profile: picture,
                googleId: uid,
                isVerified: true
            });
        }

        const appToken = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(200).json({
            message: "Google login successful",
            token: appToken,
            user
        });

    } catch (error) {
        console.error("Google Login Error:", error);
        res.status(401).json({ message: "Invalid Google token" });
    }
};