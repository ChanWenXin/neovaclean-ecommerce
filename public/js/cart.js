
// click_into_chicken
// Function to Buy now for specific product
function buyNow(name, price, image) {
    const quantity = parseInt(document.getElementById("quantity").value) || 1;
    const selectedProduct = [{ name, price, image, quantity }];

    // Store only the selected item in session storage to be used in checkout
    sessionStorage.setItem("buyNowItem", JSON.stringify(selectedProduct));

    // Ensure cart is not used
    sessionStorage.setItem("skipCart", "true");
    
    // Redirect to checkout page
    window.location.href = "checkout";
}

// Function to add items to cart
function addToCart(name, price, image) {
    let cart = JSON.parse(localStorage.getItem('cart')) || []; // Get existing cart or create new

    // Select the quantity input field dynamically (inside product page)
    let quantityInput = document.querySelector("input[type='number']");
    let quantity = parseInt(quantityInput.value) || 1; // Ensure valid number

    // Check if item already exists in cart
    let existingItem = cart.find(item => item.name === name);
    if (existingItem) {
        existingItem.quantity += quantity; // Add exact new quantity
    } else {
        cart.push({ name, price, image, quantity });
    }

    // Save updated cart to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));

    // Show confirmation message
    alert(`Added ${quantity} item(s) to Cart! 🛒`);
}


// cart.html
// Function to load cart items
function loadCart() {
    let cart = JSON.parse(localStorage.getItem('cart')) || []; // localStorage.getItem('cart') fetches the saved cart data from browser, JSON.parse(...) converts the stored JSON string back into a JavaScript array., || [] ensures that if no cart data exists, it defaults to an empty array ([]) so that the function doesn’t break
    let cartTable = document.getElementById('cart-items'); //This finds the table body (<tbody id="cart-items">) in your cart.html where we will display all the cart items.
    let grandTotal = 0; // Variable to store total cart price
    cartTable.innerHTML = '';

    cart.forEach((item, index) => {
        let totalPrice = item.price * item.quantity; // Calculate total price per item
        grandTotal += totalPrice; // Add to grand total

        let row = `<tr>
            <td><img src="${item.image}" width="50"></td>
            <td>${item.name}</td>
            <td>$${item.price.toFixed(2)}</td>
            <td>
                <button class="btn btn-sm btn-outline-secondary" onclick="updateQuantity(${index}, -1)">−</button>
                <span id="quantity-${index}">${item.quantity}</span>
                <button class="btn btn-sm btn-outline-secondary" onclick="updateQuantity(${index}, 1)">+</button>
            </td>
            <td><button class="btn btn-danger btn-sm" onclick="removeFromCart(${index})">Remove</button></td>
            <td>$${totalPrice.toFixed(2)}</td> <!-- Display total price -->
        </tr>`;
        cartTable.innerHTML += row;
    });

    // Ensure grand total updates properly
    document.getElementById('grand-total').textContent = `$${grandTotal.toFixed(2)}`;
}

// Function to update item quantity
function updateQuantity(index, change) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    if (cart[index]) {
        cart[index].quantity += change;

        // Prevent quantity from going below 1
        if (cart[index].quantity < 1) {
            cart[index].quantity = 1;
        }

        // Update localStorage and reload cart
        localStorage.setItem('cart', JSON.stringify(cart));
        loadCart(); // Reload cart display
    }
}


// Function to remove item from cart
function removeFromCart(index) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCart();
}

// Function to clear cart
function clearCart() {
    localStorage.removeItem('cart');
    loadCart();
}

// Load cart on page load
window.onload = () => {
    if (document.getElementById('cart-items')) {
        loadCart();
    }
};


// cart.html