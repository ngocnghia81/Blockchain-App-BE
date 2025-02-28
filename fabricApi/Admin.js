const fs = require("fs");
const path = require("path");
const { Wallets } = require("fabric-network");
console.log(Wallets);

const connectToNetwork = require("./connectToNetwork");
require("dotenv").config();
const fabric_ca_Server = require("fabric-ca-client");
async function enrollAdmin() {
    try {
        const walletPath = path.join(__dirname, "wallet");

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
        console.error("Error importing admin identity:", error);
    }
}

// enrollAdmin();

// async function EnrollAdmin() {

// }
// async function GetIdentity(user) {
//     const walletPath = path.join(__dirname , "wallet");
//     const wallet = await Wallets.newFileSystemWallet(walletPath);

//     // Kiểm tra user trong wallet
//     const identityUser = await wallet.get(user);
//     if(!identityUser){
//         throw new Error(`User ${user} not found`);
//     }

//     return {
//         user,
//         mspID : identityUser.mspID,
//         credentials : identityUser.credentials.certificate
//     }
// }

// module.exports = {GetIdentity};
module.exports = { enrollAdmin };
