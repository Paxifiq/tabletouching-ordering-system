import { useEffect, useMemo, useRef, useState } from 'react';

const currency = (value) => `${Number(value).toLocaleString()} RWF`;

const STATUS_CONFIG = {
  pending: { color: '#475569', bg: '#f1f5f9', label: 'Pending' },
  preparing: { color: '#1d4ed8', bg: '#eef5ff', label: 'Preparing' },
  ready: { color: '#475569', bg: '#f1f5f9', label: 'Ready' },
  delivered: { color: '#475569', bg: '#f1f5f9', label: 'Delivered' }
};

const STATUS_ORDER = ['pending', 'preparing', 'ready', 'delivered'];

export default function OrderStatusModal({ orders, onClose, onPay, onAutoMarkReady, loading }) {
  const [paymentPhoneNumber, setPaymentPhoneNumber] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [tick, setTick] = useState(0);
  const autoMarkedRef = useRef(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [viewMode, setViewMode] = useState('grouped');

  if (!orders) return null;

  const totalUnpaid = orders.orders.reduce((sum, order) => (
    !order.paid ? sum + Number(order.total_price || 0) : sum
  ), 0);
  const unpaidOrderIds = useMemo(
    () => new Set(orders.orders.filter((order) => !order.paid).map((order) => String(order.id))),
    [orders.orders]
  );
  const unpaidItems = useMemo(
    () => orders.items.filter((item) => unpaidOrderIds.has(String(item.order_id))),
    [orders.items, unpaidOrderIds]
  );
  const unpaidItemsDelivered = unpaidItems.length > 0 && unpaidItems.every((item) => item.status === 'delivered');
  const hasUnpaidReadyForPayment = unpaidItemsDelivered && totalUnpaid > 0;

  useEffect(() => {
    setPaymentAmount(String(totalUnpaid));
  }, [totalUnpaid]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
      const now = new Date();
      orders.items.forEach((item) => {
        if (item.status === 'pending' && item.ready_at) {
          const due = new Date(item.ready_at);
          if (due <= now && !autoMarkedRef.current.has(item.id)) {
            autoMarkedRef.current.add(item.id);
            if (typeof onAutoMarkReady === 'function') {
              onAutoMarkReady(item.id);
            }
          }
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [orders, onAutoMarkReady]);

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTimeRemaining = (item) => {
    if (!item.ready_at) return null;
    const diff = new Date(item.ready_at) - new Date();
    return diff > 0 ? formatTime(diff) : '00:00';
  };

  const handlePayment = () => {
    if (!paymentPhoneNumber.trim()) {
      alert('Please enter phone number');
      return;
    }

    const amountToPay = Number(paymentAmount) || totalUnpaid;
    onPay(amountToPay, paymentPhoneNumber);
    setPaymentPhoneNumber('');
    setPaymentAmount(String(totalUnpaid));
  };

  const filteredItems = useMemo(() => {
    return orders.items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders.items, searchTerm, statusFilter]);

  const groupedItems = useMemo(() => {
    const groups = {};
    filteredItems.forEach((item) => {
      const orderId = item.order_id;
      if (!groups[orderId]) {
        groups[orderId] = {
          order: orders.orders.find((order) => String(order.id) === String(orderId)),
          items: []
        };
      }
      groups[orderId].items.push(item);
    });
    return groups;
  }, [filteredItems, orders.orders]);

  const statusSummary = useMemo(() => {
    const summary = { all: orders.items.length };
    STATUS_ORDER.forEach((status) => {
      summary[status] = orders.items.filter((item) => item.status === status).length;
    });
    return summary;
  }, [orders.items]);

  const getStatusConfig = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  const paymentPanel = hasUnpaidReadyForPayment && (
    <div className="payment-panel payment-panel-ready">
      <div className="payment-panel-header">
        <div>
          <h4>Ready to Pay</h4>
          <p>{unpaidItems.length} delivered item{unpaidItems.length !== 1 ? 's' : ''} awaiting payment</p>
        </div>
        <span className="payment-due">{currency(totalUnpaid)}</span>
      </div>
      <div className="payment-form">
        <div className="form-row">
          <label>Phone Number</label>
          <input
            type="text"
            value={paymentPhoneNumber}
            onChange={(event) => setPaymentPhoneNumber(event.target.value)}
            placeholder="Enter phone number for mobile payment"
          />
        </div>
        <div className="form-row">
          <label>Amount</label>
          <input type="number" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} readOnly />
        </div>
        <div className="payment-actions">
          <button className="secondary-button" onClick={onClose}>Close</button>
          <button className="primary-button pay-button" onClick={handlePayment} disabled={loading}>
            {loading ? 'Processing...' : 'Pay Now'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="modal-backdrop order-status-backdrop" onClick={onClose}>
      <div className="modal-card order-status-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Order Status</h3>
            <p className="modal-subtitle">
              {orders.orders.length} order{orders.orders.length !== 1 ? 's' : ''} - {orders.items.length} item{orders.items.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button className="close-button" onClick={onClose}>x</button>
        </div>

        <div className="status-filter-bar">
          <div className="filter-pills">
            <button className={`filter-pill ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>
              All <span className="pill-count">{statusSummary.all}</span>
            </button>
            {STATUS_ORDER.map((status) => {
              const config = getStatusConfig(status);
              return (
                <button
                  key={status}
                  className={`filter-pill ${statusFilter === status ? 'active' : ''}`}
                  onClick={() => setStatusFilter(status)}
                  style={{ '--pill-color': config.color, '--pill-bg': config.bg }}
                >
                  {config.label} <span className="pill-count">{statusSummary[status]}</span>
                </button>
              );
            })}
          </div>

          <div className="search-box">
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <div className="view-toggle">
            <button className={`toggle-btn ${viewMode === 'grouped' ? 'active' : ''}`} onClick={() => setViewMode('grouped')}>
              Grouped
            </button>
            <button className={`toggle-btn ${viewMode === 'flat' ? 'active' : ''}`} onClick={() => setViewMode('flat')}>
              List
            </button>
          </div>
        </div>

        {paymentPanel}

        {orders.orders.length > 0 && (
          <div className="orders-summary-row">
            {orders.orders.map((order) => (
              <div
                key={order.id}
                className={`summary-card ${expandedOrder === order.id ? 'expanded' : ''}`}
                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
              >
                <div className="summary-card-header">
                  <div className="summary-card-title">
                    <span className="table-badge">Table {order.table_no}</span>
                    <span className={`payment-badge ${order.paid ? 'paid' : 'unpaid'}`}>
                      {order.paid ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                  <div className="summary-card-amount">{currency(order.total_price)}</div>
                </div>
                <div className="summary-card-meta">
                  <span className={`status-dot ${order.status}`}></span>
                  {order.status}
                  <span className="meta-divider">-</span>
                  {groupedItems[String(order.id)]?.items.length || 0} items
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="items-container">
          {filteredItems.length === 0 ? (
            <div className="empty-state">
              <p>No items match your filters</p>
            </div>
          ) : viewMode === 'grouped' ? (
            Object.entries(groupedItems).map(([orderId, group]) => (
              <div key={orderId} className="order-group">
                {group.order && (
                  <div className="order-group-header">
                    <span className="group-table">Table {group.order.table_no}</span>
                    <span className="group-count">{group.items.length} item{group.items.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
                <div className="items-grid">
                  {group.items.map((item) => {
                    const config = getStatusConfig(item.status);
                    const remaining = getTimeRemaining(item);
                    return (
                      <div key={item.id} className="item-card">
                        <div className="item-card-header">
                          <span className="item-name">{item.name}</span>
                          <span className="item-qty">x{item.quantity}</span>
                        </div>
                        <div className="item-card-body">
                          <span className="item-status-badge" style={{ background: config.bg, color: config.color }}>
                            {config.label}
                          </span>
                          {remaining && item.status === 'pending' && (
                            <span className="item-time">{remaining}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="items-flat-list">
              {filteredItems.map((item) => {
                const config = getStatusConfig(item.status);
                const remaining = getTimeRemaining(item);
                const order = orders.orders.find((row) => String(row.id) === String(item.order_id));
                return (
                  <div key={item.id} className="flat-item-row">
                    <div className="flat-item-info">
                      <span className="flat-item-name">{item.name}</span>
                      <span className="flat-item-qty">x{item.quantity}</span>
                      {order && <span className="flat-item-table">Table {order.table_no}</span>}
                    </div>
                    <div className="flat-item-meta">
                      <span className="item-status-badge" style={{ background: config.bg, color: config.color }}>
                        {config.label}
                      </span>
                      {remaining && item.status === 'pending' && (
                        <span className="item-time">{remaining}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {totalUnpaid > 0 && !unpaidItemsDelivered && (
          <div className="waiting-panel">
            <span>Waiting for unpaid items to be delivered before payment...</span>
          </div>
        )}
      </div>
    </div>
  );
}
