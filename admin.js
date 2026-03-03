// Import Firebase modules
import { auth, db, storage, signInWithEmailAndPassword, signOut, onAuthStateChanged, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, setDoc, query, orderBy, limit, ref, uploadBytes, getDownloadURL, deleteObject } from './firebase-config.js';

// Admin credentials (For initial setup - create admin user in Firebase Console)
// Email: admin@shopnow.com
// You should create this user in Firebase Authentication console

// Firestore Collections
const COLLECTIONS = {
    products: 'products',
    orders: 'orders',
    customers: 'customers'
};

// Data Arrays - loaded from Firestore
let products = [];
let orders = [];
let customers = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    checkAuthStatus();
});

// Check Authentication Status  
function checkAuthStatus() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // User is signed in
            showAdminPanel();
            document.getElementById('adminUsername').textContent = user.email.split('@')[0];
        } else {
            // User is signed out
            document.getElementById('loginContainer').style.display = 'flex';
            document.getElementById('adminPanel').style.display = 'none';
        }
    });
}

// Setup Event Listeners
function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);

    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const section = e.currentTarget.getAttribute('data-section');
            if (section) {
                e.preventDefault();
                switchSection(section);
            }
        });
    });

    // Product form
    document.getElementById('productForm').addEventListener('submit', handleProductSubmit);
    
    // Settings forms
    document.getElementById('contactSettingsForm').addEventListener('submit', saveContactSettings);
    document.getElementById('socialSettingsForm').addEventListener('submit', saveSocialSettings);
    document.getElementById('upiSettingsForm').addEventListener('submit', saveUpiSettings);
}

// Handle Login with Firebase Authentication
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        showNotification('Login successful!', 'success');
    } catch (error) {
        console.error('Login error:', error);
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
            showNotification('Invalid email or password!', 'error');
        } else if (error.code === 'auth/invalid-email') {
            showNotification('Please enter a valid email address!', 'error');
        } else {
            showNotification(`Login error: ${error.message}`, 'error');
        }
    }
}

// Logout
async function logout() {
    try {
        await signOut(auth);
        document.getElementById('loginContainer').style.display = 'flex';
        document.getElementById('adminPanel').style.display = 'none';
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        showNotification('Logged out successfully', 'success');
    } catch (error) {
        showNotification('Logout error: ' + error.message, 'error');
    }
}

// Show Admin Panel
async function showAdminPanel() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'flex';
    await loadAllData();
    loadDashboard();
}

// Load All Data from Firestore
async function loadAllData() {
    try {
        const productsSnapshot = await getDocs(collection(db, COLLECTIONS.products));
        products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const ordersSnapshot = await getDocs(collection(db, COLLECTIONS.orders));
        orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const customersSnapshot = await getDocs(collection(db, COLLECTIONS.customers));
        customers = customersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error loading data:', error);
        showNotification('Error loading data: ' + error.message, 'error');
    }
}

// Switch Section
function switchSection(section) {
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');

    // Update content sections
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.remove('active');
    });
    document.getElementById(section).classList.add('active');

    // Update page title
    const titles = {
        dashboard: 'Dashboard',
        products: 'Product Management',
        orders: 'Order Management',
        customers: 'Customer Management',
        settings: 'Store Settings'
    };
    document.getElementById('pageTitle').textContent = titles[section];

    // Load section data
    if (section === 'dashboard') loadDashboard();
    else if (section === 'products') loadProducts();
    else if (section === 'orders') loadOrders();
    else if (section === 'customers') loadCustomers();
    else if (section === 'settings') loadSettings();
}

// Load Data from Storage - removed, using Firestore now

