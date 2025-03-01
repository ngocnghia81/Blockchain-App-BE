const authService = require("../services/authService");

const register = async (req, res) => {
    try {
        const result = await authService.Register(req, res);
        if (result.success) {
            return res.status(201).json(result);
        } else {
            return res.status(400).json(result);
        }
    } catch (error) {
        return res
            .status(500)
            .json({ success: false, message: "Server error" });
    }
};

const login = async (req, res) => {
    try {
        const result = await authService.Login(
            req.body.username,
            req.body.password
        );
        if (result.success) {
            return res.status(200).json(result);
        } else {
            return res.status(401).json(result);
        }
    } catch (error) {
        return res
            .status(500)
            .json({ success: false, message: "Server error" });
    }
};

module.exports = { register, login };
