const { Wallets } = require("fabric-network");
const FabricCAServices = require("fabric-ca-client");
const path = require("path");

const db = require("../config/connectToDB");

require("dotenv").config();
async function Login(username, password) {
    try {
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
            return {
                success: false,
                code: "USER_NOT_FOUND",
                message: "User not found in DB",
            };
        }

        const userRecord = result[0];
        if (password !== userRecord.enrollment_secret) {
            return {
                success: false,
                code: "INVALID_CREDENTIALS",
                message: "Invalid credentials",
            };
        }

        if (!userRecord.pin_code) {
            return {
                success: false,
                code: "PIN_REQUIRED",
                message: "Pin code required. Please create a new PIN.",
            };
        }

        // Kiểm tra identity trong wallet
        const identity = await wallet.get(username);
        if (identity) {
            return {
                success: true,
                code: "LOGIN_SUCCESS",
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
            code: "LOGIN_SUCCESS",
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
            code: "SERVER_ERROR",
            message: "Server error",
        };
    }
}

async function Register(req, res) {
    const {
        username,
        email,
        citizen_id,
        commonName,
        organization,
        organizationalUnit,
        country,
        state,
        locality,
    } = req.body;

    let wallet;
    let walletPath;

    try {
        console.log("Fabric CA URL:", process.env.fabric_url);

        const ca = new FabricCAServices(process.env.fabric_url);
        console.log(ca);

        // wallet = await Wallets.newFileSystemWallet(
        //     path.join(__dirname, "./wallet")
        // );

        walletPath = path.resolve(__dirname, "../wallet");
        console.log(`Wallet path: ${walletPath}`); // Debug xem có đúng không
        wallet = await Wallets.newFileSystemWallet(walletPath);

        // Kiểm tra username, email, citizen_id đã tồn tại chưa
        const checkUserSQL =
            "SELECT * FROM users WHERE username = ? OR email = ? OR citizen_id = ?";
        const existingUser = await new Promise((resolve, reject) => {
            db.query(
                checkUserSQL,
                [username, email, citizen_id],
                (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                }
            );
        });

        if (existingUser.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Username, email, or citizen_id already exists",
            });
        }

        // Kiểm tra user đã tồn tại trong Wallet chưa
        const userExists = await wallet.get(username);
        if (userExists) {
            return res.status(409).json({
                success: false,
                message: "User already exists in wallet",
            });
        }

        // Kiểm tra admin đã tồn tại trong Wallet chưa
        const adminIdentity = await wallet.get("admin");
        if (!adminIdentity) {
            return res.status(500).json({
                success: false,
                message: "Admin identity not found",
            });
        }

        const provider = wallet
            .getProviderRegistry()
            .getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, "admin");

        // Kiểm tra user đã tồn tại trong Fabric CA chưa
        try {
            await ca.getIdentity(username, adminUser);
            return res.status(409).json({
                success: false,
                message: "Identity already registered in CA.",
            });
        } catch (error) {
            console.log(
                "Identity not found in CA, proceeding with registration..."
            );
        }

        // Đăng ký user trong Fabric CA
        const enrollmentSecret = await ca.register(
            {
                enrollmentID: username,
                affiliation: "org1.department1",
                role: "client",
                attrs: [
                    { name: "co", value: commonName },
                    { name: "og", value: organization },
                    { name: "ou", value: organizationalUnit },
                    { name: "ct", value: country },
                    { name: "st", value: state },
                    { name: "lc", value: locality },
                ],
            },
            adminUser
        );

        // Enroll user để lấy certificate và key
        const EnrollUser = await ca.enroll({
            enrollmentID: username,
            enrollmentSecret: enrollmentSecret,
        });

        const userIdentity = {
            credentials: {
                certificate: EnrollUser.certificate,
                privateKey: EnrollUser.key.toBytes(),
            },
            mspId: "Org1MSP",
            type: "X.509",
        };

        // Lưu user vào Wallet
        await wallet.put(username, userIdentity);

        // Chuyển đổi key sang Buffer để lưu vào database
        const publicKey = Buffer.from(EnrollUser.key.getPublicKey().toBytes());
        const privateKey = Buffer.from(EnrollUser.key.toBytes());

        console.log({
            EnrollUser,
            publicKey,
            privateKey,
            enrollmentSecret,
        });

        // Lưu user vào database
        const insertSQL = `
            INSERT INTO users (username, email, citizen_id, commonName, organization, organizationalUnit, country, state, locality, certificate, public_key, private_key, enrollment_secret) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        await new Promise((resolve, reject) => {
            db.query(
                insertSQL,
                [
                    username,
                    email,
                    citizen_id,
                    commonName,
                    organization,
                    organizationalUnit,
                    country,
                    state,
                    locality,
                    EnrollUser.certificate,
                    publicKey,
                    privateKey,
                    enrollmentSecret,
                ],
                (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                }
            );
        });

        return res.status(200).json({
            success: true,
            message: "User registered successfully",
            enrollmentSecret,
        });
    } catch (error) {
        if (wallet) {
            try {
                const fs = require("fs");
                const userPath = path.join(walletPath, username + ".id");

                if (fs.existsSync(userPath)) {
                    await wallet.remove(username);
                } else {
                    console.log(
                        "User does not exist in wallet, skipping removal."
                    );
                }
            } catch (err) {
                console.error("Failed to remove user from wallet:", err);
            }
        }

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

module.exports = { Login, Register };
