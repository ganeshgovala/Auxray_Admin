import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';
import { getCachedInventoryData, setCachedInventoryData, clearInventoryCache } from '../utils/cacheManager';
import { buildApiUrl, API_ENDPOINTS, getAuthHeaders } from '../utils/apiConfig';

const Inventory = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('products');
  const [showAddModal, setShowAddModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [groupedProducts, setGroupedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [formData, setFormData] = useState({
    product_name: '',
    image: '',
    cost: '',
    category: ''
  });
  const [customCategory, setCustomCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      navigate('/');
      return;
    }

    const parsedUser = JSON.parse(userData);
    
    // Verify role is 4 (Child Admin) or 5 (Super Admin)
    if (parsedUser.role !== 4 && parsedUser.role !== 5) {
      localStorage.clear();
      navigate('/');
      return;
    }

    setUser(parsedUser);
    
    // Load products and categories (from cache or API)
    loadInventoryData(token);
  }, [navigate]);

  const loadInventoryData = (token) => {
    // Check if we have cached data
    const cachedData = getCachedInventoryData();

    if (cachedData) {
      setProducts(cachedData.products || []);
      setCategories(cachedData.categories || []);
      setGroupedProducts(cachedData.groupedProducts || []);
      setLoading(false);
      setCategoriesLoading(false);
      return;
    }

    // Fetch fresh data
    fetchProducts(token);
    fetchCategories(token);
    fetchGroupedProducts(token);
  };

  const fetchProducts = async (token) => {
    try {
      const response = await axios.get(
        buildApiUrl(API_ENDPOINTS.PRODUCTS),
        {
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      const productsData = response.data.products || [];
      setProducts(productsData);
      setLoading(false);
      updateInventoryCache({ products: productsData });
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  };

  const fetchCategories = async (token) => {
    setCategoriesLoading(true);
    try {
      const response = await axios.get(
        buildApiUrl(API_ENDPOINTS.PRODUCTS_CATEGORIES),
        {
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      const categoriesData = response.data.categories || [];
      setCategories(categoriesData);
      setCategoriesLoading(false);
      updateInventoryCache({ categories: categoriesData });
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategoriesLoading(false);
    }
  };

  const fetchGroupedProducts = async (token) => {
    try {
      const response = await axios.get(
        buildApiUrl(API_ENDPOINTS.PRODUCTS_GROUPED),
        {
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      const groupedData = response.data.data || [];
      setGroupedProducts(groupedData);
      updateInventoryCache({ groupedProducts: groupedData });
    } catch (error) {
      console.error('Error fetching grouped products:', error);
    }
  };

  const updateInventoryCache = (newData) => {
    const cachedData = getCachedInventoryData() || {};
    const updatedData = { ...cachedData, ...newData };
    setCachedInventoryData(updatedData);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    const token = localStorage.getItem('token');

    try {
      // Use custom category if 'Other' was selected
      const productData = {
        ...formData,
        category: formData.category === 'Other' ? customCategory : formData.category
      };

      const response = await axios.post(
        buildApiUrl(API_ENDPOINTS.PRODUCTS_CREATE),
        productData,
        {
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setSuccess('Product created successfully!');
      setProducts([response.data.product, ...products]);
      
      // Clear cache and refresh data
      clearInventoryCache();
      fetchProducts(token);
      fetchCategories(token);
      fetchGroupedProducts(token);
      
      // Reset form and close modal after a short delay
      setTimeout(() => {
        setShowAddModal(false);
        setFormData({
          product_name: '',
          image: '',
          cost: '',
          category: ''
        });
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create product. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setFormData({
      product_name: '',
      image: '',
      cost: '',
      category: ''
    });
    setCustomCategory('');
    setError('');
    setSuccess('');
  };

  const handleDeleteProduct = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    setDeleting(true);
    const token = localStorage.getItem('token');

    try {
      await axios.delete(
        `${buildApiUrl(API_ENDPOINTS.PRODUCTS_DELETE)}/${productToDelete._id}`,
        {
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Clear cache and refresh products list
      clearInventoryCache();
      fetchProducts(token);
      fetchCategories(token);
      fetchGroupedProducts(token);
      setShowDeleteModal(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      alert(error.response?.data?.message || 'Failed to delete product. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setProductToDelete(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeMenu="Inventory" />
      {/* Main Content */}
      <main className="flex-1 ml-64 overflow-auto">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Inventory</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search database"
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 w-80"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-teal-700 hover:bg-teal-800 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="p-8">
        {/* Tabs */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition duration-200 ${
              activeTab === 'products'
                ? 'bg-teal-700 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Products
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition duration-200 ${
              activeTab === 'categories'
                ? 'bg-teal-700 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Categories
          </button>
        </div>

        {/* Products Grid */}
        {activeTab === 'products' && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-600">Loading products...</div>
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <p className="text-gray-600">No products found. Add your first product!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => {
                  // Convert Google Drive URL to direct image URL
                  let imageUrl = product.image;
                  if (imageUrl && imageUrl.includes('drive.google.com')) {
                    const fileId = imageUrl.match(/\/d\/(.+?)\/|id=(.+)/)?.[1] || imageUrl.match(/id=(.+)/)?.[1];
                    if (fileId) {
                      imageUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
                    }
                  }
                  
                  // Parse cost to number (remove ₹ symbol and convert)
                  const price = typeof product.cost === 'string' 
                    ? parseInt(product.cost.replace(/[₹,]/g, '')) 
                    : product.cost;

                  return (
                    <div key={product._id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition duration-200">
                      {/* Product Image */}
                      <div className="relative h-48 bg-gradient-to-br from-blue-100 to-blue-50">
                        <img
                          src={imageUrl || 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=250&fit=crop'}
                          alt={product.product_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=250&fit=crop';
                          }}
                        />
                        <div className="absolute top-3 left-3">
                          <span className="bg-teal-700 text-white text-xs font-semibold px-3 py-1 rounded-full">
                            {product.category?.toUpperCase() || 'PRODUCT'}
                          </span>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-lg font-bold text-gray-800">{product.product_name}</h3>
                          <div className="flex gap-2">
                            <button className="text-gray-500 hover:text-teal-700 transition">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button 
                              onClick={() => handleDeleteProduct(product)}
                              className="text-gray-500 hover:text-red-600 transition"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                          {product.cost || `₹ ${price?.toLocaleString('en-IN') || '0'}`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Categories Tab Content */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">Products by Category</h3>
                <span className="text-sm text-gray-600">{groupedProducts.length} {groupedProducts.length === 1 ? 'Category' : 'Categories'}</span>
              </div>
            </div>
            
            {categoriesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-600">Loading categories...</div>
              </div>
            ) : groupedProducts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <p className="text-gray-600">No products found.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {groupedProducts.map((group, groupIndex) => {
                  const categoryProducts = group.products || [];
                  
                  return (
                    <div key={groupIndex} className="bg-white rounded-xl shadow-sm overflow-hidden">
                      {/* Category Header */}
                      <div className="bg-gradient-to-r from-teal-700 to-teal-600 px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="text-xl font-bold text-white">{group.category}</h4>
                              <p className="text-teal-100 text-sm">{categoryProducts.length} {categoryProducts.length === 1 ? 'Product' : 'Products'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Products Grid */}
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {categoryProducts.map((product) => {
                            // Convert Google Drive link to direct view URL
                            let imageUrl = product.image;
                            if (imageUrl && imageUrl.includes('drive.google.com')) {
                              const fileId = imageUrl.match(/\/d\/(.+?)\/|id=(.+)/)?.[1] || imageUrl.match(/id=(.+)/)?.[1];
                              if (fileId) {
                                imageUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
                              }
                            }
                            
                            // Parse cost
                            const price = typeof product.cost === 'string' 
                              ? parseInt(product.cost.replace(/[₹,]/g, '')) 
                              : product.cost;

                            return (
                              <div key={product._id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition duration-200">
                                {/* Product Image */}
                                <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-50">
                                  <img
                                    src={imageUrl || 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=250&fit=crop'}
                                    alt={product.product_name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.src = 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=250&fit=crop';
                                    }}
                                  />
                                </div>

                                {/* Product Info */}
                                <div className="p-4">
                                  <h5 className="font-bold text-gray-800 mb-2 truncate">{product.product_name}</h5>
                                  <p className="text-lg font-bold text-teal-700">
                                    {product.cost || `₹ ${price?.toLocaleString('en-IN') || '0'}`}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Add Product Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
                {/* Modal Header */}
                <div className="bg-teal-800 px-6 py-5 relative">
                  <h3 className="text-2xl font-bold text-white mb-1">Add Product</h3>
                  <p className="text-xs text-teal-200 uppercase tracking-wider font-medium">Asset Configuration</p>
                  <button
                    onClick={handleModalClose}
                    className="absolute top-4 right-4 text-white hover:bg-teal-700 rounded-full p-2 transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6">
                  {/* Success Message */}
                  {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
                      <p className="text-sm">{success}</p>
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                      <p className="text-sm">{error}</p>
                    </div>
                  )}

                  <form onSubmit={handleAddProduct} className="space-y-5">
                    {/* Product Name */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Product Name</label>
                      <input
                        type="text"
                        name="product_name"
                        value={formData.product_name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-800"
                        placeholder="Enter product name"
                        required
                      />
                    </div>

                    {/* Image URL */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Image URL</label>
                      <input
                        type="text"
                        name="image"
                        value={formData.image}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-800"
                        placeholder="Enter image URL"
                        required
                      />
                    </div>

                    {/* Category and Price Row */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Category */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                        <select 
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-800 bg-white appearance-none cursor-pointer"
                          required
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 0.75rem center',
                            backgroundSize: '1.25rem'
                          }}
                        >
                          <option value="">Select</option>
                          {categories.map((category, index) => (
                            <option key={index} value={category}>{category}</option>
                          ))}
                          <option value="Other">Other (Custom)</option>
                        </select>
                      </div>

                      {/* Custom Category Input - Shows when Other is selected */}
                      {formData.category === 'Other' && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Custom Category</label>
                          <input
                            type="text"
                            value={customCategory}
                            onChange={(e) => setCustomCategory(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-800"
                            placeholder="Enter custom category"
                            required
                          />
                        </div>
                      )}

                      {/* Price */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Price</label>
                        <input
                          type="text"
                          name="cost"
                          value={formData.cost}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-800"
                          placeholder="₹4500"
                          required
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-6">
                      <button
                        type="button"
                        onClick={handleModalClose}
                        disabled={submitting}
                        className="flex-1 px-6 py-3 text-gray-600 font-semibold rounded-lg hover:bg-gray-100 transition duration-200 disabled:opacity-50"
                      >
                        CANCEL
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 px-6 py-3 bg-teal-700 text-white font-semibold rounded-lg hover:bg-teal-800 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                      >
                        {submitting ? 'ADDING...' : 'ADD'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteModal && productToDelete && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-5">
                  <h2 className="text-2xl font-bold text-white">Confirm Delete</h2>
                  <p className="text-red-100 text-sm mt-1">This action cannot be undone</p>
                </div>

                {/* Modal Body */}
                <div className="p-6">
                  {/* Warning Icon */}
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="text-center mb-6">
                    <p className="text-gray-700 mb-2">Are you sure you want to delete this product?</p>
                    <div className="bg-gray-50 rounded-lg p-4 mt-4">
                      <p className="font-bold text-gray-900 text-lg">{productToDelete.product_name}</p>
                      <p className="text-sm text-gray-600 mt-1">{productToDelete.category}</p>
                      <p className="text-lg font-semibold text-teal-700 mt-2">{productToDelete.cost}</p>
                    </div>
                  </div>

                  {/* Modal Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={cancelDelete}
                      className="flex-1 px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold transition"
                      disabled={deleting}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDelete}
                      className="flex-1 px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={deleting}
                    >
                      {deleting ? 'Deleting...' : 'Delete Product'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Inventory;
