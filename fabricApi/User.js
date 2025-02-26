const { Wallets } = require("fabric-network");
const fabric_server = require("fabric-ca-client");
const path = require("path");
const db = require("./config/connectToDB.js");
const { log } = require("console");

async function Register(req, res) {
    const {
        username,
        commonName,
        organization,
        organizationalUnit,
        country,
        state,
        locality,
    } = req.body;

    let wallet;

    try {
        const ca = new fabric_server(process.env.fabric_url);
        wallet = await Wallets.newFileSystemWallet(
            path.join(__dirname, "wallet")
        );

        const userExists = await wallet.get(username);
        if (userExists) {
            console.log("User already exists in wallet.");
            return res.status(409).json({
                success: false,
                message: "User already exists in wallet",
            });
        }

        // Lấy admin từ Wallet
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
        const adminuser = await provider.getUserContext(adminIdentity, "admin");

        // Kiểm tra xem Identity đã tồn tại trong Fabric CA chưa
        try {
            const identityInfo = await ca.getIdentity(username, adminuser);
            if (identityInfo) {
                console.log("Identity already registered in CA.");
                return res.status(409).json({
                    success: false,
                    message: "Identity already registered in CA.",
                });
            }
        } catch (error) {
            console.log(
                "Identity not found in CA, proceeding with registration..."
            );
        }

        // Đăng ký Identity
        const user = await ca.register(
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
            adminuser
        );

        // Enroll User
        const enrollmentSecret = user; //  secret
        console.log(enrollmentSecret);

        const EnrollUser = await ca.enroll({
            enrollmentID: username,
            enrollmentSecret: enrollmentSecret,
        });

        console.log("EnrollUser:", EnrollUser);
        console.log("Certificate:", EnrollUser.certificate);
        console.log("Private Key:", EnrollUser.key.toBytes());

        const userIdentity = {
            credentials: {
                certificate: EnrollUser.certificate,
                privateKey: EnrollUser.key.toBytes(),
            },
            mspId: "Org1MSP",
            type: "X.509",
        };

        await wallet.put(username, userIdentity);

        const identity = await wallet.get(username);
        console.log(identity);

        if (identity) {
            console.log("Identity successfully added to wallet");
        } else {
            console.log("Failed to add identity to wallet");
        }
        console.log(`User ${username} has been added to the wallet.`);

        // Insert user data into DB, bao gồm cả username
        const sql =
            "INSERT INTO users (username, commonName, organization, organizationalUnit, country, state, locality, certificate, public_key, private_key, enrollment_secret) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        const publicKey = EnrollUser.key.getPublicKey().toBytes();
        const privateKey = EnrollUser.key.toBytes();

        console.log("public_key:", publicKey, "private_key:", privateKey);

        // Đặt câu lệnh query vào một Promise để có thể catch lỗi
        const dbResult = await new Promise((resolve, reject) => {
            db.query(
                sql,
                [
                    username,
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
                    if (err) {
                        reject(err); // Bắt lỗi nếu có lỗi
                    } else {
                        resolve(result); // Trả về kết quả nếu thành công
                    }
                }
            );
        });

        console.log("User register success:", dbResult);

        return res.status(200).json({
            success: true,
            message: "Register user successfully",
            enrollmentSecret, // Trả secret về cho client (hoặc chỉ lưu trong DB)
            result: dbResult,
        });
    } catch (error) {
        // Nếu có lỗi, xóa user khỏi wallet để không giữ lại thông tin không hợp lệ
        if (wallet) {
            console.log("Rolling back by deleting user from wallet...");
            try {
                await wallet.remove(username);
            } catch (error) {
                console.error("Failed to remove user from wallet:", error);
            }
        }

        console.error("Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

module.exports = { Register };
