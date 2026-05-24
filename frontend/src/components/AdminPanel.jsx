import { useState } from 'react';
import '../styles/AdminPanel.css';

const AdminPanel = () => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    type: 'food',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      
      // Show image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.type || !formData.image) {
      setMessage('Please fill all required fields');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('type', formData.type);
      formDataToSend.append('image', formData.image);

      const response = await fetch('http://localhost:4000/api/menu', {
        method: 'POST',
        body: formDataToSend
      });

      if (!response.ok) {
        throw new Error('Failed to add menu item');
      }

      setMessage('✓ Menu item added successfully!');
      setFormData({
        name: '',
        price: '',
        description: '',
        type: 'food',
        image: null
      });
      setImagePreview(null);

      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-container">
        <h1>Add New Menu Item</h1>
        
        {message && (
          <div className={`admin-message ${message.includes('✓') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label htmlFor="name">Item Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Burger"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="price">Price (RWF) *</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="e.g., 8000"
              required
              min="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Item description..."
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="type">Category *</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              required
            >
              <option value="food">Food</option>
              <option value="drink">Drink</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="image">Upload Image *</label>
            <input
              type="file"
              id="image"
              name="image"
              accept="image/*"
              onChange={handleImageChange}
              required
            />
          </div>

          {imagePreview && (
            <div className="image-preview">
              <p>Image Preview:</p>
              <img src={imagePreview} alt="Preview" />
            </div>
          )}

          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Adding Item...' : 'Add Menu Item'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminPanel;
