// Import Firebase modules
import { auth, db, onAuthStateChanged, collection, getDocs, addDoc, query, where } from './firebase-config.js';

// Product Data - Load from Firestore
let products = [];

// Load products from Firestore
async function getProductsFromFirestore() {
    try {
        const productsSnapshot = await getDocs(collection(db, 'products'));
        if (productsSnapshot.empty) {
            // If no products in Firestore, return empty array
            return [];
        }
        return productsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error loading products:', error);
        return [];
    }
}

// Shopping Cart
let cart = [];

// DOM Elements
const productsGrid = document.getElementById('productsGrid');
const cartIcon = document.getElementById('cartIcon');
const cartModal = document.getElementById('cartModal');
const closeCart = document.getElementById('closeCart');
const cartItems = document.getElementById('cartItems');
const cartCount = document.getElementById('cartCount');
const totalPrice = document.getElementById('totalPrice');
const checkoutBtn = document.getElementById('checkoutBtn');
const filterButtons = document.querySelectorAll('.filter-btn');

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
    // Load products from Firestore
    products = await getProductsFromFirestore();
    loadProducts('all');
    setupEventListeners();
    loadCartFromStorage();
    loadStoreSettings();
});

// Setup Event Listeners
function setupEventListeners() {
    // Cart modal events
    cartIcon.addEventListener('click', toggleCart);
    closeCart.addEventListener('click', toggleCart);
    cartModal.addEventListener('click', (e) => {
        if (e.target === cartModal) {
            toggleCart();
        }
    });

    // Filter buttons
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const category = btn.getAttribute('data-category');
            loadProducts(category);
        });
    });

    // Checkout button
    checkoutBtn.addEventListener('click', checkout);
}

// Load Products
function loadProducts(category) {
    productsGrid.innerHTML = '';
    
    if (products.length === 0) {
        productsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #6b7280;">
                <i class="fas fa-box-open" style="font-size: 4rem; opacity: 0.3; margin-bottom: 1rem;"></i>
                <p style="font-size: 1.2rem;">No products available yet</p>
                <p>Check back soon or contact admin to add products</p>
            </div>
        `;
        return;
    }
    
    const filteredProducts = category === 'all' 
        ? products 
        : products.filter(p => p.category === category);

    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #6b7280;">
                <p style="font-size: 1.1rem;">No products in this category</p>
            </div>
        `;
        return;
    }

    filteredProducts.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
}

// Refresh Products from Firestore
async function refreshProducts() {
    products = await getProductsFromFirestore();
    const activeFilter = document.querySelector('.filter-btn.active').getAttribute('data-category');
    loadProducts(activeFilter);
    showNotification('Products refreshed!');
}

// Create Product Card
function createProductCard(product) {
    const quantity = product.quantity ?? 0;
    const isOutOfStock = quantity === 0;
    const isLowStock = quantity > 0 && quantity < 5;
    
    // Stock badge
    let stockBadge = '';
    if (isOutOfStock) {
        stockBadge = '<span class="stock-badge out-of-stock">Out of Stock</span>';
    } else if (isLowStock) {
        stockBadge = `<span class="stock-badge low-stock">Only ${quantity} left</span>`;
    }
    
    const card = document.createElement('div');
    card.className = 'product-card';
    if (isOutOfStock) {
        card.classList.add('out-of-stock-card');
    }
    
    card.innerHTML = `
        <div class="product-image">${product.icon}</div>
        ${stockBadge}
        <div class="product-info">
            <div class="product-category">${product.category}</div>
            <h3 class="product-name">${product.name}</h3>
            <p class="product-description">${product.description}</p>
            <div class="product-footer">
                <span class="product-price">₹${product.price.toFixed(0)}</span>
                <button class="add-to-cart-btn" onclick="addToCart('${product.id}')" ${isOutOfStock ? 'disabled' : ''}>
                    <i class="fas fa-cart-plus"></i> ${isOutOfStock ? 'Out of Stock' : 'Add'}
                </button>
            </div>
        </div>
    `;
    return card;
}

// Add to Cart
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    
    // Check stock availability
    const availableStock = product.quantity ?? 0;
    if (availableStock === 0) {
        alert('Sorry, this product is out of stock!');
        return;
    }
    
    const existingItem = cart.find(item => item.id === productId);
    const currentCartQuantity = existingItem ? existingItem.quantity : 0;
    
    // Check if we can add one more
    if (currentCartQuantity >= availableStock) {
        alert(`Sorry, only ${availableStock} item(s) available in stock!`);
        return;
    }

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }

    updateCart();
    saveCartToStorage();
    showNotification('Item added to cart!');
}

