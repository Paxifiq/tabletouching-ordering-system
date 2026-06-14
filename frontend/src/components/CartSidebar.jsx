const currency = (value) => `${Number(value).toLocaleString()} RWF`;

const CartSidebar = ({ cart, onUpdate, onRemove, total, onCheckout }) => {
  return (
    <aside className="cart-sidebar">
      <div className="cart-header">
        <h2>Your Cart</h2>
        <span>{cart.length} item{cart.length === 1 ? '' : 's'}</span>
      </div>
      <div className="cart-items">
        {cart.length === 0 && <p className="empty-cart">Your cart is empty. Add something.</p>}
        {cart.map((item) => (
          <div className="cart-item" key={item.menu_id}>
            <div>
              <strong>{item.name}</strong>
              <p>{currency(item.price)} x {item.quantity}</p>
            </div>
            <div className="cart-actions">
              <button onClick={() => onUpdate(item.menu_id, item.quantity - 1)}>-</button>
              <span>{item.quantity}</span>
              <button onClick={() => onUpdate(item.menu_id, item.quantity + 1)}>+</button>
              <button className="remove-button" onClick={() => onRemove(item.menu_id)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
      <div className="cart-footer">
        <div>
          <span>Total</span>
          <strong>{currency(total)}</strong>
        </div>
        <button className="primary-button" onClick={onCheckout} disabled={cart.length === 0}>Place Order</button>
      </div>
    </aside>
  );
};

export default CartSidebar;
