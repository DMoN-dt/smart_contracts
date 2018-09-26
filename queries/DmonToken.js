var DmonToken = artifacts.require("DmonToken");
var contract, contract_address, contract_abi;

module.exports = () => {

  let getDeployed = async () => {
    contract = await DmonToken.deployed();
    contract_address = contract.address;
    contract_abi = contract.abi;

    console.log('Contract address: ' + contract_address.toString());
  }

  let getMainInfo = async () => {
    let name = await contract.name();
    let symbol = await contract.symbol();
    let initialSupply = await contract.initialSupply();
    let totalSupply = await contract.totalSupply();

    console.log('Name: "' + name.toString() + '" (' + symbol.toString() + ')');
    console.log('Initial num: ' + initialSupply.toString() + ', Total Supply: ' + totalSupply.toString());
  }

  let getWeb3MainInfo = async () => {
    let smct = web3.eth.contract(contract_abi).at(contract_address);
    let name = await smct.name();
    let symbol = await smct.symbol();
    let decimals = await smct.decimals();

    console.log('Web3: "' + name.toString() + '" (' + symbol.toString() + '), Decimals: ' + decimals.toString());
  }

  getDeployed().then(() => {
    getMainInfo();
    getWeb3MainInfo();
  });

}
