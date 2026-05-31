import { useEffect, useState } from 'react';
import { fetchPayments, fetchReports, createMenuItem, updateMenuItem, deleteMenuItem } from '../api.js';

const roleNames = {
  receptionist: 'Receptionist',
  cook: 'Cook',
  barman: 'Barman',
  manager: 'Manager'
};

export default function StaffDashboard({
  user,
  onLogout,
  staffOrders,
  customerCodes,
  users,
  menu,
  onLoadOrders,
  onLoadCodes,
  onLoadUsers,
  onGenerateCode,
  onCreateUser,
  onUpdateItemStatus,
  onReloadMenu,
  loading,
  message
}) {
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'receptionist' });
  const [tableNo, setTableNo] = useState('1');
  const [managerTab, setManagerTab] = useState('orders');
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    type: 'food',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [payments, setPayments] = useState([]);
  const [reports, setReports] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [menuMessage, setMenuMessage] = useState('');
  const [, setStationTick] = useState(0);

  useEffect(() => {
    if (user) {
      onLoadOrders(user.role);
      if (user.role === 'receptionist') {
        onLoadCodes();
      }
      if (user.role === 'manager') {
        onLoadUsers();
        loadPayments();
        loadReports();
        onReloadMenu();
      }
    }
  }, [user]);

  useEffect(() => {
    if (user && user.role === 'manager' && managerTab === 'payments') {
      loadPayments();
    }
    if (user && user.role === 'manager' && managerTab === 'reports') {
      loadReports();
    }
  }, [managerTab]);

  useEffect(() => {
    if (!user || (user.role !== 'cook' && user.role !== 'barman')) {
      return undefined;
    }

    const hasActiveTimer = staffOrders.some((item) => item.status === 'pending' && item.ready_at);
    if (!hasActiveTimer) {
      return undefined;
    }

    const interval = setInterval(() => {
      setStationTick((current) => current + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [user, staffOrders]);

  const loadPayments = async () => {
    try {
      const result = await fetchPayments();
      setPayments(result.payments || []);
    } catch (error) {
      console.error(error);
      setMenuMessage('Unable to load payments.');
    }
  };

  const loadReports = async () => {
    try {
      const result = await fetchReports();
      setReports(result);
    } catch (error) {
      console.error(error);
      setMenuMessage('Unable to load reports.');
    }
  };

  const resetMenuForm = () => {
    setEditingItem(null);
    setFormData({ name: '', price: '', description: '', type: 'food', image: null });
    setImagePreview(null);
    setMenuMessage('');
    setUploadMessage('');
  };

  const handleCreateMenuItem = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.type || !formData.image) {
      setUploadMessage('Please fill all required fields');
      return;
    }

    setUploadLoading(true);
    setUploadMessage('');
    setMenuMessage('');

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('price', formData.price);
      data.append('description', formData.description);
      data.append('type', formData.type);
      data.append('image', formData.image);

      await createMenuItem(data);
      await onReloadMenu();

      setUploadMessage('✓ Menu item added successfully!');
      setShowMenuForm(false);
      resetMenuForm();
      setTimeout(() => setUploadMessage(''), 3000);
    } catch (error) {
      console.error(error);
      setUploadMessage('Error saving menu item');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleEditMenuItem = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      price: item.price,
      description: item.description || '',
      type: item.type,
      image: null
    });
    setImagePreview(item.image || null);
    setShowMenuForm(true);
  };

  const handleSaveMenuItem = async (e) => {
    e.preventDefault();
    if (!editingItem || !formData.name || !formData.price || !formData.type) {
      setMenuMessage('Please fill the required fields.');
      return;
    }

    setUploadLoading(true);
    setMenuMessage('');

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('price', formData.price);
      data.append('description', formData.description);
      data.append('type', formData.type);
      if (formData.image) {
        data.append('image', formData.image);
      }

      await updateMenuItem(editingItem.id, data);
      await onReloadMenu();
      setMenuMessage('✓ Menu item updated successfully!');
      setShowMenuForm(false);
      resetMenuForm();
      setTimeout(() => setMenuMessage(''), 3000);
    } catch (error) {
      console.error(error);
      setMenuMessage('Error updating menu item');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteMenuItem = async (id) => {
    if (!window.confirm('Delete this menu item?')) return;
    try {
      await deleteMenuItem(id);
      await onReloadMenu();
      setMenuMessage('✓ Menu item deleted successfully!');
      setTimeout(() => setMenuMessage(''), 3000);
    } catch (error) {
      console.error(error);
      setMenuMessage('Error deleting menu item');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatCountdown = (readyAt) => {
    const diff = new Date(readyAt) - new Date();
    const totalSeconds = Math.max(0, Math.ceil(diff / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getPreparationState = (item) => {
    if (item.status !== 'pending' || !item.ready_at) return null;
    const due = new Date(item.ready_at);
    const remaining = due - new Date();
    return {
      isReady: remaining <= 0,
      label: remaining <= 0 ? 'Time up' : formatCountdown(item.ready_at)
    };
  };

  const renderButtons = (item) => {
    const buttons = [];
    if (user.role === 'cook' && item.type === 'food') {
      if (item.status === 'pending' && !item.ready_at) {
        buttons.push(
          <button
            key="prepare"
            className="station-action-button prepare"
            onClick={() => {
              const minutes = window.prompt('Enter estimated minutes to prepare this item:');
              if (minutes === null) return;
              const parsed = Number(minutes);
              if (minutes === '' || Number.isNaN(parsed) || parsed < 0) {
                window.alert('Please enter a valid non-negative number.');
                return;
              }
              onUpdateItemStatus(item.item_id, 'pending', parsed);
            }}
          >
            Start preparation
          </button>
        );
      }
      if (item.status === 'pending' && item.ready_at) {
        const due = new Date(item.ready_at);
        const now = new Date();
        if (due > now) {
          buttons.push(
            <span key="prepping" className="station-prep-time">
              <span>Preparing</span>
              <strong>{formatCountdown(item.ready_at)}</strong>
            </span>
          );
        } else {
          buttons.push(<button key="ready" className="station-action-button ready" onClick={() => onUpdateItemStatus(item.item_id, 'ready')}>Mark ready</button>);
        }
      }
      if (item.status === 'ready') {
        buttons.push(<button key="deliver" className="station-action-button deliver" onClick={() => onUpdateItemStatus(item.item_id, 'delivered')}>Mark delivered</button>);
      }
    }
    if (user.role === 'barman' && item.type === 'drink') {
      if (item.status === 'pending' && !item.ready_at) {
        buttons.push(
          <button
            key="prepare"
            className="station-action-button prepare"
            onClick={() => {
              const minutes = window.prompt('Enter estimated minutes to prepare this item:');
              if (minutes === null) return;
              const parsed = Number(minutes);
              if (minutes === '' || Number.isNaN(parsed) || parsed < 0) {
                window.alert('Please enter a valid non-negative number.');
                return;
              }
              onUpdateItemStatus(item.item_id, 'pending', parsed);
            }}
          >
            Start preparation
          </button>
        );
      }
      if (item.status === 'pending' && item.ready_at) {
        const due = new Date(item.ready_at);
        const now = new Date();
        if (due > now) {
          buttons.push(
            <span key="prepping" className="station-prep-time">
              <span>Preparing</span>
              <strong>{formatCountdown(item.ready_at)}</strong>
            </span>
          );
        } else {
          buttons.push(<button key="ready" className="station-action-button ready" onClick={() => onUpdateItemStatus(item.item_id, 'ready')}>Mark ready</button>);
        }
      }
      if (item.status === 'ready') {
        buttons.push(<button key="deliver" className="station-action-button deliver" onClick={() => onUpdateItemStatus(item.item_id, 'delivered')}>Mark delivered</button>);
      }
    }
    return buttons.length ? <div className="action-buttons">{buttons}</div> : null;
  };

  const handleCreateUser = async () => {
    if (newUser.username && newUser.password && newUser.role) {
      await onCreateUser(newUser);
      setNewUser({ username: '', password: '', role: 'receptionist' });
      setShowStaffForm(false);
    }
  };

  const managerOrders = Object.values(
    staffOrders.reduce((acc, item) => {
      const id = item.order_id;
      if (!acc[id]) {
        acc[id] = { ...item, items: [] };
      }
      acc[id].items.push(item);
      return acc;
    }, {})
  );

  return (
    <div className="page-shell dashboard-page">
      <div className="page-card">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">{roleNames[user.role]} Portal</p>
            <h2>Welcome, {user.username}</h2>
            <p>Use the tools below to manage your station.</p>
          </div>
          <button className="secondary-button" onClick={onLogout}>Logout</button>
        </header>

        {user.role === 'receptionist' && (
          <div className="dashboard-section receptionist-dashboard">
            <div className="receptionist-hero">
              <div>
                <h3>Generate Customer Code</h3>
                <p>Create a table code for guests before they place an order.</p>
              </div>
              <div className="code-count-card">
                <span>Total codes</span>
                <strong>{customerCodes.length}</strong>
              </div>
            </div>

            <div className="code-generator-card">
              <div className="form-row">
                <label>Table Number</label>
                <input
                  type="number"
                  min="1"
                  value={tableNo}
                  onChange={(e) => setTableNo(e.target.value)}
                  placeholder="Table number"
                />
              </div>
              <button className="primary-button" onClick={() => onGenerateCode(Number(tableNo))} disabled={loading}>
                Generate Code for Table {tableNo}
              </button>
            </div>

            <div className="receptionist-section-header">
              <h3>Generated Customer Codes</h3>
              <span>{customerCodes.length} record{customerCodes.length === 1 ? '' : 's'}</span>
            </div>

            <div className="code-grid">
              {customerCodes.length === 0 ? <p>No customer codes yet.</p> : customerCodes.map((code) => {
                const isAvailable = code.status === '0';
                return (
                  <div key={code.id} className={`code-card ${isAvailable ? 'available' : 'used'}`}>
                    <div className="code-card-top">
                      <strong>{code.code}</strong>
                      <span className={`code-status ${isAvailable ? 'available' : 'used'}`}>
                        {isAvailable ? 'Available' : 'Used'}
                      </span>
                    </div>
                    <div className="code-card-meta">
                      <span>Table {code.table_no || 'N/A'}</span>
                      <span>{new Date(code.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {(user.role === 'cook' || user.role === 'barman') && (
          <div className="dashboard-section station-dashboard">
            <div className="station-orders-header">
              <div>
                <h3>Station Orders</h3>
                <p>{user.role === 'cook' ? 'Kitchen' : 'Bar'} items waiting for your station.</p>
              </div>
              <span>{staffOrders.length} item{staffOrders.length === 1 ? '' : 's'}</span>
            </div>
            {staffOrders.length === 0 ? (
              <p>No active orders for your station.</p>
            ) : (
              <div className="order-list">
                {staffOrders.map((item) => (
                  <div key={item.item_id} className="order-card station-order-card">
                    <div className="station-order-summary">
                      <strong>{item.name}</strong>
                      <div className="station-meta-row">
                        <span>Table {item.table_no}</span>
                        <span>{item.type === 'food' ? 'Kitchen' : 'Bar'}</span>
                      </div>
                      <div className="station-meta-row">
                        <span className="status-tag">{item.status}</span>
                        <span>Qty: {item.quantity}</span>
                        {getPreparationState(item) && (
                          <span className={`station-countdown ${getPreparationState(item).isReady ? 'ready' : ''}`}>
                            {getPreparationState(item).label}
                          </span>
                        )}
                      </div>
                    </div>
                    {renderButtons(item)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {user.role === 'manager' && (
          <div className="dashboard-section manager-dashboard">
            <div className="manager-tabs">
              {['orders', 'payments', 'menu', 'reports', 'staff'].map((tab) => (
                <button
                  key={tab}
                  className={managerTab === tab ? 'tab active' : 'tab'}
                  onClick={() => setManagerTab(tab)}
                >
                  {tab === 'staff' ? 'Staff' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {managerTab === 'orders' && (
              <div className="manager-panel">
                <div className="manager-orders-header">
                  <h3>All Orders</h3>
                  <span>{managerOrders.length} order{managerOrders.length === 1 ? '' : 's'}</span>
                </div>
                {staffOrders.length === 0 ? (
                  <p>No orders available.</p>
                ) : (
                  <div className="order-list">
                    {managerOrders.map((order) => (
                      <div key={order.order_id} className="order-card">
                        <div className="order-summary">
                          <strong>Order #{order.order_id}</strong>
                          <p>Table: {order.table_no}</p>
                          <p>Customer Code: {order.customer_code}</p>
                          <div className="order-meta">
                            <span className="status-tag">{order.order_status}</span>
                            <span className={`payment-tag ${order.paid ? 'paid' : 'unpaid'}`}>
                              {order.paid ? 'Paid' : 'Unpaid'}
                            </span>
                          </div>
                        </div>

                        <div className="order-detail-panel">
                          <div className="order-items">
                            {order.items.map((item) => (
                              <div key={item.item_id} className="order-item-row">
                                <div>
                                  <strong>{item.name}</strong>
                                  <p>{item.quantity} x {Number(item.item_price || item.price || 0).toLocaleString()} RWF</p>
                                </div>
                                <div className="order-item-meta">
                                  <span className="item-type">{item.type}</span>
                                  <span className="item-status">{item.status}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className={`order-total-panel ${order.paid ? 'paid' : 'unpaid'}`}>
                            <span>Total</span>
                            <strong>{Number(order.total_price || 0).toLocaleString()} RWF</strong>
                            {!order.paid && <span className="order-balance">Pending payment</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {managerTab === 'payments' && (
              <div className="manager-panel">
                <div className="manager-payments-header">
                  <div>
                    <h3>Payments</h3>
                    <p>Track recorded customer payments and payment totals.</p>
                  </div>
                  <div className="payment-total-card">
                    <span>Total payments</span>
                    <strong>{payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0).toLocaleString()} RWF</strong>
                  </div>
                </div>
                {payments.length === 0 ? (
                  <p>No payment records available.</p>
                ) : (
                  <div className="payment-list">
                    {payments.map((payment) => (
                      <div key={payment.id} className="payment-card">
                        <div className="payment-card-main">
                          <strong>{payment.customer_code}</strong>
                          <span>{payment.phone_number}</span>
                          <p>Order status: {payment.order_status || 'N/A'}</p>
                        </div>
                        <div className="payment-card-meta">
                          <span className="payment-amount">{Number(payment.amount).toLocaleString()} RWF</span>
                          <span>{new Date(payment.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {managerTab === 'menu' && (
              <div className="manager-panel">
                <div className="menu-card-header">
                  <div>
                    <h3>Menu Management</h3>
                    <p>View and manage all menu items from one place.</p>
                  </div>
                  <button className="primary-button" onClick={() => {
                    resetMenuForm();
                    setShowMenuForm(true);
                  }}>
                    Add menu item
                  </button>
                </div>

                <div className="menu-list-card">
                  {menu?.length === 0 ? (
                    <p>No menu items available.</p>
                  ) : (
                    <div className="menu-table-wrap">
                      <table className="menu-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Image</th>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {menu.map((item, idx) => (
                            <tr key={item.id}>
                              <td>{idx + 1}</td>
                              <td>
                                <img
                                  src={item.image || 'https://via.placeholder.com/80?text=No'}
                                  alt={item.name}
                                  className="menu-thumb"
                                />
                              </td>
                              <td>{item.name}</td>
                              <td>{item.type}</td>
                              <td>{Number(item.price).toLocaleString()} RWF</td>
                              <td>
                                <button className="secondary-button" onClick={() => handleEditMenuItem(item)}>Edit</button>
                                <button className="secondary-button danger" onClick={() => handleDeleteMenuItem(item.id)} style={{ marginLeft: 8 }}>Delete</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {showMenuForm && (
                  <div className="modal-backdrop" onClick={() => setShowMenuForm(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                      <div className="modal-header">
                        <div>
                          <h3>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</h3>
                          <p>{editingItem ? 'Update the item details below.' : 'Fill in item details and upload an image.'}</p>
                        </div>
                        <button className="close-button" type="button" onClick={() => setShowMenuForm(false)}>&times;</button>
                      </div>
                      <form className="modal-form" onSubmit={editingItem ? handleSaveMenuItem : handleCreateMenuItem}>
                        <div className="form-row">
                          <label>Name</label>
                          <input name="name" value={formData.name} onChange={handleInputChange} required />
                        </div>
                        <div className="form-row">
                          <label>Price</label>
                          <input name="price" type="number" min="0" value={formData.price} onChange={handleInputChange} required />
                        </div>
                        <div className="form-row">
                          <label>Description</label>
                          <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" />
                        </div>
                        <div className="form-row">
                          <label>Category</label>
                          <select name="type" value={formData.type} onChange={handleInputChange}>
                            <option value="food">Food</option>
                            <option value="drink">Drink</option>
                          </select>
                        </div>
                        <div className="form-row">
                          <label>Image {editingItem ? '(optional)' : '*'}</label>
                          <input type="file" accept="image/*" onChange={handleImageChange} />
                        </div>
                        {imagePreview && <img src={imagePreview} alt="Preview" className="menu-image-preview" />}
                        <div className="form-buttons">
                          <button type="submit" className="primary-button" disabled={uploadLoading}>
                            {uploadLoading ? 'Saving...' : editingItem ? 'Save changes' : 'Add item'}
                          </button>
                          <button type="button" className="secondary-button" onClick={() => setShowMenuForm(false)}>
                            Cancel
                          </button>
                        </div>
                        {(uploadMessage || menuMessage) && (
                          <div className={`form-alert ${uploadMessage.includes('Error') || menuMessage.includes('Error') ? 'error' : 'success'}`}>
                            {uploadMessage || menuMessage}
                          </div>
                        )}
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {managerTab === 'reports' && (
              <div className="manager-panel">
                <h3>Reports</h3>
                {reports ? (
                  <div className="report-grid">
                    <div className="report-card">
                      <strong>{reports.total_orders}</strong>
                      <span>Total orders</span>
                    </div>
                    <div className="report-card">
                      <strong>{reports.completed_orders}</strong>
                      <span>Completed orders</span>
                    </div>
                    <div className="report-card">
                      <strong>{reports.pending_orders}</strong>
                      <span>Pending orders</span>
                    </div>
                    <div className="report-card">
                      <strong>{Number(reports.total_sales).toLocaleString()} RWF</strong>
                      <span>Total sales</span>
                    </div>
                    <div className="report-card">
                      <strong>{Number(reports.total_payments).toLocaleString()} RWF</strong>
                      <span>Total payments</span>
                    </div>
                    <div className="report-card">
                      <strong>{Number(reports.outstanding_balance).toLocaleString()} RWF</strong>
                      <span>Outstanding balance</span>
                    </div>
                  </div>
                ) : (
                  <p>Loading report data...</p>
                )}
              </div>
            )}

            {managerTab === 'staff' && (
              <div className="manager-panel staff-management-panel">
                <div className="staff-card-header">
                  <div>
                    <h3>Staff Management</h3>
                    <p>Manage employee accounts and assign station roles.</p>
                  </div>
                  <button className="primary-button" onClick={() => setShowStaffForm(true)}>
                    Add staff
                  </button>
                </div>

                <div className="user-grid">
                  {users.length === 0 ? (
                    <div className="info-panel">No staff accounts yet.</div>
                  ) : users.map((staff) => (
                    <div key={staff.id} className="user-card">
                      <strong>{staff.username}</strong>
                      <span>Role: {staff.role}</span>
                    </div>
                  ))}
                </div>

                {showStaffForm && (
                  <div className="modal-backdrop" onClick={() => setShowStaffForm(false)}>
                    <div className="modal-card staff-modal-card" onClick={(e) => e.stopPropagation()}>
                      <div className="modal-header">
                        <div>
                          <h3>Add Staff</h3>
                          <p>Create a staff account and choose their role.</p>
                        </div>
                        <button className="close-button" type="button" onClick={() => setShowStaffForm(false)}>&times;</button>
                      </div>

                      <form className="modal-form staff-modal-form" onSubmit={(e) => {
                        e.preventDefault();
                        handleCreateUser();
                      }}>
                        <div className="form-row">
                          <label>Username</label>
                          <input value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} placeholder="Enter username" required />
                        </div>
                        <div className="form-row">
                          <label>Password</label>
                          <input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="Enter password" required />
                        </div>
                        <div className="form-row">
                          <label>Role</label>
                          <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                            <option value="receptionist">Receptionist</option>
                            <option value="cook">Cook</option>
                            <option value="barman">Barman</option>
                            <option value="manager">Manager</option>
                          </select>
                        </div>
                        <div className="form-buttons">
                          <button className="primary-button" type="submit" disabled={loading || !newUser.username || !newUser.password}>
                            {loading ? 'Creating...' : 'Create staff'}
                          </button>
                          <button className="secondary-button" type="button" onClick={() => setShowStaffForm(false)}>
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {message && <div className="toast">{message}</div>}
      </div>
    </div>
  );
}
