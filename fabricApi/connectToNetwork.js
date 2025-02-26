const { Gateway, Wallets } = require("fabric-network");
const path = require("path");
const fs = require("fs");
async function connectToNetwork() {
    const walletPath = path.join(__dirname, "wallet");

    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const gateway = new Gateway();
    const connectionProfile = path.join(__dirname, "connection-org1.json");
    const ccp = JSON.parse(fs.readFileSync(connectionProfile, "utf8"));
    await gateway.connect(ccp, {
        wallet,
        identity: "admin",
        discovery: {
            enabled: true,
            asLocalhost: true,
        },
    });

    const network = await gateway.getNetwork("mychannel");

    const contract = await network.getContract("identityContract");

    return { gateway, contract };
}

module.exports = connectToNetwork;
