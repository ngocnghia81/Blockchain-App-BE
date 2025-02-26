const { Wallets } = require("fabric-network");
const FabricCAServices = require("fabric-ca-client");
const path = require("path");
const db = require("../config/connectToDB");

async function Login(username, password) {
    try {
        // Khởi tạo Fabric CA client và wallet
        const ca = new FabricCAServices(process.env.fabric_url);
        const wallet = await Wallets.newFileSystemWallet(
            path.join(__dirname, "../wallet")
        );

        // Kiểm tra user trong DB theo username
        const getUserFromDB = () => {
            return new Promise((resolve, reject) => {
                const sql = "SELECT * FROM users WHERE username = ?";
                db.query(sql, [username], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
        };

        // Lấy kết quả từ database
        const result = await getUserFromDB();
        console.log(result);

        if (result.length === 0) {
            return { success: false, message: "User not found in DB" };
        }

        const userRecord = result[0];
        console.log(userRecord);
        console.log(userRecord.enrollment_secret);

        // Kiểm tra mật khẩu (phải khớp với enrollmentSecret)
        if (password !== userRecord.enrollment_secret) {
            return { success: false, message: "Invalid credentials" };
        }

        // Kiểm tra xem identity đã tồn tại trong wallet chưa

        console.log("Trước khi get: " + username);
        const identity = await wallet.get(username);
        console.log(identity);
        if (identity) {
            return {
                success: true,
                message: "Login successful",
                data: {
                    username: username,
                },
            };
        }

        // Enroll lại user
        const enrollment = await ca.enroll({
            enrollmentID: username,
            enrollmentSecret: password,
        });

        // Thêm identity vào wallet
        await wallet.put(username, {
            certificate: enrollment.certificate,
            privateKey: enrollment.key.toBytes(),
        });

        return {
            success: true,
            message: "Login successful",
            data: {
                username: userRecord.username,
                certificate: enrollment.certificate,
                // Các thông tin khác nếu cần trả về
            },
        };
    } catch (error) {
        console.error("Error:", error);
        return {
            success: false,
            message: "Server error",
        };
    }
}

module.exports = { Login };