// Remove from Cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCart();
    saveCartToStorage();
    showNotification('Item removed from cart');
}

// Update Quantity
function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            updateCart();
            saveCartToStorage();
        }
    }
}

// Update Cart Display
function updateCart() {
    // Update cart count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;

    // Update cart items
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>Your cart is empty</p>
            </div>
        `;
        totalPrice.textContent = '₹0';
    } else {
        cartItems.innerHTML = '';
        cart.forEach(item => {
            const cartItem = createCartItem(item);
            cartItems.appendChild(cartItem);
        });

        // Update total price
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        totalPrice.textContent = `₹${total.toFixed(0)}`;
    }
}

// Create Cart Item
function createCartItem(item) {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
        <div class="cart-item-image">${item.icon}</div>
        <div class="cart-item-details">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">₹${item.price.toFixed(0)} each</div>
            <div class="cart-item-controls">
                <button class="quantity-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
                <span class="quantity">${item.quantity}</span>
                <button class="quantity-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
                <button class="remove-btn" onclick="removeFromCart('${item.id}')">Remove</button>
            </div>
        </div>
    `;
    return div;
}

// Toggle Cart Modal
function toggleCart() {
    cartModal.classList.toggle('active');
}

// Checkout - Show Payment Modal
async function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    // Get customer details
    const customerName = document.getElementById('customerName').value.trim();
    const customerMobile = document.getElementById('customerMobile').value.trim();
    const customerAddress = document.getElementById('customerAddress').value.trim();

    // Validate customer details
    if (!customerName) {
        alert('Please enter your name');
        document.getElementById('customerName').focus();
        return;
    }

    if (!customerMobile || customerMobile.length !== 10 || !/^\d{10}$/.test(customerMobile)) {
        alert('Please enter a valid 10-digit mobile number');
        document.getElementById('customerMobile').focus();
        return;
    }

    if (!customerAddress) {
        alert('Please enter your delivery address');
        document.getElementById('customerAddress').focus();
        return;
    }

    // Calculate total and show payment modal
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Load UPI details and show payment modal
    await loadUpiDetails();
    document.getElementById('paymentAmount').textContent = `₹${total.toFixed(0)}`;
    showPaymentModal();
}

// Load UPI Details from Firestore
async function loadUpiDetails() {
    try {
        const settingsSnapshot = await getDocs(collection(db, 'settings'));
        if (!settingsSnapshot.empty) {
            const settings = settingsSnapshot.docs[0].data();
            
            // Update UPI ID
            const upiIdText = document.getElementById('upiIdText');
            if (settings.upiId) {
                upiIdText.textContent = settings.upiId;
            } else {
                upiIdText.textContent = 'UPI ID not configured';
            }
            
            // Update QR Code
            const qrCodeImg = document.getElementById('upiQrCode');
            const qrCodePlaceholder = document.getElementById('qrCodePlaceholder');
            if (settings.upiQrCode) {
                qrCodeImg.src = settings.upiQrCode;
                qrCodeImg.style.display = 'block';
                qrCodePlaceholder.style.display = 'none';
            } else {
                qrCodeImg.style.display = 'none';
                qrCodePlaceholder.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Error loading UPI details:', error);
        document.getElementById('upiIdText').textContent = 'Error loading UPI details';
    }
}

// Show Payment Modal
function showPaymentModal() {
    const paymentModal = document.getElementById('paymentModal');
    paymentModal.classList.add('active');
    
    // Setup close button
    const closePayment = document.getElementById('closePayment');
    closePayment.onclick = closePaymentModal;
    
    // Setup screenshot upload
    const screenshotInput = document.getElementById('paymentScreenshot');
    screenshotInput.onchange = handleScreenshotUpload;
    
    // Close on outside click
    paymentModal.onclick = function(e) {
        if (e.target === paymentModal) {
            closePaymentModal();
        }
    };
}

// Handle Screenshot Upload
function handleScreenshotUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        event.target.value = '';
        return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        event.target.value = '';
        return;
    }
    
    // Read and preview file
    const reader = new FileReader();
    reader.onload = function(e) {
        const previewImg = document.getElementById('previewImg');
        const screenshotPreview = document.getElementById('screenshotPreview');
        const screenshotPlaceholder = document.getElementById('screenshotPlaceholder');
        
        previewImg.src = e.target.result;
        screenshotPreview.style.display = 'block';
        screenshotPlaceholder.style.display = 'none';
    };
    reader.readAsDataURL(file);
}

