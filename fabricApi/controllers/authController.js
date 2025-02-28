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

        // Lấy thông tin user từ database
        const getUserFromDB = () => {
            return new Promise((resolve, reject) => {
                const sql = "SELECT * FROM users WHERE username = ?";
                db.query(sql, [username], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
        };

        const result = await getUserFromDB();
        if (result.length === 0) {
            return { success: false, message: "User not found in DB" };
        }

        const userRecord = result[0];
        if (password !== userRecord.enrollment_secret) {
            return { success: false, message: "Invalid credentials" };
        }

        // Kiểm tra xem user có mã PIN chưa
        if (!userRecord.pin_code) {
            return {
                success: false,
                message: "Pin code required. Please create a new PIN.",
            };
        }

        // Kiểm tra xem identity đã tồn tại trong wallet chưa
        const identity = await wallet.get(username);
        if (identity) {
            return {
                success: true,
                message: "Login successful",
                data: { username: username },
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
