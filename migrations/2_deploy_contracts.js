var MobileBarter = artifacts.require("./MobileBarter.sol");
module.exports = function(deployer) {
  deployer.deploy(MobileBarter,web3.eth.accounts[9]);
};