// Remove Screenshot
function removeScreenshot(event) {
    event.stopPropagation();
    
    const screenshotInput = document.getElementById('paymentScreenshot');
    const screenshotPreview = document.getElementById('screenshotPreview');
    const screenshotPlaceholder = document.getElementById('screenshotPlaceholder');
    const previewImg = document.getElementById('previewImg');
    
    screenshotInput.value = '';
    previewImg.src = '';
    screenshotPreview.style.display = 'none';
    screenshotPlaceholder.style.display = 'block';
}

// Close Payment Modal
function closePaymentModal() {
    const paymentModal = document.getElementById('paymentModal');
    paymentModal.classList.remove('active');
    
    // Reset screenshot preview
    const screenshotInput = document.getElementById('paymentScreenshot');
    const screenshotPreview = document.getElementById('screenshotPreview');
    const screenshotPlaceholder = document.getElementById('screenshotPlaceholder');
    const previewImg = document.getElementById('previewImg');
    
    if (screenshotInput) {
        screenshotInput.value = '';
        previewImg.src = '';
        screenshotPreview.style.display = 'none';
        screenshotPlaceholder.style.display = 'block';
    }
}

// Copy UPI ID
function copyUpiId() {
    const upiIdText = document.getElementById('upiIdText').textContent;
    if (upiIdText && upiIdText !== 'Loading...' && upiIdText !== 'UPI ID not configured') {
        navigator.clipboard.writeText(upiIdText).then(() => {
            showNotification('UPI ID copied to clipboard!');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = upiIdText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showNotification('UPI ID copied to clipboard!');
        });
    }
}

// Confirm Payment and Place Order
async function confirmPayment() {
    const customerName = document.getElementById('customerName').value.trim();
    const customerMobile = document.getElementById('customerMobile').value.trim();
    const customerAddress = document.getElementById('customerAddress').value.trim();
    
    // Check if screenshot is uploaded
    const screenshotInput = document.getElementById('paymentScreenshot');
    if (!screenshotInput.files || !screenshotInput.files[0]) {
        const confirmed = confirm('No payment screenshot uploaded. Do you want to continue without it?\n\nNote: Uploading screenshot helps verify your payment faster.');
        if (!confirmed) return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    // Save order to Firestore
    try {
        // Convert screenshot to Base64 if uploaded
        let paymentScreenshot = null;
        if (screenshotInput.files && screenshotInput.files[0]) {
            showNotification('Processing payment screenshot...', 'info');
            paymentScreenshot = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = reject;
                reader.readAsDataURL(screenshotInput.files[0]);
            });
        }
        
        const orderData = {
            orderId: 'ORD' + Date.now(),
            customer: customerName,
            mobile: customerMobile,
            address: customerAddress,
            items: itemCount,
            total: total,
            date: new Date().toISOString(),
            status: 'pending',
            paymentMethod: 'UPI',
            paymentStatus: 'paid',
            paymentScreenshot: paymentScreenshot,
            cartItems: cart.map(item => ({
                productId: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity
            })),
            createdAt: new Date().toISOString()
        };
        
        await addDoc(collection(db, 'orders'), orderData);
        
        closePaymentModal();
        
        alert(`✅ Order Placed Successfully!\n\n📦 ORDER ID: ${orderData.orderId}\n(Save this ID to track your order)\n\nCustomer: ${customerName}\nItems: ${itemCount}\nTotal: ₹${total.toFixed(0)}\n\nPayment: UPI (Confirmed)\n\nDelivery Address:\n${customerAddress}\n\nContact: ${customerMobile}\n\n🔍 Track your order anytime using the "Track Order" section on our website!`);
        
        // Clear form fields
        document.getElementById('customerName').value = '';
        document.getElementById('customerMobile').value = '';
        document.getElementById('customerAddress').value = '';
        
        cart = [];
        updateCart();
        saveCartToStorage();
        toggleCart();
    } catch (error) {
        console.error('Error saving order:', error);
        closePaymentModal();
        
        alert(`⚠️ Order Placed (Tracking Unavailable)\n\nCustomer: ${customerName}\nItems: ${itemCount}\nTotal: ₹${total.toFixed(0)}\n\nYour order has been received but online tracking is currently unavailable.\n\nWe'll contact you on: ${customerMobile}`);
        
        // Clear form fields
        document.getElementById('customerName').value = '';
        document.getElementById('customerMobile').value = '';
        document.getElementById('customerAddress').value = '';
        
        cart = [];
        updateCart();
        saveCartToStorage();
        toggleCart();
    }
}

