pragma solidity ^0.4.24;

import 'openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol';

contract DmonToken is MintableToken {
  using SafeERC20 for ERC20;

  string public name = 'DMoN token';
  string public symbol = 'DMON';

  uint public decimals = 8;
  uint public initialSupply = 2000;

  constructor() public {
    owner = msg.sender;
    totalSupply_ = initialSupply * (10 ** decimals);
    balances[owner] = totalSupply_;
  }
}
