import { useEffect, useMemo, useState } from 'react';
import {
  fetchMenu,
  createCustomerCode,
  fetchCustomerCodes,
  createOrder,
  fetchOrdersByCode,
  recordPayment,
  login,
  fetchStaffOrders,
  updateOrderItemStatus,
  fetchUsers,
  createUser
} from './api.js';
import MenuCard from './components/MenuCard.jsx';
import CartSidebar from './components/CartSidebar.jsx';
import CheckoutModal from './components/CheckoutModal.jsx';
import OrderStatusModal from './components/OrderStatusModal.jsx';
import LoginPage from './components/LoginPage.jsx';
import StaffDashboard from './components/StaffDashboard.jsx';

const currency = (value) => `${Number(value).toLocaleString()} RWF`;

function App() {
  const [page, setPage] = useState('menu');
  const [menu, setMenu] = useState([]);
  const [category, setCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showOrderStatus, setShowOrderStatus] = useState(false);
  const [customerCode, setCustomerCode] = useState('');
  const [tableNo, setTableNo] = useState('1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [orders, setOrders] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [staffOrders, setStaffOrders] = useState([]);
  const [customerCodes, setCustomerCodes] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    async function loadMenu() {
      const data = await fetchMenu();
      setMenu(data);
    }
    loadMenu();
  }, []);

  useEffect(() => {
    const handlePath = () => {
      const path = window.location.pathname;
      if (path === '/login') {
        setPage('login');
      } else if (path === '/dashboard' && user) {
        setPage('dashboard');
      } else {
        setPage('menu');
      }
    };
    window.addEventListener('popstate', handlePath);
    handlePath();
    return () => window.removeEventListener('popstate', handlePath);
  }, [user]);

  const filteredMenu = useMemo(() => {
    if (category === 'all') return menu;
    return menu.filter((item) => item.type === category);
  }, [menu, category]);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const addToCart = (item) => {
    setCart((current) => {
      const existing = current.find((row) => row.menu_id === item.menu_id);
      if (existing) {
        return current.map((row) => row.menu_id === item.menu_id ? { ...row, quantity: row.quantity + 1 } : row);
      }
      return [...current, { ...item, quantity: 1 }];
    });
  };

  const updateCart = (menu_id, quantity) => {
    setCart((current) => current
      .map((item) => item.menu_id === menu_id ? { ...item, quantity } : item)
      .filter((item) => item.quantity > 0));
  };

  const removeFromCart = (menu_id) => setCart((current) => current.filter((item) => item.menu_id !== menu_id));

  const handleGenerateCode = async (tableNo) => {
    setLoading(true);
    try {
      const result = await createCustomerCode(tableNo);
      setCustomerCode(result.code);
      setMessage(`New customer code generated: ${result.code} (Table ${result.table_no})`);
      if (user?.role === 'receptionist') {
        await handleLoadCodes();
      }
    } catch (error) {
      setMessage('Unable to generate customer code.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      setMessage('Add at least one menu item to your cart.');
      return;
    }
    if (!customerCode) {
      setMessage('Enter or generate a customer code before placing an order.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customer_code: customerCode,
        table_no: Number(tableNo),
        items: cart.map((item) => ({ menu_id: item.menu_id, quantity: item.quantity }))
      };
      await createOrder(payload);
      setMessage('Order submitted successfully. You can now see order status below.');
      setCart([]);
      setShowCheckout(false);
      const summary = await fetchOrdersByCode(customerCode);
      setOrders(summary);
    } catch (error) {
      console.error(error);
      setMessage('Unable to submit order.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!customerCode) {
      setMessage('Enter a customer code to fetch order status.');
      return;
    }
    setLoading(true);
    try {
      const summary = await fetchOrdersByCode(customerCode);
      setOrders(summary);
      setShowOrderStatus(true);
      setMessage('Order data loaded.');
    } catch (error) {
      setMessage('Unable to fetch orders for that code.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (amount, phone) => {
    const phoneToUse = phone || phoneNumber;
    const amountToUse = amount || 0;

    if (!customerCode || !phoneToUse) {
      setMessage('Customer code and phone number are required for payment.');
      return;
    }

    setLoading(true);
    try {
      const result = await recordPayment({ customer_code: customerCode, phone_number: phoneToUse, amount: amountToUse });
      setPaymentResult(result);
      setMessage(result.paid ? 'Payment recorded. All due orders are marked paid.' : 'Payment recorded. Amount still due.');
      const summary = await fetchOrdersByCode(customerCode);
      setOrders(summary);
    } catch (error) {
      console.error(error);
      setMessage('Unable to process payment.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoMarkReady = async (itemId) => {
    if (!customerCode) return;
    setLoading(true);
    try {
      await updateOrderItemStatus(itemId, { status: 'ready' });
      const summary = await fetchOrdersByCode(customerCode);
      setOrders(summary);
    } catch (error) {
      console.error(error);
      setMessage('Unable to auto-update item to ready.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (username, password) => {
    if (!username || !password) {
      setMessage('Enter both username and password.');
      return;
    }
    setLoading(true);
    try {
      const result = await login({ username, password });
      setUser(result);
      setMessage(`Logged in as ${result.username} (${result.role})`);
      window.history.pushState({}, '', '/dashboard');
      setPage('dashboard');
    } catch (error) {
      console.error(error);
      setMessage('Login failed. Check your username and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setStaffOrders([]);
    setCustomerCodes([]);
    setUsers([]);
    setPage('menu');
    window.history.pushState({}, '', '/');
    setMessage('Logged out successfully.');
  };

  const handleLoadOrders = async (role) => {
    setLoading(true);
    try {
      if (role === 'cook' || role === 'barman') {
        const filter = {};
        if (role === 'cook') filter.type = 'food';
        if (role === 'barman') filter.type = 'drink';
        const rows = await fetchStaffOrders(filter);
        setStaffOrders(rows);
        return;
      }

      if (role === 'manager') {
        const rows = await fetchStaffOrders({});
        setStaffOrders(rows);
        return;
      }

      setStaffOrders([]);
    } catch (error) {
      console.error(error);
      setMessage('Unable to load station orders.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadCodes = async () => {
    setLoading(true);
    try {
      const codes = await fetchCustomerCodes();
      setCustomerCodes(codes);
    } catch (error) {
      console.error(error);
      setMessage('Unable to load customer codes.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadUsers = async () => {
    setLoading(true);
    try {
      const staff = await fetchUsers();
      setUsers(staff);
    } catch (error) {
      console.error(error);
      setMessage('Unable to load staff users.');
    } finally {
      setLoading(false);
    }
  };

  const handleReloadMenu = async () => {
    setLoading(true);
    try {
      const data = await fetchMenu();
      setMenu(data);
    } catch (error) {
      console.error(error);
      setMessage('Unable to reload menu.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (payload) => {
    setLoading(true);
    try {
      await createUser(payload);
      await handleLoadUsers();
      setMessage('Staff user created successfully.');
    } catch (error) {
      console.error(error);
      setMessage('Unable to create staff user.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItemStatus = async (itemId, status, readyTime = null) => {
    setLoading(true);
    try {
      await updateOrderItemStatus(itemId, { status, ready_time: readyTime });
      await handleLoadOrders(user.role);
      setMessage('Order item status updated.');
    } catch (error) {
      console.error(error);
      setMessage('Unable to update order item status.');
    } finally {
      setLoading(false);
    }
  };

  if (page === 'login') {
    return (
      <LoginPage
        onLogin={handleLogin}
        onClose={() => {
          setPage('menu');
          window.history.pushState({}, '', '/');
        }}
        loading={loading}
        message={message}
      />
    );
  }

  if (page === 'dashboard' && user) {
    return (
      <StaffDashboard
        user={user}
        onLogout={handleLogout}
        staffOrders={staffOrders}
        customerCodes={customerCodes}
        users={users}
        menu={menu}
        onLoadOrders={handleLoadOrders}
        onLoadCodes={handleLoadCodes}
        onLoadUsers={handleLoadUsers}
        onGenerateCode={handleGenerateCode}
        onCreateUser={handleCreateUser}
        onUpdateItemStatus={handleUpdateItemStatus}
        onReloadMenu={handleReloadMenu}
        loading={loading}
        message={message}
      />
    );
  }

  return (
    <div className="app-shell">
      <header className="hero-bar">
        <div>
          <p className="eyebrow">Tabletouch Restaurant</p>
          <h1>Interactive Touch Menu</h1>
          <p>Browse food and drinks, add them to cart, then place your order with a customer code.</p>
        </div>
        <div className="hero-panel">
          <p>Total in cart</p>
          <strong>{currency(cartTotal)}</strong>
          <button className="primary-button" onClick={() => setShowCheckout(true)} disabled={cart.length === 0}>Checkout</button>
        </div>
      </header>

      <section className="top-bar">
        <div className="controls-bar">
          <div className="filters">
            <button className={category === 'all' ? 'active' : ''} onClick={() => setCategory('all')}>All</button>
            <button className={category === 'food' ? 'active' : ''} onClick={() => setCategory('food')}>Food</button>
            <button className={category === 'drink' ? 'active' : ''} onClick={() => setCategory('drink')}>Drinks</button>
          </div>
          <div className="code-entry">
            <input value={customerCode} onChange={(e) => setCustomerCode(e.target.value)} placeholder="Customer code" />
            <button className="primary-button status-button" onClick={handleCheckStatus} disabled={loading}>Check order status</button>
          </div>
        </div>

      </section>

      <div className="main-grid">
        <section className="menu-grid">
          {filteredMenu.map((item) => (
            <MenuCard key={item.id} item={{ ...item, menu_id: item.id }} onAdd={() => addToCart({ ...item, menu_id: item.id })} />
          ))}
        </section>

        <CartSidebar
          cart={cart}
          onUpdate={updateCart}
          onRemove={removeFromCart}
          total={cartTotal}
          onCheckout={() => setShowCheckout(true)}
        />
      </div>

      {showCheckout && (
        <CheckoutModal
          onClose={() => setShowCheckout(false)}
          onPlaceOrder={handlePlaceOrder}
          cartTotal={cartTotal}
          tableNo={tableNo}
          phoneNumber={phoneNumber}
          setTableNo={setTableNo}
          setPhoneNumber={setPhoneNumber}
          customerCode={customerCode}
          loading={loading}
        />
      )}

      {showOrderStatus && orders && (
        <OrderStatusModal
          orders={orders}
          onClose={() => setShowOrderStatus(false)}
          onPay={handlePayment}
          onAutoMarkReady={handleAutoMarkReady}
          loading={loading}
        />
      )}

      <section className="status-panel">
        <h2>Order status</h2>
        {message && <div className="toast">{message}</div>}
        {orders ? (
          <div style={{ padding: '12px', background: '#e3f2fd', borderRadius: '8px', border: '1px solid #90caf9', color: '#1565c0', textAlign: 'center' }}>
            <p>✓ Order loaded. Your status view is open now.</p>
          </div>
        ) : (
          <p className="status-empty">Check an existing customer code or place a new order.</p>
        )}
      </section>
    </div>
  );
}

export default App;
