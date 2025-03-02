const db = require("../config/connectToDB");

exports.getUsers = async () => {
    try {
        const users = await db.query(
            "SELECT id, username, email, common_name, role, created_at FROM users"
        );
        console.log(users); // Debug xem kết quả có đúng là danh sách không
        return { success: true, users }; // Trả về danh sách đầy đủ
    } catch (error) {
        console.error("Lỗi khi lấy danh sách người dùng:", error);
        throw new Error("Lỗi server");
    }
};

exports.getUserDetail = async (id) => {
    try {
        const [users] = await db.query(
            "SELECT id, username, email, citizen_id, role, common_name, organization, organizational_unit, country, state, locality, created_at FROM users WHERE id = ?",
            [id]
        );

        return { success: true, users };
    } catch (error) {
        console.error("Lỗi khi lấy thông tin người dùng:", error);
        throw new Error("Lỗi server");
    }
};
