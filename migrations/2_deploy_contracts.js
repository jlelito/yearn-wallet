var Wallet = artifacts.require("./Wallet.sol");

module.exports = async function(deployer) {
    await deployer.deploy(Wallet);
};
