Ethereum Blockchain Smart Contracts
====================================

Here is example of [ERC-20 token](https://theethereum.wiki/w/index.php/ERC20_Token_Standard) and a Sale [Contract](http://ethdocs.org/en/latest/contracts-and-transactions/contracts.html).
Smart contracts are written in [Solidity](http://ethdocs.org/en/latest/contracts-and-transactions/contracts.html) language using [Truffle Suite](https://truffleframework.com).

Install Truffle:
```
sudo npm install -g truffle
```

Start a local private blockchain:
```
truffle develop
```
ATTENTION: inside a truffle develop console, you must omit command's `truffle` keyword.

Compile and redeploy all contracts:
```
truffle compile
truffle migrate --reset
```

Run tests:
```
truffle test
```

Execute a queries example:
```
truffle exec queries/MarketSale.js
```
