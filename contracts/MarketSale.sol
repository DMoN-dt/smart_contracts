pragma solidity ^0.4.24;

contract MarketSale {
  uint public totalPrice;
  uint public minPrepay;
  uint public deposit;
  uint public totalPaid;

  uint public refundRequestedAmount;
  uint public refundApprovedAmount;
  address seller;
  address buyer;

  enum State {
    Created,
    Initialized,
    Confirmed,
    Assembly,
    Shipment,
    Received,
    Refund,
    RefundCompleted,
    Completed,
    Cancelled
  }
  State public state;

  constructor() public {
    seller = msg.sender;
    state = State.Created;
  }

  modifier condition(bool _condition) {
    require(_condition);
    _;
  }

  modifier onlySeller() {
    require(
      msg.sender == seller,
      'Only seller can call this.'
    );
    _;
  }

  modifier onlyBuyer() {
    require(
      msg.sender == buyer,
      'Only buyer can call this.'
    );
    _;
  }

  modifier ensureCanCancel() {
    require(
      ( msg.sender == seller && state != State.Received && state != State.Completed && state != State.Cancelled)
      || ( msg.sender == buyer && ( state == State.Confirmed || state == State.Assembly ) ),
      'You are not allowed to cancel the order at current stage.'
    );
    _;
  }

  modifier ensureCanComplete() {
    require(
      ( (msg.sender == buyer) || (msg.sender == seller) )
      && (state == State.Received || state == State.RefundCompleted),
      'You are not allowed to complete the order at current stage.'
    );
    _;
  }

  modifier ensureCanRequestRefund() {
    require(
      state != State.Created
      && state != State.Initialized
      && state != State.Completed
      && state != State.Cancelled
      && state != State.RefundCompleted
      ,
      'You are not allowed to complete the order at current stage.'
    );
    _;
  }

  modifier inState(State _state) {
    require(
      state == _state,
      'Invalid state.'
    );
    _;
  }

  event Initialized();
  event Cancelled();
  event Completed();
  event OrderConfirmed();
  event ParcelAssembly();
  event ParcelShipped();
  event ParcelReceived();
  event RefundRequested();
  event RefundApproved();

  /// Set the order price, minimum prepay amount
  /// and deposit value that won't be refunded on order cancel.
  function init(uint _totalPrice, uint _minPrepay, uint _deposit)
    public
    onlySeller
    inState(State.Created)
    condition(_minPrepay <= _totalPrice && _deposit <= _totalPrice)
  {
    totalPrice = _totalPrice;
    minPrepay = _minPrepay;
    deposit = _deposit;

    if(minPrepay < deposit) {
      minPrepay = deposit;
    }

    state = State.Initialized;
    emit Initialized();
  }

  /// Cancel the contract and reclaim the funds.
  /// Refund amount will be reduced by a deposit value.
  function cancel()
    public
    ensureCanCancel
  {
    state = State.Cancelled;
    emit Cancelled();

    if (state != State.Created && state != State.Initialized){
      uint _refund_amount = address(this).balance;

      if (_refund_amount > totalPrice) {
        _refund_amount = totalPrice;
      }

      if (_refund_amount > deposit) {
        _refund_amount = _refund_amount - deposit;
      }
      else {
        _refund_amount = 0;
      }

      if (_refund_amount != 0) {
        buyer.transfer(_refund_amount);
      }
    }
  }

  /// Confirm the order as buyer.
  function confirmOrder()
    public
    inState(State.Initialized)
    condition(msg.value >= minPrepay && msg.value <= totalPrice)
    payable
  {
    buyer = msg.sender;
    state = State.Confirmed;
    totalPaid = msg.value;
    emit OrderConfirmed();
  }

  /// Start parcel assembly for shipment
  function assemblyParcel()
    public
    onlySeller
    inState(State.Confirmed)
  {
    state = State.Assembly;
    emit ParcelAssembly();
  }

  /// Parcel has shipped to buyer
  function shipParcel()
    public
    onlySeller
    inState(State.Assembly)
  {
    state = State.Shipment;
    emit ParcelShipped();
  }

  /// Confirm the buyer received the parcel.
  /// This will release the locked ether.
  function confirmReceived()
    public
    onlyBuyer
    inState(State.Shipment)
  {
    state = State.Received;
    emit ParcelReceived();
  }

  /// Request a refund to buyer.
  /// The amount requested should be approved by seller.
  function requestRefund(uint _requestedAmount)
    public
    onlyBuyer
    ensureCanRequestRefund
  {
    state = State.Refund;
    refundRequestedAmount = _requestedAmount;
    emit RefundRequested();
  }

  /// Approve a requested refund with the amount specified.
  function approveRefund(uint _approvedAmount)
    public
    onlySeller
    inState(State.Refund)
    returns (bytes)
  {
    if (_approvedAmount > totalPrice) {
      return 'Not allowed to refund more the total order price!';
    }

    uint _refundAmount;
    uint _owedAmount = totalPrice - totalPaid;

    if (_approvedAmount > _owedAmount) {
      _refundAmount = _approvedAmount - _owedAmount;
    } else {
      _refundAmount = 0;
    }

    if (_refundAmount > address(this).balance) {
      return 'Not allowed to refund more the contract current balance!';
    }

    refundApprovedAmount = _approvedAmount;
    state = State.RefundCompleted;
    emit RefundApproved();

    if (_refundAmount != 0) {
      buyer.transfer(_refundAmount);
    }
  }

  /// Confirm the order is completed and seller could receive money.
  /// This will release the locked funds.
  function Complete()
    public
    ensureCanComplete
    condition(msg.value == (totalPrice - totalPaid - refundApprovedAmount))
    payable
  {
    state = State.Completed;
    totalPaid = totalPaid + msg.value;
    emit Completed();

    seller.transfer(address(this).balance);
  }
}
