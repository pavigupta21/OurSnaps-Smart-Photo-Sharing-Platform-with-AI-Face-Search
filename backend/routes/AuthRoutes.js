const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../database/db");
const router = express.Router();
const jwt = require("jsonwebtoken");
const otpStore = {};
const pendingRegistrations = {};
const { sendOTP } = require("../services/emailService");

router.post("/register", async (req, res) => {
    let existingUser;
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        });
    }
    try{

        existingUser = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );
        
    }catch(error){
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Database error"
        });
    }
    

if (existingUser.rows.length > 0) {
    return res.status(400).json({
        success: false,
        message: "Email already registered"
    });
}

    pendingRegistrations[email] = {
    fullName,
    email,
    password
};

const otp = Math.floor(
    100000 + Math.random() * 900000
).toString();

otpStore[email] = {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000
};

try {

    await sendOTP(email, otp);

    res.status(200).json({
        success: true,
        message: "OTP sent successfully. Please verify your email."
    });

} catch (error) {
    console.error("OTP ERROR:", error);

    res.status(500).json({
        success: false,
        message: "Failed to send OTP"
    });

}
});


router.get("/users", async (req, res) => {

    try{
        const result = await pool.query(
        "SELECT id, full_name, email, created_at FROM users");
        res.json(result.rows);
    }catch(error){
        res.status(500).json({
        success: false,
        message: "Failed to fetch users"
    });
    }

    
});

router.post("/login", async (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required"
        });
    }

        const result = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({
            success: false,
            message: "User not found"
        });
    }

    const user = result.rows[0];
    
    const isMatch = await bcrypt.compare(
        password,
        user.password_hash
    );

    if (!isMatch) {
        return res.status(401).json({
            success: false,
            message: "Invalid credentials"
        });
    }

    const otp = Math.floor(
    100000 + Math.random() * 900000
    ).toString();

    otpStore[email] = {
        otp,
        expiresAt: Date.now() + 5 * 60 * 1000
    };

    await sendOTP(email, otp);

    res.status(200).json({
        success: true,
        message: "OTP sent successfully"
    });
});

router.post("/send-otp", async (req, res) => {

    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            success: false,
            message: "Email is required"
        });
    }

    const otp = Math.floor(
        100000 + Math.random() * 900000
    ).toString();
    otpStore[email] = {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000
};

    try {

        await sendOTP(email, otp);

        res.json({
            success: true,
            message: "OTP sent successfully",

        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: "Failed to send OTP"
        });

    }
});
router.post("/verify-otp", (req, res) => {

    const { email, otp } = req.body;

    const record = otpStore[email];

    if (!record) {
        return res.status(400).json({
            success: false,
            message: "OTP not found"
        });
    }

    if (Date.now() > record.expiresAt) {

        delete otpStore[email];

        return res.status(400).json({
            success: false,
            message: "OTP expired"
        });
    }

    if (record.otp !== otp) {
        return res.status(400).json({
            success: false,
            message: "Invalid OTP"
        });
    }

    delete otpStore[email];

    res.json({
        success: true,
        message: "OTP verified successfully"
    });
});

router.post("/verify-register-otp", async (req, res) => {

    const { email, otp } = req.body;

    const record = otpStore[email];

    if (!record) {
        return res.status(400).json({
            success: false,
            message: "OTP not found"
        });
    }

    if (Date.now() > record.expiresAt) {

        delete otpStore[email];

        return res.status(400).json({
            success: false,
            message: "OTP expired"
        });
    }

    if (record.otp !== otp) {
        return res.status(400).json({
            success: false,
            message: "Invalid OTP"
        });
    }

    const pendingUser =
        pendingRegistrations[email];

    if (!pendingUser) {
        return res.status(400).json({
            success: false,
            message: "Registration data not found"
        });
    }

    const hashedPassword =
        await bcrypt.hash(
            pendingUser.password,
            10
        );

        const existingUser = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
    );

    if (existingUser.rows.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Email already registered"
        });
    }
        try {

        await pool.query(
            `INSERT INTO users
            (full_name, email, password_hash)
            VALUES ($1, $2, $3)`,
            [
                pendingUser.fullName,
                pendingUser.email,
                hashedPassword
            ]
        );

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Database error",
            user: {
                fullName: pendingUser.fullName,
                email: pendingUser.email
            }
        });

    }

    delete otpStore[email];
    delete pendingRegistrations[email];

    const result = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
    );

    const user = result.rows[0];

    const token = jwt.sign(
        {
            userId: user.id,
            email: user.email
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );

    res.json({
        success: true,
        message: "Registration completed successfully",
        token,
        user: {
            id: user.id,
            fullName: user.full_name,
            email: user.email
        }
    });
});
router.post("/verify-login-otp", async (req, res) => {

    const { email, otp } = req.body;

    const record = otpStore[email];

    if (!record) {
        return res.status(400).json({
            success: false,
            message: "OTP not found"
        });
    }

    if (Date.now() > record.expiresAt) {

        delete otpStore[email];

        return res.status(400).json({
            success: false,
            message: "OTP expired"
        });
    }

    if (record.otp !== otp) {
        return res.status(400).json({
            success: false,
            message: "Invalid OTP"
        });
    }

    try {

        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const user = result.rows[0];

        delete otpStore[email];

        const token = jwt.sign(
        {
            userId: user.id,
            email: user.email
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );
        res.json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user.id,
                fullName: user.full_name,
                email: user.email
            }
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Database error"
        });
    }
});

const authMiddleware =
require("../middleware/authMiddleware");

router.get(
    "/profile",
    authMiddleware,
    async (req, res) => {

        try {

            const result = await pool.query(
                "SELECT id, full_name, email FROM users WHERE id = $1",
                [req.user.userId]
            );

            res.json({
                success: true,
                user: result.rows[0]
            });

        } catch (error) {

            res.status(500).json({
                success: false,
                message: "Database error"
            });

        }
    }
);

router.put(
    "/update-profile",
    authMiddleware,
    async (req, res) => {

        const { fullName, profilePic } = req.body;

        try {

            const result = await pool.query(
                `
                UPDATE users
                SET
                    full_name = $1,
                    profile_pic = $2
                WHERE id = $3
                RETURNING id, full_name, email, profile_pic
                `,
                [
                    fullName,
                    profilePic,
                    req.user.userId
                ]
            );

            res.json({
                success: true,
                user: result.rows[0]
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                success: false,
                message: "Failed to update profile"
            });

        }
    }
);
module.exports = router;