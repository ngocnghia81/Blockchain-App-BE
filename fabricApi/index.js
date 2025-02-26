const express = require("express");
const { GetIdentity } = require("./Admin");
const { Register } = require("./User");
const { Login } = require("./controllers/authController");

const app = express();
app.use(express.json());

// API lấy thông tin Identity
app.get("/identity/:username", async (req, res) => {
    try {
        const { username } = req.params;
        if (!username) {
            return res
                .status(400)
                .json({ success: false, message: "Username is required" });
        }
        const result = await GetIdentity(username);
        res.json({ success: true, data: result });
    } catch (error) {
        console.error("Error fetching identity:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
});

// API đăng ký người dùng
app.post("/register", async (req, res) => {
    try {
        const {
            commonName,
            organization,
            organizationalUnit,
            country,
            state,
            locality,
        } = req.body;

        if (
            !commonName ||
            !organization ||
            !organizationalUnit ||
            !country ||
            !state ||
            !locality
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "All fields (commonName, organization, organizationalUnit, country, state, locality) are required",
            });
        }

        await Register(req, res);
    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
});
app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await Login(username, password);
        if (result.success) {
            return res.status(200).json(result);
        } else {
            return res.status(401).json(result);
        }
    } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
});

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
