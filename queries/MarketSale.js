var MarketSale = artifacts.require("MarketSale");
var contract, contract_address, contract_abi;

var seller_address = web3.eth.accounts[0],
    buyer_address  = web3.eth.accounts[1],
    max_gas = 4700000,
    order;

function Order() {
  this.totalPrice = 2000 * (10 ** 8);
  this.minPrepay = this.totalPrice * .5;
  this.deposit = this.minPrepay * .5;

  this.confirmed = false;

  this.State = Object.freeze({
    'Created': 0,
    'Initialized': 1,
    'Confirmed': 2,
    'Assembly': 3,
    'Shipment': 4,
    'Received': 5,
    'Refund': 6,
    'RefundCompleted': 7,
    'Completed': 8,
    'Cancelled': 9
  });

  this.confirm = () => {
    this.confirmed = true;
  }

  this.initContract = (_contract) => {
    if (typeof this.contract != 'undefined') {
      console.log('Order is already initialized!');
      return;
    }
    this.contract = _contract;
    this.initEventsWatchers();

    if (this.inState(this.State.Created)) {
      this.contract_transaction({
        from: seller_address,
        data: contract.init.getData(this.totalPrice, this.minPrepay, this.deposit),
      });
    } else {
      console.log('Contract is already initialized');
      console.log('Contract current state:', this.stateName(contract.state()));
    }

    let _totalPrice = contract.totalPrice();
    let _minPrepay = contract.minPrepay();
    let _deposit = contract.deposit();
    console.log('Contract Total Price:', _totalPrice.toString(), ', Min Prepay:', _minPrepay.toString(), ', Deposit:', _deposit.toString());

    let _totalPaid = contract.totalPaid();
    let _refundApprovedAmount = contract.refundApprovedAmount();
    console.log('Contract Total Paid:', _totalPaid.toString(), ', Refund Approved Amount:', _refundApprovedAmount.toString());
  }

  this.buyerConfirmOrder = () => {
    let prepayAmount = contract.minPrepay();
    if (web3.eth.getBalance(buyer_address).toNumber() < prepayAmount) {
      console.log('Not enough balance to prepay and confirm the order!');
      return;
    }

    this.contract_transaction({
      from: buyer_address,
      data: contract.confirmOrder.getData(),
      value: prepayAmount,
    });
  }

  this.buyerConfirmReceived = () => {
    this.contract_transaction({
      from: buyer_address,
      data: contract.confirmReceived.getData(),
    });
  }

  this.buyerRequestRefund = (_requestedSum) => {
    this.contract_transaction({
      from: buyer_address,
      data: contract.requestRefund.getData(_requestedSum),
    });
  }

  this.buyerComplete = () => {
    let payAmount = contract.totalPrice() - contract.totalPaid() - contract.refundApprovedAmount();
    console.log('Pay on complete:', payAmount);

    let buyer_balance = web3.eth.getBalance(buyer_address).toNumber();
    if (buyer_balance < payAmount) {
      console.log('Not enough balance to pay the contract');
      return;
    }

    this.contract_transaction({
      from: buyer_address,
      data: contract.Complete.getData(),
      value: payAmount
    });
  }

  this.assemblyParcel = () => {
    this.contract_transaction({
      from: seller_address,
      data: contract.assemblyParcel.getData(),
    });
  }

  this.shipParcel = () => {
    this.contract_transaction({
      from: seller_address,
      data: contract.shipParcel.getData(),
    });
  }

  this.approveRefund = (_approvedSum) => {
    this.contract_transaction({
      from: seller_address,
      data: contract.approveRefund.getData(_approvedSum),
    });
  }

  this.initEventsWatchers = () => {
    contract.Initialized().watch((error, result) => {
      if (error) {console.log(error); return;}
      console.log('Initialized event');
      this.buyerConfirmOrder();
    }, this);

    contract.OrderConfirmed().watch((error, result) => {
      if (error) {console.log(error); return;}
      console.log('OrderConfirmed event');
      this.confirm();
      this.assemblyParcel();
    }, this);

    contract.ParcelAssembly().watch((error, result) => {
      if (error) {console.log(error); return;}
      console.log('ParcelAssembly event');
      this.shipParcel();
    }, this);

    contract.ParcelShipped().watch((error, result) => {
      if (error) {console.log(error); return;}
      console.log('ParcelShipped event');
      this.buyerConfirmReceived();
    }, this);

    contract.ParcelReceived().watch((error, result) => {
      if (error) {console.log(error); return;}
      console.log('ParcelReceived event');
      this.buyerRequestRefund(this.minPrepay * .20);
    }, this);

    contract.RefundRequested().watch((error, result) => {
      if (error) {console.log(error); return;}
      console.log('RefundRequested event');
      this.approveRefund(this.minPrepay * .20);
    }, this);

    contract.RefundApproved().watch((error, result) => {
      if (error) {console.log(error); return;}
      console.log('RefundApproved event');
      this.buyerComplete();
    }, this);

    contract.Completed().watch((error, result) => {
      if (error) {console.log(error); return;}
      console.log('Contract completed!');

      let _totalPaid = this.contract.totalPaid();
      let _contractBalance = web3.eth.getBalance(this.contract.address);
      console.log('Contract Total Paid:', _totalPaid.toString(), ', Balance:', _contractBalance.toString());
      this.show_balances();
    }, this);

    contract.Cancelled().watch((error, result) => {
      if (error) {console.log(error); return;}
      console.log('Contract cancelled!');
      this.show_balances();
    }, this);
  }

  this.inState = (_state) => {
    return (this.contract.state() == _state);
  }

  this.stateName = (_stateId) => {
    _stateId = parseInt(_stateId);
    return Object.keys(this.State).find(key => this.State[key] === _stateId);
  }

  this.show_balances = () => {
    let seller_balance = web3.eth.getBalance(seller_address).toNumber();
    let buyer_balance = web3.eth.getBalance(buyer_address).toNumber();

    console.log('Final Seller balance:', seller_balance.toString());
    console.log('Final Buyer balance:', buyer_balance.toString());
  }

  this.contract_transaction = ({from, data, value}) => {
    let params = {
      to: contract_address,
      from,
      data,
      gas: max_gas
    }
    if (typeof value != 'undefined') params.value = value;

    web3.eth.sendTransaction(params);
  }
}

module.exports = () => {

   let getDeployed = async () => {
    let deployed = await MarketSale.deployed();
    contract_address = deployed.address;
    contract_abi = deployed.abi;

    contract = web3.eth.contract(contract_abi).at(contract_address);
    console.log('Contract address:', contract_address);
  }

  let seller_balance = web3.eth.getBalance(seller_address).toNumber();
  let buyer_balance = web3.eth.getBalance(buyer_address).toNumber();
  let gasPrice = web3.eth.gasPrice.toNumber();

  console.log('Seller balance:', seller_balance.toString());
  console.log('Buyer balance:', buyer_balance.toString());
  console.log('gasPrice: ' + gasPrice.toString());

  order = new Order();

  getDeployed().then(function(){
    order.initContract(contract);
  });
}