// Local Storage Functions
function saveCartToStorage() {
    localStorage.setItem('shoppingCart', JSON.stringify(cart));
}

function loadCartFromStorage() {
    const savedCart = localStorage.getItem('shoppingCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCart();
    }
}

// Show Notification
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background-color: #10b981;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        font-weight: 600;
    `;
    notification.textContent = message;

    // Add animation keyframes
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

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Track Order
async function trackOrder() {
    const orderId = document.getElementById('trackOrderId').value.trim();
    const mobile = document.getElementById('trackMobile').value.trim();
    const resultDiv = document.getElementById('trackingResult');

    // Validate inputs
    if (!orderId) {
        alert('Please enter your Order ID');
        document.getElementById('trackOrderId').focus();
        return;
    }

    if (!mobile || mobile.length !== 10 || !/^\d{10}$/.test(mobile)) {
        alert('Please enter a valid 10-digit mobile number');
        document.getElementById('trackMobile').focus();
        return;
    }

    // Show loading
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Searching for your order...</div>';

    try {
        // Query Firestore for the order
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, where('orderId', '==', orderId), where('mobile', '==', mobile));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            resultDiv.innerHTML = `
                <div class="tracking-error">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Order Not Found</h3>
                    <p>No order found with ID <strong>${orderId}</strong> and mobile number <strong>${mobile}</strong></p>
                    <p>Please check your Order ID and mobile number and try again.</p>
                </div>
            `;
            return;
        }

        // Display order details
        const orderDoc = querySnapshot.docs[0];
        const order = orderDoc.data();
        
        let itemsList = '';
        if (order.cartItems && order.cartItems.length > 0) {
            itemsList = order.cartItems.map(item => `
                <div class="order-item">
                    <span class="item-name">${item.name}</span>
                    <span class="item-qty">Qty: ${item.quantity}</span>
                    <span class="item-price">₹${item.price.toLocaleString('en-IN')}</span>
                </div>
            `).join('');
        }

        const statusColor = {
            'pending': '#f59e0b',
            'processing': '#3b82f6',
            'completed': '#10b981',
            'cancelled': '#ef4444'
        };

        const statusIcon = {
            'pending': 'clock',
            'processing': 'box',
            'completed': 'check-circle',
            'cancelled': 'times-circle'
        };

        resultDiv.innerHTML = `
            <div class="order-details">
                <div class="order-header">
                    <h3><i class="fas fa-receipt"></i> Order Details</h3>
                    <span class="order-status" style="background-color: ${statusColor[order.status] || '#6b7280'}">
                        <i class="fas fa-${statusIcon[order.status] || 'info-circle'}"></i>
                        ${(order.status || 'pending').toUpperCase()}
                    </span>
                </div>
                
                <div class="order-info-grid">
                    <div class="info-item">
                        <i class="fas fa-hashtag"></i>
                        <div>
                            <span class="info-label">Order ID</span>
                            <span class="info-value">${order.orderId}</span>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-calendar"></i>
                        <div>
                            <span class="info-label">Order Date</span>
                            <span class="info-value">${new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-user"></i>
                        <div>
                            <span class="info-label">Customer Name</span>
                            <span class="info-value">${order.customer}</span>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-phone"></i>
                        <div>
                            <span class="info-label">Mobile</span>
                            <span class="info-value">${order.mobile}</span>
                        </div>
                    </div>
                </div>

                <div class="delivery-address">
                    <i class="fas fa-map-marker-alt"></i>
                    <div>
                        <span class="info-label">Delivery Address</span>
                        <span class="info-value">${order.address}</span>
                    </div>
                </div>

                <div class="order-items-section">
                    <h4><i class="fas fa-shopping-bag"></i> Order Items (${order.items} items)</h4>
                    <div class="order-items-list">
                        ${itemsList}
                    </div>
                </div>

                <div class="order-total">
                    <span>Total Amount:</span>
                    <span class="total-amount">₹${order.total.toLocaleString('en-IN')}</span>
                </div>

                <div class="order-actions">
                    <a href="https://wa.me/919876543210?text=Hi!%20I%20have%20a%20question%20about%20my%20order%20${order.orderId}" 
                       target="_blank" 
                       class="btn-whatsapp-track">
                        <i class="fab fa-whatsapp"></i> Contact Us
                    </a>
                </div>
            </div>
        `;

        // Scroll to result
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    } catch (error) {
        console.error('Error tracking order:', error);
        resultDiv.innerHTML = `
            <div class="tracking-error">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error</h3>
                <p>Unable to fetch order details. Please try again later.</p>
                <p class="error-message">${error.message}</p>
            </div>
        `;
    }
}

// Gallery functionality
let galleryData = [];

// Load gallery from Firestore products
async function loadGallery() {
    try {
        const galleryProducts = await getProductsFromFirestore();
        galleryData = galleryProducts.map(product => ({
            id: product.id,
            emoji: product.icon || '🎨',
            imageUrl: product.imageUrl || null,
            title: product.name,
            description: product.description
        }));
        
        // Render gallery grid
        renderGalleryGrid();
    } catch (error) {
        console.error('Error loading gallery:', error);
    }
}

// Render gallery grid dynamically
function renderGalleryGrid() {
    const galleryGrid = document.querySelector('.gallery-grid');
    if (!galleryGrid) return;
    
    galleryGrid.innerHTML = '';
    
    galleryData.forEach((item, index) => {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
        galleryItem.onclick = () => openGalleryModal(index);
        
        const imageContent = item.imageUrl 
            ? `<img src="${item.imageUrl}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: cover;" />`
            : `<div class="gallery-placeholder">${item.emoji}</div>`;
        
        galleryItem.innerHTML = `
            <div class="gallery-image">
                ${imageContent}
                <div class="gallery-overlay">
                    <i class="fas fa-search-plus"></i>
                </div>
            </div>
            <h4>${item.title}</h4>
        `;
        
        galleryGrid.appendChild(galleryItem);
    });
}

let currentGalleryIndex = 0;

function openGalleryModal(index) {
    currentGalleryIndex = index;
    const modal = document.getElementById('galleryModal');
    updateGalleryModal();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeGalleryModal() {
    const modal = document.getElementById('galleryModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function changeGalleryImage(direction) {
    currentGalleryIndex += direction;
    if (currentGalleryIndex < 0) {
        currentGalleryIndex = galleryData.length - 1;
    } else if (currentGalleryIndex >= galleryData.length) {
        currentGalleryIndex = 0;
    }
    updateGalleryModal();
}

function updateGalleryModal() {
    if (galleryData.length === 0) return;
    
    const item = galleryData[currentGalleryIndex];
    const modalImage = document.getElementById('galleryModalImage');
    
    if (item.imageUrl) {
        modalImage.innerHTML = `<img src="${item.imageUrl}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: contain;" />`;
    } else {
        modalImage.innerHTML = `<div class="gallery-placeholder-large">${item.emoji}</div>`;
    }
    
    document.getElementById('galleryTitle').textContent = item.title;
    document.getElementById('galleryDescription').textContent = item.description;
}

// Load gallery on page load
document.addEventListener('DOMContentLoaded', () => {
    loadGallery();
});

// Close gallery modal on outside click
document.addEventListener('click', function(event) {
    const modal = document.getElementById('galleryModal');
    if (event.target === modal) {
        closeGalleryModal();
    }
});

// Keyboard navigation for gallery
document.addEventListener('keydown', function(event) {
    const modal = document.getElementById('galleryModal');
    if (modal.classList.contains('active')) {
        if (event.key === 'Escape') {
            closeGalleryModal();
        } else if (event.key === 'ArrowLeft') {
            changeGalleryImage(-1);
        } else if (event.key === 'ArrowRight') {
            changeGalleryImage(1);
        }
    }
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Contact Form Handler
document.getElementById('contactForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const phone = document.getElementById('contactPhone').value;
    const subject = document.getElementById('contactSubject').value;
    const message = document.getElementById('contactMessage').value;
    
    try {
        // Save contact inquiry to Firestore
        await addDoc(collection(db, 'contact_inquiries'), {
            name,
            email,
            phone,
            subject,
            message,
            timestamp: new Date().toISOString(),
            status: 'new'
        });
        
        // Show success message
        alert('Thank you for contacting us! We will get back to you within 24 hours.');
        
        // Reset form
        e.target.reset();
        
        // Get WhatsApp number from settings
        const whatsappNum = await getWhatsAppNumber();
        const whatsappMessage = `Hello! I'm ${name}. ${message}`;
        const whatsappUrl = `https://wa.me/${whatsappNum}?text=${encodeURIComponent(whatsappMessage)}`;
        
        if (confirm('Would you like to chat with us on WhatsApp for an instant response?')) {
            window.open(whatsappUrl, '_blank');
        }
        
    } catch (error) {
        console.error('Error submitting contact form:', error);
        alert('Sorry, there was an error submitting your message. Please try again or contact us via WhatsApp.');
    }
});

