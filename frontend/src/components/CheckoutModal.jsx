import { useState } from 'react';

const CheckoutModal = ({ onClose, onPlaceOrder, cartTotal, tableNo, phoneNumber, setTableNo, setPhoneNumber, customerCode, loading }) => {
  const handleSubmit = (event) => {
    event.preventDefault();
    onPlaceOrder();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Order details</p>
            <h2>Checkout</h2>
          </div>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Customer code</label>
            <input value={customerCode} disabled placeholder="Enter or generate code" />
          </div>
          <div className="form-row">
            <label>Table number</label>
            <input type="number" min="1" value={tableNo} onChange={(e) => setTableNo(e.target.value)} />
          </div>
          <div className="form-row">
            <label>Phone number</label>
            <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="e.g. 0781234567" />
          </div>
          <div className="form-row">
            <label>Total due</label>
            <strong>{cartTotal.toLocaleString()} RWF</strong>
          </div>
          <button className="primary-button" type="submit" disabled={loading}>Place order</button>
        </form>
      </div>
    </div>
  );
};

export default CheckoutModal;