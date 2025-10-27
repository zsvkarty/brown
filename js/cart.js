// Cart and booking functionality for Prague Dan Brown Website
// This file will handle cart management and booking flow

// Cart state management
let cart = {
    items: [],
    total: 0
};

// Service configuration
const services = {
    'private-tour': {
        name: 'Private Dan Brown Prague Tour',
        price: 150,
        duration: '2-3 hours',
        maxGroupSize: 8,
        pricingType: 'per-group',
        stripePaymentLink: 'https://buy.stripe.com/private-tour' // To be configured
    },
    'escape-room': {
        name: 'Dan Brown Mystery Escape Room',
        price: 35,
        duration: '60 minutes',
        maxGroupSize: 6,
        pricingType: 'per-person',
        stripePaymentLink: 'https://buy.stripe.com/escape-room' // To be configured
    }
};

// Initialize cart functionality
document.addEventListener('DOMContentLoaded', function() {
    loadCartFromStorage();
    updateCartDisplay();
});

// Load cart from localStorage
function loadCartFromStorage() {
    const savedCart = localStorage.getItem('prague-dan-brown-cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
}

// Save cart to localStorage
function saveCartToStorage() {
    localStorage.setItem('prague-dan-brown-cart', JSON.stringify(cart));
}

// Add item to cart
function addToCart(serviceType, quantity = 1, groupSize = null) {
    const service = services[serviceType];
    if (!service) return;
    
    // For private tour, we don't allow multiple quantities (it's per group)
    // For escape room, quantity represents number of people
    const existingItem = cart.items.find(item => item.serviceType === serviceType);
    
    if (existingItem) {
        if (serviceType === 'private-tour') {
            // Private tour is per group, so we don't increase quantity
            console.log('Private tour already in cart');
            return;
        } else {
            // For escape room, increase quantity (number of people)
            existingItem.quantity += quantity;
        }
    } else {
        const newItem = {
            serviceType,
            name: service.name,
            price: service.price,
            quantity: serviceType === 'private-tour' ? 1 : quantity,
            duration: service.duration,
            pricingType: service.pricingType,
            maxGroupSize: service.maxGroupSize
        };
        
        // For private tour, store group size if provided
        if (serviceType === 'private-tour' && groupSize) {
            newItem.groupSize = groupSize;
        }
        
        cart.items.push(newItem);
    }
    
    updateCartTotal();
    saveCartToStorage();
    updateCartDisplay();
    
    // Return success
    return true;
}

// Remove item from cart
function removeFromCart(serviceType) {
    cart.items = cart.items.filter(item => item.serviceType !== serviceType);
    updateCartTotal();
    saveCartToStorage();
    updateCartDisplay();
}

// Update cart total
function updateCartTotal() {
    cart.total = cart.items.reduce((sum, item) => {
        if (item.pricingType === 'per-group') {
            // Private tour is per group, so price doesn't multiply by quantity
            return sum + item.price;
        } else {
            // Escape room is per person
            return sum + (item.price * item.quantity);
        }
    }, 0);
}

// Update cart display in UI
function updateCartDisplay() {
    // Update cart badge/counter if it exists
    const cartBadge = document.querySelector('.cart-badge');
    if (cartBadge) {
        const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        cartBadge.textContent = itemCount;
        cartBadge.style.display = itemCount > 0 ? 'block' : 'none';
    }
    
    // Update cart dropdown/sidebar if it exists
    const cartDropdown = document.querySelector('.cart-dropdown');
    if (cartDropdown) {
        updateCartDropdownContent();
    }
    
    console.log('Cart updated:', cart);
}

// Update cart dropdown content
function updateCartDropdownContent() {
    const cartDropdown = document.querySelector('.cart-dropdown');
    if (!cartDropdown) return;
    
    const cartItemsContainer = cartDropdown.querySelector('.cart-items');
    const cartTotalElement = cartDropdown.querySelector('.cart-total');
    
    if (cart.items.length === 0) {
        if (cartItemsContainer) {
            cartItemsContainer.innerHTML = '<p class="text-slate-500 text-center py-4">Your cart is empty</p>';
        }
        if (cartTotalElement) {
            cartTotalElement.textContent = '€0';
        }
        return;
    }
    
    // Generate cart items HTML
    if (cartItemsContainer) {
        cartItemsContainer.innerHTML = cart.items.map(item => `
            <div class="cart-item flex justify-between items-center py-3 border-b border-slate-200">
                <div class="flex-1">
                    <h4 class="font-medium text-slate-900">${item.name}</h4>
                    <p class="text-sm text-slate-600">
                        ${item.pricingType === 'per-group' ? 
                            `Group of ${item.groupSize || 'up to ' + item.maxGroupSize}` : 
                            `${item.quantity} ${item.quantity === 1 ? 'person' : 'people'}`
                        }
                    </p>
                </div>
                <div class="text-right">
                    <div class="font-semibold text-slate-900">€${item.pricingType === 'per-group' ? item.price : item.price * item.quantity}</div>
                    <button onclick="removeFromCart('${item.serviceType}')" class="text-xs text-red-600 hover:text-red-800">Remove</button>
                </div>
            </div>
        `).join('');
    }
    
    // Update total
    if (cartTotalElement) {
        cartTotalElement.textContent = `€${cart.total}`;
    }
}

// Clear cart
function clearCart() {
    cart = { items: [], total: 0 };
    saveCartToStorage();
    updateCartDisplay();
}

// Get cart item count
function getCartItemCount() {
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}

// Get cart total price
function getCartTotal() {
    return cart.total;
}

// Check if service is in cart
function isServiceInCart(serviceType) {
    return cart.items.some(item => item.serviceType === serviceType);
}

// Get service from cart
function getCartItem(serviceType) {
    return cart.items.find(item => item.serviceType === serviceType);
}

// Update cart item quantity
function updateCartItemQuantity(serviceType, newQuantity) {
    const item = cart.items.find(item => item.serviceType === serviceType);
    if (item && newQuantity > 0) {
        item.quantity = newQuantity;
        updateCartTotal();
        saveCartToStorage();
        updateCartDisplay();
        return true;
    }
    return false;
}

// Prepare cart data for checkout
function prepareCheckoutData() {
    return {
        items: cart.items.map(item => ({
            serviceType: item.serviceType,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            pricingType: item.pricingType,
            groupSize: item.groupSize || null
        })),
        total: cart.total,
        timestamp: new Date().toISOString()
    };
}

// Generate Stripe Payment Link URL with prefilled data
function generateStripePaymentUrl(customerData = {}) {
    // In a real implementation, this would generate the appropriate Stripe Payment Link
    // based on cart contents and customer information
    
    if (cart.items.length === 0) {
        return null;
    }
    
    // For now, we'll use the first item's payment link
    // In a real implementation, you might need to create dynamic payment links
    // or use Stripe Checkout Sessions API
    const firstItem = cart.items[0];
    const service = services[firstItem.serviceType];
    
    let paymentUrl = service.stripePaymentLink;
    
    // Add customer email if provided
    if (customerData.email) {
        paymentUrl += `?prefilled_email=${encodeURIComponent(customerData.email)}`;
    }
    
    return paymentUrl;
}

// Handle successful payment (called from success page)
function handlePaymentSuccess(sessionId) {
    // Store successful booking data
    const bookingData = {
        ...prepareCheckoutData(),
        sessionId,
        status: 'completed',
        completedAt: new Date().toISOString()
    };
    
    // Save to completed bookings
    const completedBookings = JSON.parse(localStorage.getItem('completed-bookings') || '[]');
    completedBookings.push(bookingData);
    localStorage.setItem('completed-bookings', JSON.stringify(completedBookings));
    
    // Clear cart
    clearCart();
    
    return bookingData;
}

// Get completed bookings
function getCompletedBookings() {
    return JSON.parse(localStorage.getItem('completed-bookings') || '[]');
}

// Validate cart before checkout
function validateCart() {
    if (cart.items.length === 0) {
        return { valid: false, message: 'Your cart is empty' };
    }
    
    // Check for any validation rules
    for (const item of cart.items) {
        if (item.serviceType === 'escape-room' && item.quantity > item.maxGroupSize) {
            return { 
                valid: false, 
                message: `Escape room maximum group size is ${item.maxGroupSize} people` 
            };
        }
    }
    
    return { valid: true };
}

// Initialize cart UI elements (if they exist on the page)
function initCartUI() {
    // Initialize cart toggle button
    const cartToggle = document.querySelector('.cart-toggle');
    if (cartToggle) {
        cartToggle.addEventListener('click', toggleCartDropdown);
    }
    
    // Initialize checkout button
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckoutClick);
    }
    
    // Update initial display
    updateCartDisplay();
}

// Toggle cart dropdown
function toggleCartDropdown() {
    const cartDropdown = document.querySelector('.cart-dropdown');
    if (cartDropdown) {
        cartDropdown.classList.toggle('hidden');
    }
}

// Handle checkout button click
function handleCheckoutClick() {
    const validation = validateCart();
    if (!validation.valid) {
        alert(validation.message);
        return;
    }
    
    // Redirect to checkout page or open checkout modal
    // This depends on your checkout flow implementation
    console.log('Proceeding to checkout with cart:', cart);
}

// Add event listener for cart UI initialization
document.addEventListener('DOMContentLoaded', function() {
    initCartUI();
});