// Load Store Settings
async function loadStoreSettings() {
    try {
        const settingsSnapshot = await getDocs(collection(db, 'settings'));
        if (!settingsSnapshot.empty) {
            const settings = settingsSnapshot.docs[0].data();
            
            // Update contact information
            updateContactInfo(settings);
            updateSocialLinks(settings);
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Update Contact Information
function updateContactInfo(settings) {
    if (!settings) return;
    
    // Update phone
    const phoneEl = document.getElementById('contactPhone');
    if (phoneEl && settings.phone) phoneEl.textContent = settings.phone;
    
    // Update email
    const emailEl = document.getElementById('contactEmail');
    if (emailEl && settings.email) emailEl.textContent = settings.email;
    
    // Update address
    const addressEl = document.getElementById('contactAddress');
    if (addressEl && settings.address) addressEl.textContent = settings.address;
    
    const cityEl = document.getElementById('contactCity');
    if (cityEl && settings.city) cityEl.textContent = settings.city;
    
    // Update working hours
    const weekdayEl = document.getElementById('contactWeekdayHours');
    if (weekdayEl && settings.weekdayHours) weekdayEl.textContent = settings.weekdayHours;
    
    const saturdayEl = document.getElementById('contactSaturdayHours');
    if (saturdayEl && settings.saturdayHours) saturdayEl.textContent = 'Saturday: ' + settings.saturdayHours;
    
    const sundayEl = document.getElementById('contactSundayHours');
    if (sundayEl && settings.sundayHours) sundayEl.textContent = 'Sunday: ' + settings.sundayHours;
    
    // Update WhatsApp floating button
    if (settings.whatsapp) {
        const whatsappFloat = document.querySelector('.whatsapp-float');
        if (whatsappFloat) {
            whatsappFloat.href = `https://wa.me/${settings.whatsapp}?text=Hi!%20I'm%20interested%20in%20your%203D%20printed%20products`;
        }
    }
}

// Update Social Links
function updateSocialLinks(settings) {
    if (!settings) return;
    
    const socialLinks = document.querySelectorAll('.social-links a');
    
    // Update YouTube link
    if (settings.youtube && socialLinks[0]) {
        socialLinks[0].href = settings.youtube;
    }
    
    // Update Instagram link
    if (settings.instagram && socialLinks[1]) {
        socialLinks[1].href = settings.instagram;
    }
    
    // Update WhatsApp link
    if (settings.whatsapp && socialLinks[2]) {
        socialLinks[2].href = `https://wa.me/${settings.whatsapp}`;
    }
    
    // Update Facebook link
    if (settings.facebook && socialLinks[3]) {
        socialLinks[3].href = settings.facebook;
    }
}

// Get WhatsApp Number
async function getWhatsAppNumber() {
    try {
        const settingsSnapshot = await getDocs(collection(db, 'settings'));
        if (!settingsSnapshot.empty) {
            const settings = settingsSnapshot.docs[0].data();
            return settings.whatsapp || '919876543210';
        }
    } catch (error) {
        console.error('Error getting WhatsApp number:', error);
    }
    return '919876543210';
}

// Export functions to window for HTML onclick attributes
window.addToCart = addToCart;
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.refreshProducts = refreshProducts;
window.trackOrder = trackOrder;
window.openGalleryModal = openGalleryModal;
window.closeGalleryModal = closeGalleryModal;
window.changeGalleryImage = changeGalleryImage;
window.copyUpiId = copyUpiId;
window.closePaymentModal = closePaymentModal;
window.confirmPayment = confirmPayment;
window.removeScreenshot = removeScreenshot;
