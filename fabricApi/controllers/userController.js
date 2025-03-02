const db = require("../config/connectToDB");
const userService = require("../services/userService");

// Hàm kiểm tra đầu vào
const validateInput = (data) => typeof data === "string" && data.trim() !== "";

// Tạo chỉnh sửa PIN
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

// Tạo/chỉnh sửa PIN
exports.updatePin = async (req, res) => {
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

exports.getUsers = async (req, res) => {
    try {
        const data = await userService.getUsers();
        console.log(data);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getUserDetail = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Thiếu ID người dùng",
            });
        }

        const result = await userService.getUserDetail(id);

        if (!result.users || result.users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy người dùng",
            });
        }

        return res.status(200).json(result);
    } catch (error) {
        console.error("Lỗi khi lấy thông tin người dùng:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi server",
        });
    }
};
