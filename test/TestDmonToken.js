var DmonToken = artifacts.require("DmonToken");

contract('DmonToken', function(accounts) {
  let owner = accounts[0];
  let member1 = accounts[1];
  let token;
  let coin = 10 ** 8;
  let initialSupply = 2000 * coin;

  beforeEach(async () => {
    token = await DmonToken.deployed();
  });

  it('should return the correct totalSupply after construction', async () => {
    let totalSupply = await token.totalSupply();

    assert.equal(totalSupply, initialSupply);
  });

  it('transfer updates members balances', async () => {
    await token.transfer(member1, 150);
    let balance_owner = await token.balanceOf(owner);
    let balance_member1 = await token.balanceOf(member1);

    assert.equal(balance_owner, initialSupply - 150);
    assert.equal(balance_member1, 150);
  });
});