// Load Dashboard
function loadDashboard() {
    document.getElementById('totalProducts').textContent = products.length;
    document.getElementById('totalOrders').textContent = orders.length;
    
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    document.getElementById('totalRevenue').textContent = `₹${totalRevenue.toLocaleString('en-IN')}`;
    
    document.getElementById('totalCustomers').textContent = customers.length;

    const recentOrdersBody = document.getElementById('recentOrdersBody');
    recentOrdersBody.innerHTML = '';

    const recentOrders = orders.slice(0, 5);
    if (recentOrders.length === 0) {
        recentOrdersBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">No orders yet</td></tr>';
    } else {
        recentOrders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${order.orderId || order.id}</td>
                <td>${order.customer || 'Guest'}</td>
                <td>${order.items || 0}</td>
                <td>₹${(order.total || 0).toLocaleString('en-IN')}</td>
                <td>${formatDate(order.date || new Date().toISOString())}</td>
                <td><span class="status-badge status-${order.status || 'pending'}">${order.status || 'pending'}</span></td>
            `;
            recentOrdersBody.appendChild(row);
        });
    }
}

// Load Products
function loadProducts() {
    const productsTableBody = document.getElementById('productsTableBody');
    productsTableBody.innerHTML = '';

    if (products.length === 0) {
        productsTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">No products found. Add your first product!</td></tr>';
    } else {
        products.forEach(product => {
            const costPrice = product.costPrice || 0;
            const sellingPrice = product.price || 0;
            const profitMargin = costPrice > 0 ? (((sellingPrice - costPrice) / costPrice) * 100).toFixed(1) : 'N/A';
            const quantity = product.quantity ?? 0;
            
            // Stock status styling
            let stockClass = '';
            let stockText = quantity;
            if (quantity === 0) {
                stockClass = 'style="color: #ef4444; font-weight: 600;"';
                stockText = 'Out of Stock';
            } else if (quantity < 5) {
                stockClass = 'style="color: #f59e0b; font-weight: 600;"';
            } else {
                stockClass = 'style="color: #10b981; font-weight: 600;"';
            }
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.productId || product.id}</td>
                <td style="font-size: 2rem;">${product.icon || '📦'}</td>
                <td>
                    <div>${product.name || 'Unnamed'}</div>
                    <small style="color: #6b7280;">${product.description || 'No description'}</small>
                </td>
                <td style="text-transform: capitalize;">${product.category || 'general'}</td>
                <td>₹${costPrice.toLocaleString('en-IN')}</td>
                <td>₹${sellingPrice.toLocaleString('en-IN')}</td>
                <td ${stockClass}>${stockText}</td>
                <td style="${profitMargin !== 'N/A' && parseFloat(profitMargin) > 0 ? 'color: #10b981;' : ''}">
                    ${profitMargin !== 'N/A' ? profitMargin + '%' : 'N/A'}
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="editProduct('${product.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-delete" onclick="deleteProduct('${product.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            `;
            productsTableBody.appendChild(row);
        });
    }
}

// Load Orders
function loadOrders() {
    const ordersTableBody = document.getElementById('ordersTableBody');
    ordersTableBody.innerHTML = '';

    if (orders.length === 0) {
        ordersTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">No orders yet</td></tr>';
    } else {
        orders.forEach(order => {
            const whatsappBtn = order.mobile 
                ? `<button class="btn-whatsapp" onclick="contactWhatsApp('${order.mobile}', '${order.orderId || order.id}', '${order.customer || 'Customer'}')" title="Contact on WhatsApp">
                    <i class="fab fa-whatsapp"></i>
                   </button>`
                : '';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${order.orderId || order.id}</td>
                <td>${order.customer || 'Guest'}</td>
                <td>${order.items || 0}</td>
                <td>₹${(order.total || 0).toLocaleString('en-IN')}</td>
                <td>${formatDate(order.date || new Date().toISOString())}</td>
                <td><span class="status-badge status-${order.status || 'pending'}">${order.status || 'pending'}</span></td>
                <td>
                    <div class="action-buttons">
                        ${whatsappBtn}
                        <button class="btn-view" onclick="viewOrderDetails('${order.id}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-edit" onclick="updateOrderStatus('${order.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-delete" onclick="deleteOrder('${order.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            ordersTableBody.appendChild(row);
        });
    }
}

