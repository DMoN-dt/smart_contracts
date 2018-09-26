/*
 * NB: since truffle-hdwallet-provider 0.0.5 you must wrap HDWallet providers in a 
 * function when declaring them. Failure to do so will cause commands to hang. ex:
 * ```
 * mainnet: {
 *     provider: function() { 
 *       return new HDWalletProvider(mnemonic, 'https://mainnet.infura.io/<infura-key>') 
 *     },
 *     network_id: '1',
 *     gas: 4500000,
 *     gasPrice: 10000000000,
 *   },
 */

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    development: {
      host: "127.0.0.1",
      port: 9545,
      from: "0x627306090abab3a6e1400e9345bc60c78a8bef57", // default address to use for any transaction Truffle makes during migrations
      network_id: '*',
      gas: 4700000 // Gas limit used for deploys
    },
    rinkeby: {
      host: "127.0.0.1",
      port: 8545,
      from: "0x2932b7a2355d6fecc4b5c0b6bd44cc31df247a2e", // default address to use for any transaction Truffle makes during migrations
      network_id: 4,
      gas: 4612388 // Gas limit used for deploys
    }
  }
};
