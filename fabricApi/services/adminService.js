const fs = require("fs");
const path = require("path");
const { Wallets } = require("fabric-network");
const fabric_ca_Server = require("fabric-ca-client");
require("dotenv").config();

async function enrollAdmin() {
    try {
        const walletPath = path.join(__dirname, "../wallet"); // Chuyển lên cấp trên
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        const adminExists = await wallet.get("admin");
        if (adminExists) {
            console.log("Admin identity already exists in the wallet");
            return;
        }

        const fabrica = new fabric_ca_Server(process.env.fabric_url);
        const enrollment = await fabrica.enroll({
            enrollmentID: process.env.ADMIN_USER,
            enrollmentSecret: process.env.ADMIN_PASS,
        });

        const identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: process.env.MSP_ID,
            type: "X.509",
        };

        await wallet.put("admin", identity);
        console.log("Enroll Admin Successfully");
    } catch (error) {
        console.error("Error enrolling admin identity:", error);
    }
}

module.exports = { enrollAdmin };