// Load Customers
function loadCustomers() {
    const customersTableBody = document.getElementById('customersTableBody');
    customersTableBody.innerHTML = '';

    if (customers.length === 0) {
        customersTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">No customers yet</td></tr>';
    } else {
        customers.forEach(customer => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${customer.customerId || customer.id}</td>
                <td>${customer.name || 'Anonymous'}</td>
                <td>${customer.email || 'N/A'}</td>
                <td>${customer.orders || 0}</td>
                <td>₹${(customer.totalSpent || 0).toLocaleString('en-IN')}</td>
                <td>${formatDate(customer.joinDate || new Date().toISOString())}</td>
            `;
            customersTableBody.appendChild(row);
        });
    }
}

// Show Add Product Modal
function showAddProductModal() {
    document.getElementById('modalTitle').textContent = 'Add Product';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('productModal').classList.add('active');
}

// Close Product Modal
function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
    document.getElementById('currentImagePreview').style.display = 'none';
    // Clear selected icon state
    document.querySelectorAll('.icon-option').forEach(option => {
        option.classList.remove('selected');
    });
}

// Handle Product Submit
async function handleProductSubmit(e) {
    e.preventDefault();

    const productId = document.getElementById('productId').value;
    const fileInput = document.getElementById('productImage');
    const file = fileInput.files[0];

    try {
        let imageUrl = '';
        
        // Upload file to Firebase Storage if a new file is selected
        if (file) {
            const fileName = `products/${Date.now()}_${file.name}`;
            const storageRef = ref(storage, fileName);
            
            // Show upload progress
            showNotification('Uploading file...', 'info');
            
            await uploadBytes(storageRef, file);
            imageUrl = await getDownloadURL(storageRef);
            
            showNotification('File uploaded successfully!', 'success');
        }

        const productData = {
            productId: productId || Date.now().toString(),
            name: document.getElementById('productName').value,
            category: document.getElementById('productCategory').value,
            price: parseFloat(document.getElementById('productPrice').value),
            costPrice: parseFloat(document.getElementById('productCostPrice').value) || 0,
            quantity: parseInt(document.getElementById('productQuantity').value) || 0,
            description: document.getElementById('productDescription').value,
            icon: document.getElementById('productIcon').value || '🎨',
            updatedAt: new Date().toISOString()
        };

        // Add imageUrl if file was uploaded or keep existing
        if (imageUrl) {
            productData.imageUrl = imageUrl;
            productData.fileName = file.name;
        } else if (productId) {
            // Keep existing image URL when editing without new file
            const existingProduct = products.find(p => p.id === productId);
            if (existingProduct && existingProduct.imageUrl) {
                productData.imageUrl = existingProduct.imageUrl;
                productData.fileName = existingProduct.fileName;
            }
        }

        if (productId) {
            await updateDoc(doc(db, COLLECTIONS.products, productId), productData);
            showNotification('Product updated successfully!', 'success');
        } else {
            productData.createdAt = new Date().toISOString();
            await addDoc(collection(db, COLLECTIONS.products), productData);
            showNotification('Product added successfully!', 'success');
        }

        await loadAllData();
        loadProducts();
        closeProductModal();
    } catch (error) {
        console.error('Error saving product:', error);
        showNotification('Error saving product: ' + error.message, 'error');
    }
}

// Edit Product
function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (product) {
        document.getElementById('modalTitle').textContent = 'Edit Product';
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name || '';
        document.getElementById('productCategory').value = product.category || 'figurines';
        document.getElementById('productPrice').value = product.price || 0;
        document.getElementById('productCostPrice').value = product.costPrice || 0;
        document.getElementById('productQuantity').value = product.quantity || 0;
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productIcon').value = product.icon || '🎨';
        
        // Highlight selected icon in the icon selector
        document.querySelectorAll('.icon-option').forEach(option => {
            if (option.textContent === (product.icon || '🎨')) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });
        
        // Show current image if exists
        const previewDiv = document.getElementById('currentImagePreview');
        const previewImg = document.getElementById('previewImage');
        if (product.imageUrl) {
            previewImg.src = product.imageUrl;
            previewDiv.style.display = 'block';
        } else {
            previewDiv.style.display = 'none';
        }
        
        document.getElementById('productModal').classList.add('active');
    }
}

// Delete Product
async function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            await deleteDoc(doc(db, COLLECTIONS.products, id));
            await loadAllData();
            loadProducts();
            showNotification('Product deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting product:', error);
            showNotification('Error deleting product: ' + error.message, 'error');
        }
    }
}

// View Order Details
function viewOrderDetails(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (order) {
        let itemsDetails = '';
        if (order.cartItems && order.cartItems.length > 0) {
            itemsDetails = order.cartItems.map(item => 
                `\n  • ${item.name} (Qty: ${item.quantity}) - ₹${item.price.toLocaleString('en-IN')} each`
            ).join('');
        }

        alert(`📦 ORDER DETAILS\n\n` +
              `Order ID: ${order.orderId || order.id}\n` +
              `Status: ${(order.status || 'pending').toUpperCase()}\n` +
              `Date: ${formatDate(order.date || new Date().toISOString())}\n\n` +
              `👤 CUSTOMER INFORMATION\n` +
              `Name: ${order.customer || 'Guest'}\n` +
              `Mobile: ${order.mobile || 'N/A'}\n` +
              `Address: ${order.address || 'N/A'}\n\n` +
              `🛍️ ORDER ITEMS (${order.items || 0} items)${itemsDetails}\n\n` +
              `💰 TOTAL: ₹${(order.total || 0).toLocaleString('en-IN')}`
        );
    }
}

// Contact Customer via WhatsApp
function contactWhatsApp(mobile, orderId, customerName) {
    const message = `Hello ${customerName}! 👋\n\nRegarding your order ${orderId} from Print3D Studio.\n\nHow can we help you today?`;
    const whatsappUrl = `https://wa.me/91${mobile}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// Update Order Status
async function updateOrderStatus(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (order) {
        const statuses = ['pending', 'processing', 'completed'];
        const currentIndex = statuses.indexOf(order.status || 'pending');
        const nextIndex = (currentIndex + 1) % statuses.length;
        const newStatus = statuses[nextIndex];

        try {
            await updateDoc(doc(db, COLLECTIONS.orders, orderId), {
                status: newStatus,
                updatedAt: new Date().toISOString()
            });
            await loadAllData();
            loadOrders();
            loadDashboard();
            showNotification(`Order status updated to ${newStatus}!`, 'success');
        } catch (error) {
            console.error('Error updating order:', error);
            showNotification('Error updating order: ' + error.message, 'error');
        }
    }
}

// Delete Order
async function deleteOrder(orderId) {
    if (confirm('Are you sure you want to delete this order?')) {
        try {
            await deleteDoc(doc(db, COLLECTIONS.orders, orderId));
            await loadAllData();
            loadOrders();
            loadDashboard();
            showNotification('Order deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting order:', error);
            showNotification('Error deleting order: ' + error.message, 'error');
        }
    }
}

// Format Date
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        return 'N/A';
    }
}

// Show Notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: ${colors[type]};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        font-weight: 600;
        max-width: 400px;
    `;
    notification.textContent = message;

    if (!document.querySelector('#notificationStyles')) {
        const style = document.createElement('style');
        style.id = 'notificationStyles';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Icon selector function
function selectIcon(icon) {
    const iconInput = document.getElementById('productIcon');
    iconInput.value = icon;
    
    // Update selected state
    document.querySelectorAll('.icon-option').forEach(option => {
        option.classList.remove('selected');
    });
    event.target.classList.add('selected');
}

// Load Settings
async function loadSettings() {
    try {
        const settingsDoc = await getDocs(query(collection(db, 'settings'), limit(1)));
        if (!settingsDoc.empty) {
            const settings = settingsDoc.docs[0].data();
            
            // Load contact settings
            document.getElementById('settingPhone').value = settings.phone || '+91 98765 43210';
            document.getElementById('settingEmail').value = settings.email || 'info@print3dstudio.com';
            document.getElementById('settingAddress').value = settings.address || '123 Maker Street, Tech Hub';
            document.getElementById('settingCity').value = settings.city || 'Bangalore, Karnataka 560001';
            document.getElementById('settingWeekdayHours').value = settings.weekdayHours || 'Monday - Friday: 9:00 AM - 8:00 PM';
            document.getElementById('settingSaturdayHours').value = settings.saturdayHours || '10:00 AM - 6:00 PM';
            document.getElementById('settingSundayHours').value = settings.sundayHours || 'Closed';
            
            // Load social settings
            document.getElementById('settingWhatsapp').value = settings.whatsapp || '919876543210';
            document.getElementById('settingYoutube').value = settings.youtube || '';
            document.getElementById('settingInstagram').value = settings.instagram || '';
            document.getElementById('settingFacebook').value = settings.facebook || '';
            
            // Load UPI settings
            document.getElementById('settingUpiId').value = settings.upiId || '';
            
            // Load UPI QR Code preview
            const upiQrPreview = document.getElementById('currentUpiQrPreview');
            const previewUpiQr = document.getElementById('previewUpiQr');
            if (settings.upiQrCode) {
                previewUpiQr.src = settings.upiQrCode;
                upiQrPreview.style.display = 'block';
            } else {
                upiQrPreview.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Save Contact Settings
async function saveContactSettings(e) {
    e.preventDefault();
    
    const settings = {
        phone: document.getElementById('settingPhone').value,
        email: document.getElementById('settingEmail').value,
        address: document.getElementById('settingAddress').value,
        city: document.getElementById('settingCity').value,
        weekdayHours: document.getElementById('settingWeekdayHours').value,
        saturdayHours: document.getElementById('settingSaturdayHours').value,
        sundayHours: document.getElementById('settingSundayHours').value,
        lastUpdated: new Date().toISOString()
    };
    
    try {
        // Check if settings document exists
        const settingsSnapshot = await getDocs(collection(db, 'settings'));
        
        if (settingsSnapshot.empty) {
            // Create new settings document
            await setDoc(doc(db, 'settings', 'store'), settings);
        } else {
            // Update existing settings
            const settingsId = settingsSnapshot.docs[0].id;
            await updateDoc(doc(db, 'settings', settingsId), settings);
        }
        
        showNotification('Contact settings saved successfully!', 'success');
    } catch (error) {
        console.error('Error saving contact settings:', error);
        showNotification('Error saving settings: ' + error.message, 'error');
    }
}

// Save Social Settings
async function saveSocialSettings(e) {
    e.preventDefault();
    
    const settings = {
        whatsapp: document.getElementById('settingWhatsapp').value,
        youtube: document.getElementById('settingYoutube').value,
        instagram: document.getElementById('settingInstagram').value,
        facebook: document.getElementById('settingFacebook').value,
        lastUpdated: new Date().toISOString()
    };
    
    try {
        // Check if settings document exists
        const settingsSnapshot = await getDocs(collection(db, 'settings'));
        
        if (settingsSnapshot.empty) {
            // Create new settings document
            await setDoc(doc(db, 'settings', 'store'), settings);
        } else {
            // Update existing settings
            const settingsId = settingsSnapshot.docs[0].id;
            await updateDoc(doc(db, 'settings', settingsId), settings);
        }
        
        showNotification('Social media links saved successfully!', 'success');
    } catch (error) {
        console.error('Error saving social settings:', error);
        showNotification('Error saving settings: ' + error.message, 'error');
    }
}

// Save UPI Settings
async function saveUpiSettings(e) {
    e.preventDefault();
    
    const upiId = document.getElementById('settingUpiId').value;
    const qrCodeFile = document.getElementById('settingUpiQrCode').files[0];
    
    try {
        let qrCodeDataUrl = null;
        
        // Convert QR Code to Base64 if provided (avoiding CORS issues)
        if (qrCodeFile) {
            // Show loading notification
            showNotification('Uploading QR code...', 'info');
            
            // Read file as Base64
            qrCodeDataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = reject;
                reader.readAsDataURL(qrCodeFile);
            });
        }
        
        // Prepare settings data
        const settings = {
            upiId: upiId,
            lastUpdated: new Date().toISOString()
        };
        
        // Add QR code Base64 if uploaded
        if (qrCodeDataUrl) {
            settings.upiQrCode = qrCodeDataUrl;
        }
        
        // Check if settings document exists
        const settingsSnapshot = await getDocs(collection(db, 'settings'));
        
        if (settingsSnapshot.empty) {
            // Create new settings document
            await setDoc(doc(db, 'settings', 'store'), settings);
        } else {
            // Update existing settings
            const settingsId = settingsSnapshot.docs[0].id;
            await updateDoc(doc(db, 'settings', settingsId), settings);
        }
        
        showNotification('UPI settings saved successfully!', 'success');
        
        // Refresh settings to show the uploaded QR code
        await loadSettings();
        
    } catch (error) {
        console.error('Error saving UPI settings:', error);
        showNotification('Error saving UPI settings: ' + error.message, 'error');
    }
}

// Close modal on outside click
window.onclick = function(event) {
    const modal = document.getElementById('productModal');
    if (event.target === modal) {
        closeProductModal();
    }
}

// Export functions to window for HTML onclick attributes
window.logout = logout;
window.showAddProductModal = showAddProductModal;
window.closeProductModal = closeProductModal;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.viewOrderDetails = viewOrderDetails;
window.contactWhatsApp = contactWhatsApp;
window.updateOrderStatus = updateOrderStatus;
window.deleteOrder = deleteOrder;
window.selectIcon = selectIcon;
