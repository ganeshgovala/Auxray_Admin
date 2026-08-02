import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import Sidebar from './Sidebar';
import { buildApiUrl, API_ENDPOINTS, getStoredUser } from '../utils/apiConfig';
import { BRAND_TYPES, fetchBrands } from '../store/brandsSlice';

// Distinct accent + icon per brand category. Keyed by the exact category
// string the backend uses.
const TYPE_META = {
  'Panel brand': {
    accent: 'bg-amber-50 text-amber-600',
    icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v10a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm4 0v11m4-11v11m4-11v11M4 9h16M4 13h16M9 20h6',
  },
  'Invertor brand': {
    accent: 'bg-teal-50 text-teal-600',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
  },
  'Cables brand': {
    accent: 'bg-indigo-50 text-indigo-600',
    icon: 'M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5m6.656-2.828a4 4 0 00-5.656 0l-3 3',
  },
};

const DEFAULT_META = {
  accent: 'bg-gray-100 text-gray-500',
  icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
};

const emptyForm = { company_name: '', description: '', logo: '' };

const Brands = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const brands = useSelector((s) => s.brands.items);
  const loading = useSelector(
    (s) => s.brands.status === 'loading' && s.brands.items.length === 0
  );
  const [user, setUser] = useState(null);
  const [selectedType, setSelectedType] = useState(null); // category string or null (cards view)

  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [brandToDelete, setBrandToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }
    const parsedUser = getStoredUser();
    if (!parsedUser) {
      localStorage.clear();
      navigate('/');
      return;
    }
    // Roles 4 (Child Admin) and 5 (Super Admin), same as Inventory.
    if (parsedUser.role !== 4 && parsedUser.role !== 5) {
      localStorage.clear();
      navigate('/');
      return;
    }
    setUser(parsedUser);
    dispatch(fetchBrands());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError('');
  };

  const handleAddBrand = async (e) => {
    e.preventDefault();
    const companyName = form.company_name.trim();
    if (!companyName || !selectedType) return;

    setSubmitting(true);
    setFormError('');
    const token = localStorage.getItem('token');

    try {
      await axios.post(
        buildApiUrl(API_ENDPOINTS.BRANDS_CREATE),
        {
          company_name: companyName,
          category: selectedType,
          description: form.description.trim(),
          logo: form.logo.trim(),
        },
        {
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setForm(emptyForm);
      dispatch(fetchBrands({ force: true }));
    } catch (err) {
      setFormError(
        err.response?.data?.message || 'Failed to create brand. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!brandToDelete) return;
    setDeleting(true);
    const token = localStorage.getItem('token');

    try {
      await axios.delete(
        `${buildApiUrl(API_ENDPOINTS.BRANDS_DELETE)}/${brandToDelete._id}`,
        {
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      dispatch(fetchBrands({ force: true }));
      setBrandToDelete(null);
    } catch (err) {
      alert(
        err.response?.data?.message || 'Failed to delete brand. Please try again.'
      );
    } finally {
      setDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const selectedMeta = selectedType
    ? BRAND_TYPES.find((t) => t.key === selectedType)
    : null;
  const selectedBrands = selectedType
    ? brands.filter((b) => b.category === selectedType)
    : [];

  // Normalise a possibly Google-Drive logo link into a directly renderable URL.
  const resolveLogo = (logo) => {
    if (!logo) return '';
    if (logo.includes('drive.google.com')) {
      const fileId =
        logo.match(/\/d\/(.+?)\/|id=(.+)/)?.[1] || logo.match(/id=(.+)/)?.[1];
      if (fileId) return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
    return logo;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeMenu="Brands" />
      <main className="flex-1 ml-64 overflow-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Brands</h2>
        </header>

        <div className="p-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600">Loading brands...</div>
            </div>
          ) : (
            <>
              {/* Cards view */}
              {!selectedType && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {BRAND_TYPES.map(({ key, label }) => {
                    const meta = TYPE_META[key] || DEFAULT_META;
                    const count = brands.filter((b) => b.category === key).length;
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          setSelectedType(key);
                          setForm(emptyForm);
                          setFormError('');
                        }}
                        className="text-left bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md hover:border-teal-200 transition"
                      >
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${meta.accent}`}>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={meta.icon} />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">{label}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {count} {count === 1 ? 'brand' : 'brands'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Detail view for a selected category */}
              {selectedType && (
                <div>
                  <button
                    onClick={() => setSelectedType(null)}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-teal-700 mb-6 font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Brands
                  </button>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 max-w-2xl">
                    <div className="px-6 py-4 border-b border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {selectedMeta?.label} Brands
                      </h3>
                    </div>

                    {/* Add brand */}
                    <form onSubmit={handleAddBrand} className="px-6 py-4 border-b border-gray-100 space-y-3">
                      {formError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                          {formError}
                        </div>
                      )}
                      <input
                        type="text"
                        name="company_name"
                        value={form.company_name}
                        onChange={handleInputChange}
                        placeholder={`Brand name (e.g. ${selectedMeta?.label === 'Panels' ? 'Tata Power Solar' : 'Company name'})`}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <input
                        type="text"
                        name="logo"
                        value={form.logo}
                        onChange={handleInputChange}
                        placeholder="Logo URL (optional)"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <input
                        type="text"
                        name="description"
                        value={form.description}
                        onChange={handleInputChange}
                        placeholder="Description (optional)"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={!form.company_name.trim() || submitting}
                          className="bg-teal-700 hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-semibold flex items-center gap-2 transition"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          {submitting ? 'Adding...' : 'Add'}
                        </button>
                      </div>
                    </form>

                    {/* Brand list */}
                    {selectedBrands.length === 0 ? (
                      <div className="px-6 py-10 text-center text-gray-500">
                        No brands yet. Add your first {selectedMeta?.label.toLowerCase().replace(/s$/, '')} brand above.
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-100">
                        {selectedBrands.map((brand) => {
                          const logoUrl = resolveLogo(brand.logo);
                          return (
                            <li
                              key={brand._id}
                              className="px-6 py-3 flex items-center justify-between hover:bg-gray-50"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {logoUrl ? (
                                  <img
                                    src={logoUrl}
                                    alt={brand.company_name}
                                    className="w-10 h-10 rounded-lg object-contain bg-gray-50 border border-gray-100 flex-shrink-0"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 font-semibold flex-shrink-0">
                                    {brand.company_name?.charAt(0)?.toUpperCase() || '?'}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="text-gray-800 font-medium truncate">{brand.company_name}</p>
                                  {brand.description && (
                                    <p className="text-sm text-gray-500 truncate">{brand.description}</p>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => setBrandToDelete(brand)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition flex-shrink-0"
                                aria-label={`Delete ${brand.company_name}`}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {brandToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-5">
                <h2 className="text-2xl font-bold text-white">Confirm Delete</h2>
                <p className="text-red-100 text-sm mt-1">This action cannot be undone</p>
              </div>
              <div className="p-6">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
                <div className="text-center mb-6">
                  <p className="text-gray-700 mb-2">Are you sure you want to delete this brand?</p>
                  <div className="bg-gray-50 rounded-lg p-4 mt-4">
                    <p className="font-bold text-gray-900 text-lg">{brandToDelete.company_name}</p>
                    <p className="text-sm text-gray-600 mt-1">{brandToDelete.category}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setBrandToDelete(null)}
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
                    {deleting ? 'Deleting...' : 'Delete Brand'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Brands;
