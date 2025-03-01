const db = require("../config/connectToDB");

// Hàm kiểm tra đầu vào
const validateInput = (data) => typeof data === "string" && data.trim() !== "";

// Tạo/chỉnh sửa PIN
exports.createPin = async (req, res) => {
    try {
        const { pin, username } = req.body;

        // Kiểm tra đầu vào hợp lệ
        if (!validateInput(pin) || !validateInput(username)) {
            return res.status(400).json({
                success: false,
                message: "Invalid input. PIN and username are required.",
            });
        }

        const sql = "UPDATE users SET pin_code = ? WHERE username = ?";
        const [result] = await db.promise().query(sql, [pin, username]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found or PIN not updated.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "PIN updated successfully.",
        });
    } catch (error) {
        console.error("Error updating PIN:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while updating PIN.",
        });
    }
};

// Lấy PIN
exports.getPin = async (req, res) => {
    try {
        const { username } = req.body;

        // Kiểm tra đầu vào hợp lệ
        if (!validateInput(username)) {
            return res.status(400).json({
                success: false,
                message: "Invalid input. Username is required.",
            });
        }

        const sql = "SELECT pin_code FROM users WHERE username = ?";
        const [rows] = await db.promise().query(sql, [username]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "PIN retrieved successfully.",
            pin: rows[0].pin_code,
        });
    } catch (error) {
        console.error("Error retrieving PIN:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while retrieving PIN.",
        });
    }
};
