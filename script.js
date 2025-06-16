document.addEventListener('DOMContentLoaded', () => {
	const body = document.body;
	const mainNavLinks = document.querySelectorAll('.main-nav a');
	const themeNames = ['women', 'men', 'kids', 'home'];

	const dynamicContentArea = document.getElementById('dynamic-content-area');
	const contentSwitcher = document.getElementById('contentSwitcher');
	const defaultCategorySection = document.getElementById('default-category-section');
	const controlsArea = document.querySelector('.controls-area');

	const toggleFilterPanelBtn = document.getElementById('toggleFilterPanelBtn');
	const filterPanel = document.getElementById('filterPanel');
	const brandFilterGroup = document.getElementById('brandFilterGroup');
	const minPriceInput = document.getElementById('minPrice');
	const maxPriceInput = document.getElementById('maxPrice');
	const applyFiltersBtn = document.getElementById('applyFiltersBtn');
	const sortOptionsSelect = document.getElementById('sortOptions');
	const headerCartIcon = document.getElementById('headerCartIcon'); // Added

	let cartItems = [];
	let displayedProducts = [];
	let currentFilters = {};
	let currentSortOption = 'price-asc';
	let currentPath = [];
	let currentView = '';

	// --- CART & WISHLIST FUNCTIONS ---
	function loadCartAndWishlistFromStorage() {
		const storedCart = localStorage.getItem('vanyeeLuxeCart');
		if (storedCart) cartItems = JSON.parse(storedCart);
		const storedWishlist = localStorage.getItem('vanyeeLuxeWishlist');
		if (storedWishlist) wishlistItems = JSON.parse(storedWishlist);
	}

	function saveCartToStorage() {
		localStorage.setItem('vanyeeLuxeCart', JSON.stringify(cartItems));
	}

	function saveWishlistToStorage() {
		localStorage.setItem('vanyeeLuxeWishlist', JSON.stringify(wishlistItems));
	}

	function addToCart(productId) {
		const product = allProducts.find(p => p.id === productId);
		if (!product) return;

		const currentVariantImage = product.variants && product.variants.length > 0 ?
			product.variants[product.defaultVariantIndex].image :
			product.image;

		const existingItemIndex = cartItems.findIndex(item => item.id === productId);
		if (existingItemIndex > -1) {
			cartItems[existingItemIndex].quantity++;
		} else {
			cartItems.push({
				id: product.id,
				name: product.name,
				price: product.price,
				image: currentVariantImage,
				quantity: 1
			});
		}
		saveCartToStorage();
	}

	function toggleWishlist(productId, buttonElement) {
		const product = allProducts.find(p => p.id === productId);
		if (!product) return;

		const itemIndex = wishlistItems.findIndex(item => item.id === productId);
		if (itemIndex > -1) {
			wishlistItems.splice(itemIndex, 1);
		} else {
			wishlistItems.push({
				id: product.id,
				name: product.name,
				price: product.price,
				image: product.image
			});
		}
		saveWishlistToStorage();
		updateWishlistProductIconState(buttonElement, productId);
	}

	function updateWishlistProductIconState(buttonElement, productId) {
		if (!buttonElement) return;
		const isWishlisted = wishlistItems.some(item => item.id === productId);
		const icon = buttonElement.querySelector('i');
		if (isWishlisted) {
			buttonElement.classList.add('active');
			icon.classList.remove('far');
			icon.classList.add('fas');
			buttonElement.setAttribute('aria-label', 'Remove from wishlist');
		} else {
			buttonElement.classList.remove('active');
			icon.classList.remove('fas');
			icon.classList.add('far');
			buttonElement.setAttribute('aria-label', 'Add to wishlist');
		}
	}


	// --- THEME & INITIALIZATION ---
	mainNavLinks.forEach(link => {
		link.addEventListener('click', function(event) {
			if (this.getAttribute('href') === '#') event.preventDefault();
			mainNavLinks.forEach(l => l.classList.remove('active'));
			this.classList.add('active');
			const selectedTheme = this.dataset.theme;
			themeNames.forEach(themeName => body.classList.remove(`theme-${themeName}`));
			if (selectedTheme) {
				body.classList.add(`theme-${selectedTheme}`);
				document.title = `Vanyee Luxe - ${selectedTheme.charAt(0).toUpperCase() + selectedTheme.slice(1)}`;
			}
			currentPath = [];
			currentView = ''; // Reset to default view for the new theme
			renderContentFlow();
		});
	});
	const initialActiveLink = document.querySelector('.main-nav a.active');
	if (initialActiveLink && initialActiveLink.dataset.theme) {
		const initialTheme = initialActiveLink.dataset.theme;
		document.title = `Vanyee Luxe - ${initialTheme.charAt(0).toUpperCase() + initialTheme.slice(1)}`;
	}

	function initializeApp() {
		loadCartAndWishlistFromStorage();
		populateFilterOptions();
		renderContentFlow();
		setupEventListeners();
	}

	function setupEventListeners() {
		if (toggleFilterPanelBtn) toggleFilterPanelBtn.addEventListener('click', () => filterPanel.classList.toggle('open'));
		if (applyFiltersBtn) applyFiltersBtn.addEventListener('click', () => {
			collectAndApplyFilters();
			filterPanel.classList.remove('open');
		});
		if (sortOptionsSelect) sortOptionsSelect.addEventListener('change', (e) => {
			currentSortOption = e.target.value;
			applySortAndRender();
		});

		if (headerCartIcon) { // Added event listener for header cart icon
			headerCartIcon.addEventListener('click', showCartPage);
		}

		if (dynamicContentArea) {
			dynamicContentArea.addEventListener('click', (e) => {
				const colorSwatch = e.target.closest('.color-swatch');
				const addToCartButton = e.target.closest('.add-to-cart-btn');
				const wishlistButton = e.target.closest('.wishlist-btn');

				if (colorSwatch) {
					handleColorSwatchClick(colorSwatch);
				} else if (addToCartButton) {
					const productId = addToCartButton.dataset.productId;
					addToCart(productId);
				} else if (wishlistButton) {
					const productId = wishlistButton.dataset.productId;
					toggleWishlist(productId, wishlistButton);
				}
			});
		}
	}

	// --- FILTER LOGIC ---
	function populateFilterOptions() {
		const brands = [...new Set(allProducts.map(p => p.brand))];
		if (brandFilterGroup) {
			brandFilterGroup.innerHTML = '<h5>Brand</h5>';
			brands.sort().forEach(brand => {
				brandFilterGroup.innerHTML += `<div><input type="checkbox" id="brand-${brand.replace(/\s+/g, '-')}" value="${brand}" name="brand"><label for="brand-${brand.replace(/\s+/g, '-')}">${brand}</label></div>`;
			});
		}
	}

	function collectAndApplyFilters() {
		currentFilters = {
			brands: brandFilterGroup ? Array.from(brandFilterGroup.querySelectorAll('input[name="brand"]:checked')).map(cb => cb.value) : [],
			minPrice: minPriceInput ? (parseFloat(minPriceInput.value) || null) : null,
			maxPrice: maxPriceInput ? (parseFloat(maxPriceInput.value) || null) : null,
			minRating: 0
		};
		let highestMinRating = 0;
		currentFilters.minRating = highestMinRating;
		filterAndSortProducts();
	}

	function clearAllFilters() {
		if (brandFilterGroup) brandFilterGroup.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
		if (minPriceInput) minPriceInput.value = '';
		if (maxPriceInput) maxPriceInput.value = '';
		currentFilters = {};
	}

	function filterAndSortProducts() {
		let tempProducts = [...allProducts];
		if (currentPath && currentPath.length > 0) {
			const currentCategoryLeafKey = currentPath[currentPath.length - 1];
			// Filter by full path or if the leaf key is one of the product's categories
			tempProducts = tempProducts.filter(p =>
				currentPath.every((segment, i) => p.category[i] === segment) ||
				p.category.includes(currentCategoryLeafKey)
			);
		}
		if (currentFilters.categories && currentFilters.categories.length > 0) {
			tempProducts = tempProducts.filter(p => currentFilters.categories.some(cat => p.category.includes(cat)));
		}
		if (currentFilters.brands && currentFilters.brands.length > 0) {
			tempProducts = tempProducts.filter(p => currentFilters.brands.includes(p.brand));
		}
		if (currentFilters.minPrice) {
			tempProducts = tempProducts.filter(p => p.price >= currentFilters.minPrice);
		}
		if (currentFilters.maxPrice) {
			tempProducts = tempProducts.filter(p => p.price <= currentFilters.maxPrice);
		}
		if (currentFilters.minRating && currentFilters.minRating > 0) {
			tempProducts = tempProducts.filter(p => p.rating >= currentFilters.minRating);
		}
		displayedProducts = tempProducts;
		applySortAndRender();
	}

	function applySortAndRender() {
		let sortedProducts = [...displayedProducts];
		switch (currentSortOption) {
			case 'price-asc':
				sortedProducts.sort((a, b) => a.price - b.price);
				break;
			case 'price-desc':
				sortedProducts.sort((a, b) => b.price - a.price);
				break;
			default:
				sortedProducts.sort((a, b) => b.rating - a.rating || a.price - b.price);
				break;
		}
		displayedProducts = sortedProducts;
		let productListTitle = "Products";
		if (currentPath.length > 0) {
			let navData = siteData;
			currentPath.forEach(p => navData = navData[p] || (navData.subCategories ? navData.subCategories[p] : {}));
			productListTitle = navData.name ? `${navData.name} Products` : "Filtered Products";
		} else if (Object.keys(currentFilters).length > 0 && ((currentFilters.categories && currentFilters.categories.length > 0) || (currentFilters.brands && currentFilters.brands.length > 0) || currentFilters.minPrice || currentFilters.maxPrice || currentFilters.minRating > 0)) {
			productListTitle = "Filtered Products";
		}
		renderProductGrid(productListTitle, displayedProducts);
	}

	// --- NAVIGATION & CONTENT FLOW ---
	function renderContentFlow() {
		const discountBanner = document.querySelector('.discount-banner');
		const promoBanners = document.querySelector('.promo-banners');

		if (currentView === 'cart') {
			if (contentSwitcher && contentSwitcher.parentElement) contentSwitcher.parentElement.style.display = 'none';
			if (controlsArea) controlsArea.style.display = 'none';
			if (defaultCategorySection) defaultCategorySection.style.display = 'none';
			if (discountBanner) discountBanner.style.display = 'none';
			if (promoBanners) promoBanners.style.display = 'none';
			renderCartPage();
		} else {
			if (dynamicContentArea) dynamicContentArea.innerHTML = ''; // Clear for non-cart views
			if (contentSwitcher && contentSwitcher.parentElement) {
				contentSwitcher.parentElement.style.display = 'block';
				renderSwitcher();
			}
			renderDynamicContentOrProducts(); // This will handle controlsArea, default sections etc.

			// These banners are generally part of non-cart browsing experience
			if (discountBanner) discountBanner.style.display = 'block';
			if (promoBanners) promoBanners.style.display = 'block';
		}
	}

	function renderDynamicContentOrProducts() {
		if (dynamicContentArea && currentView !== 'cart') dynamicContentArea.innerHTML = ''; // Ensure clean slate if not cart
		if (defaultCategorySection) defaultCategorySection.style.display = 'none';

		let dataToShow = siteData;
		let showProductsDirectly = false;

		for (const segment of currentPath) {
			const nextLevel = dataToShow[segment] || (dataToShow.subCategories ? dataToShow.subCategories[segment] : null);
			if (nextLevel && (nextLevel.subCategories || nextLevel.items)) {
				dataToShow = nextLevel;
			} else if (nextLevel) { // It's a leaf node in siteData (like an item name string) or a category without further subcategories defined in siteData
				dataToShow = nextLevel; // Could be an object with just 'name' or a string.
				showProductsDirectly = true;
				break;
			} else { // Path segment not found or leads to undefined structure
				showProductsDirectly = true;
				break;
			}
		}

		// If at root and no specific top-level category selected (e.g. after theme switch)
		if (currentPath.length === 0 && siteData[Object.keys(siteData)[0]] && currentView !== 'products') {
			const activeThemeMatch = document.body.className.match(/theme-(\w+)/);
			const mainCatKey = activeThemeMatch ? (siteData[activeThemeMatch[1]] ? activeThemeMatch[1] : Object.keys(siteData)[0]) : Object.keys(siteData)[0];
			const defaultTopCatKey = mainCatKey === 'women' && siteData.beauty ? 'beauty' : mainCatKey;
			dataToShow = siteData[defaultTopCatKey] || siteData[Object.keys(siteData)[0]];

			if (contentSwitcher && !contentSwitcher.querySelector('.switcher-tab.active') && contentSwitcher.firstChild) {
				const firstTab = Array.from(contentSwitcher.querySelectorAll('.switcher-tab')).find(tab => tab.dataset.target === defaultTopCatKey);
				if (firstTab) firstTab.classList.add('active');
				else if (contentSwitcher.firstChild) contentSwitcher.firstChild.classList.add('active');
			}
		}

		if (showProductsDirectly || currentView === 'products') {
			if (controlsArea) controlsArea.style.display = 'flex';
			currentView = 'products';
			filterAndSortProducts(); // This will call renderProductGrid
		} else if (dataToShow && dataToShow.subCategories) {
			if (controlsArea) controlsArea.style.display = 'none';
			currentView = 'categories';
			renderCategoryCards(dataToShow.subCategories);
		} else if (dataToShow && dataToShow.items) {
			if (controlsArea) controlsArea.style.display = 'none';
			currentView = 'items';
			renderItemCards(dataToShow.items);
		} else { // Fallback to default sections if no specific content path
			if (controlsArea) controlsArea.style.display = 'none';
			if (defaultCategorySection) defaultCategorySection.style.display = 'block';
			// Optionally, render some default products here for the home screen of a theme
		}
	}

	function renderCategoryCards(subCategoriesData) {
		const grid = document.createElement('div');
		grid.className = 'dynamic-category-grid';
		Object.keys(subCategoriesData).forEach(key => {
			const item = subCategoriesData[key];
			const card = document.createElement('div');
			card.className = 'dynamic-category-card';
			card.textContent = item.name;
			card.dataset.target = key;
			card.addEventListener('click', () => navigateToNextLevel(key));
			grid.appendChild(card);
		});
		if (dynamicContentArea) dynamicContentArea.appendChild(grid);
	}

	function renderItemCards(itemsArray) {
		const grid = document.createElement('div');
		grid.className = 'dynamic-category-grid';
		itemsArray.forEach(itemName => {
			const card = document.createElement('div');
			card.className = 'dynamic-category-card';
			card.textContent = itemName;
			const itemKey = itemName.toLowerCase().replace(/\s+/g, '-');
			card.dataset.target = itemKey;
			card.addEventListener('click', () => navigateToProductList(itemKey));
			grid.appendChild(card);
		});
		if (dynamicContentArea) dynamicContentArea.appendChild(grid);
	}

	function navigateToProductList(itemKey) {
		currentPath.push(itemKey);
		currentView = 'products';
		renderContentFlow();
	}

	function renderProductGrid(title, productsToRender) {
		if (!dynamicContentArea) return;
		if (currentView === 'cart') return; // Don't render products if cart is active

		dynamicContentArea.innerHTML = ''; // Clear before rendering products
		const recommendationsSection = document.createElement('section');
		recommendationsSection.className = 'recommendations'; // Use existing class for styling consistency
		const heading = document.createElement('h2');
		heading.textContent = title || "Products";
		recommendationsSection.appendChild(heading);

		if (productsToRender.length === 0) {
			recommendationsSection.innerHTML += '<p style="text-align:center; padding: 20px;">No products match your criteria.</p>';
			dynamicContentArea.appendChild(recommendationsSection);
			return;
		}

		const grid = document.createElement('div');
		grid.className = 'product-grid';
		productsToRender.forEach(product => {
			const item = document.createElement('div');
			item.className = 'product-item';
			const currentVariant = product.variants[product.defaultVariantIndex];
			let ratingHTML = '';
			const fullStars = Math.floor(product.rating);
			const halfStar = product.rating % 1 >= 0.5;
			for (let i = 0; i < fullStars; i++) ratingHTML += '<i class="fas fa-star"></i>';
			if (halfStar) ratingHTML += '<i class="fas fa-star-half-alt"></i>';
			for (let i = 0; i < (5 - fullStars - (halfStar ? 1 : 0)); i++) ratingHTML += '<i class="far fa-star"></i>';

			item.innerHTML = `
                <img src="${currentVariant.image}" alt="${product.name}" class="product-image-display" data-product-id="${product.id}">
                <p class="product-name">${product.name}</p>
                <div class="product-rating">${ratingHTML} (${product.rating.toFixed(1)})</div>
                <p class="product-price">₹${product.price.toLocaleString()}</p>
                <div class="color-swatches" id="swatches-${product.id}">
                    ${product.variants.map((variant, index) => `
                        <span class="color-swatch ${index === (product.defaultVariantIndex) ? 'active' : ''}" 
                              style="background-color: ${variant.colorHex};" 
                              data-variant-index="${index}" 
                              data-product-ref="${product.id}"></span>`).join('')}
                </div>
                <div class="product-actions">
                    <button class="add-to-cart-btn" data-product-id="${product.id}">Add to Bag</button>
                    <button class="wishlist-btn" data-product-id="${product.id}" aria-label="Add to wishlist">
                        <i class="far fa-heart"></i>
                    </button>
                </div>`;
			grid.appendChild(item);
			const wishlistButton = item.querySelector('.wishlist-btn');
			updateWishlistProductIconState(wishlistButton, product.id);
		});
		recommendationsSection.appendChild(grid);
		dynamicContentArea.appendChild(recommendationsSection);
	}

	function handleColorSwatchClick(swatchElement) {
		const productId = swatchElement.dataset.productRef;
		const variantIndex = parseInt(swatchElement.dataset.variantIndex);
		const productInAllProducts = allProducts.find(p => p.id === productId);

		if (productInAllProducts && productInAllProducts.variants[variantIndex]) {
			productInAllProducts.defaultVariantIndex = variantIndex; // Update source of truth

			const selectedVariant = productInAllProducts.variants[variantIndex];
			const productItemElement = swatchElement.closest('.product-item');
			if (productItemElement) {
				const productImage = productItemElement.querySelector('.product-image-display');
				if (productImage) productImage.src = selectedVariant.image;
				productItemElement.querySelectorAll('.color-swatches .color-swatch').forEach(s => s.classList.remove('active'));
				swatchElement.classList.add('active');
			}
		}
	}

	function navigateToNextLevel(key) {
		currentPath.push(key);
		currentView = ''; // Reset view to allow re-evaluation (categories, items, or products)
		renderContentFlow();
	}

	function renderSwitcher() {
		if (!contentSwitcher) return;
		contentSwitcher.innerHTML = '';
		const activeThemeMatch = document.body.className.match(/theme-(\w+)/);
		const currentTopLevelKey = activeThemeMatch ? (siteData[activeThemeMatch[1]] ? activeThemeMatch[1] : Object.keys(siteData)[0]) : Object.keys(siteData)[0];


		if (currentPath.length === 0) {
			Object.keys(siteData).forEach(key => {
				const tab = document.createElement('span');
				tab.className = 'switcher-tab';
				tab.textContent = siteData[key].name;
				tab.dataset.target = key;
				// Set active based on current theme's default or first path segment if exists
				if (key === (currentPath[0] || currentTopLevelKey)) {
					tab.classList.add('active');
				}
				tab.addEventListener('click', () => handleSwitcherClick(key, 0));
				contentSwitcher.appendChild(tab);
			});
			// Ensure one tab is active if currentPath is empty
			if (!contentSwitcher.querySelector('.switcher-tab.active')) {
				const targetTab = contentSwitcher.querySelector(`.switcher-tab[data-target="${currentTopLevelKey}"]`) || contentSwitcher.firstChild;
				if (targetTab) targetTab.classList.add('active');
			}

		} else { // Breadcrumb view
			let currentLevelData = siteData;
			const homeCrumb = document.createElement('span');
			homeCrumb.className = 'breadcrumb-item';
			homeCrumb.textContent = "All"; // Or specific top-level category name
			homeCrumb.dataset.target = "home"; // Special target
			homeCrumb.dataset.level = -1;
			homeCrumb.addEventListener('click', () => {
				currentPath = [];
				currentView = '';
				renderContentFlow();
			});
			contentSwitcher.appendChild(homeCrumb);

			currentPath.forEach((segment, index) => {
				const separator = document.createElement('span');
				separator.className = 'breadcrumb-separator';
				separator.textContent = '>';
				contentSwitcher.appendChild(separator);

				currentLevelData = currentLevelData[segment] || (currentLevelData.subCategories ? currentLevelData.subCategories[segment] : {});
				const crumb = document.createElement('span');
				crumb.className = 'breadcrumb-item';
				crumb.textContent = currentLevelData.name || segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
				crumb.dataset.target = segment;
				crumb.dataset.level = index;
				crumb.addEventListener('click', () => handleSwitcherClick(segment, index));
				contentSwitcher.appendChild(crumb);
			});
		}
	}

	function handleSwitcherClick(targetKey, level) {
		if (level === -1) { // Clicked "All" or home breadcrumb
			currentPath = [];
		} else if (level === 0 && currentPath.length <= 1 && (!currentPath[0] || currentPath[0] !== targetKey)) {
			// Clicked a top-level tab in switcher view, or first real breadcrumb
			currentPath = [targetKey];
		} else { // Clicked a breadcrumb segment
			currentPath = currentPath.slice(0, level + 1);
		}
		currentView = ''; // Let renderContentFlow determine view (categories, items, products)
		renderContentFlow();
	}

	// --- CART PAGE SPECIFIC FUNCTIONS ---
	function showCartPage() {
		currentView = 'cart';
		renderContentFlow();
	}

	function goBackToShopping() {
		currentView = ''; // Reset to default browsing view
		currentPath = []; // Go to top-level of current theme
		renderContentFlow();
	}

	function handleCartQuantityChange(productId, action) {
		const itemIndex = cartItems.findIndex(item => item.id === productId);
		if (itemIndex > -1) {
			if (action === 'increase') {
				cartItems[itemIndex].quantity++;
			} else if (action === 'decrease') {
				cartItems[itemIndex].quantity--;
				if (cartItems[itemIndex].quantity <= 0) {
					cartItems.splice(itemIndex, 1);
				}
			}
			saveCartToStorage();
			if (currentView === 'cart') {
				renderCartPage(); // Re-render the cart page to reflect changes
			}
		}
	}

	function handleRemoveFromCart(productId) {
		cartItems = cartItems.filter(item => item.id !== productId);
		saveCartToStorage();
		if (currentView === 'cart') {
			renderCartPage(); // Re-render the cart page
		}
	}

	function renderCartPage() {
		if (!dynamicContentArea) return;
		dynamicContentArea.innerHTML = ''; // Clear previous content from dynamic area

		const cartPageContainer = document.createElement('div');
		cartPageContainer.className = 'cart-page-container';

		const title = document.createElement('h2');
		title.textContent = 'Your Shopping Bag';
		cartPageContainer.appendChild(title);

		if (cartItems.length === 0) {
			const emptyCartDiv = document.createElement('div');
			emptyCartDiv.className = 'empty-cart-message';
			emptyCartDiv.innerHTML = `<p>Your shopping bag is empty.</p>`;
			const shopNowBtn = document.createElement('button');
			shopNowBtn.className = 'shop-now-btn';
			shopNowBtn.textContent = 'Shop Now';
			shopNowBtn.addEventListener('click', goBackToShopping);
			emptyCartDiv.appendChild(shopNowBtn);
			cartPageContainer.appendChild(emptyCartDiv);
		} else {
			const itemsListDiv = document.createElement('div');
			itemsListDiv.className = 'cart-items-list';
			let subtotal = 0;

			cartItems.forEach(item => {
				const itemDiv = document.createElement('div');
				itemDiv.className = 'cart-item';
				itemDiv.dataset.productId = item.id;

				const itemImage = document.createElement('img');
				itemImage.src = item.image || 'node-32.png'; // Fallback image
				itemImage.alt = item.name;
				itemImage.className = 'cart-item-image';

				const itemDetailsDiv = document.createElement('div');
				itemDetailsDiv.className = 'cart-item-details';
				itemNameP = document.createElement('p');
				itemNameP.className = 'cart-item-name';
				itemNameP.textContent = item.name;
				itemPriceP = document.createElement('p');
				itemPriceP.className = 'cart-item-price';
				itemPriceP.textContent = `₹${item.price.toLocaleString()}`;

				const itemQuantityDiv = document.createElement('div');
				itemQuantityDiv.className = 'cart-item-quantity';
				const decreaseBtn = document.createElement('button');
				decreaseBtn.className = 'quantity-btn decrease-btn';
				decreaseBtn.textContent = '-';
				decreaseBtn.dataset.action = 'decrease';
				const quantitySpan = document.createElement('span');
				quantitySpan.textContent = item.quantity;
				const increaseBtn = document.createElement('button');
				increaseBtn.className = 'quantity-btn increase-btn';
				increaseBtn.textContent = '+';
				increaseBtn.dataset.action = 'increase';
				itemQuantityDiv.append(decreaseBtn, quantitySpan, increaseBtn);
				itemDetailsDiv.append(itemNameP, itemPriceP, itemQuantityDiv);

				const itemSubtotalP = document.createElement('p');
				itemSubtotalP.className = 'cart-item-subtotal';
				const currentItemTotal = item.price * item.quantity;
				itemSubtotalP.textContent = `₹${currentItemTotal.toLocaleString()}`;
				subtotal += currentItemTotal;

				const removeItemBtn = document.createElement('button');
				removeItemBtn.className = 'remove-item-btn';
				removeItemBtn.innerHTML = '×';
				removeItemBtn.title = "Remove item";

				itemDiv.append(itemImage, itemDetailsDiv, itemSubtotalP, removeItemBtn);
				itemsListDiv.appendChild(itemDiv);
			});
			cartPageContainer.appendChild(itemsListDiv);

			const summaryDiv = document.createElement('div');
			summaryDiv.className = 'cart-summary';
			summaryDiv.innerHTML = `
                <p>Subtotal: <span id="cartSubtotalValue">₹${subtotal.toLocaleString()}</span></p>
                <p>Shipping: <span id="cartShippingValue">FREE</span></p>
                <h3>Total: <span id="cartGrandTotalValue">₹${subtotal.toLocaleString()}</span></h3>
            `;
			const checkoutBtn = document.createElement('button');
			checkoutBtn.className = 'checkout-btn';
			checkoutBtn.textContent = 'Proceed to Checkout';
			checkoutBtn.addEventListener('click', () => alert('Checkout not implemented.'));
			const continueShoppingBtn = document.createElement('button');
			continueShoppingBtn.className = 'continue-shopping-btn';
			continueShoppingBtn.textContent = 'Continue Shopping';
			continueShoppingBtn.addEventListener('click', goBackToShopping);
			summaryDiv.append(checkoutBtn, continueShoppingBtn);
			cartPageContainer.appendChild(summaryDiv);
		}
		dynamicContentArea.appendChild(cartPageContainer);

		// Event delegation for cart item actions
		const cartItemsList = cartPageContainer.querySelector('.cart-items-list');
		if (cartItemsList) {
			cartItemsList.addEventListener('click', (e) => {
				const target = e.target;
				const cartItemElement = target.closest('.cart-item');
				if (!cartItemElement) return;
				const productId = cartItemElement.dataset.productId;

				if (target.classList.contains('quantity-btn')) {
					handleCartQuantityChange(productId, target.dataset.action);
				} else if (target.classList.contains('remove-item-btn') || target.closest('.remove-item-btn')) {
					handleRemoveFromCart(productId);
				}
			});
		}
	}


	initializeApp();
});

const allProducts = [{
	id: "fw001",
	name: "Gentle Cleansing Face Wash",
	price: 499,
	rating: 4.5,
	brand: "PureGlow",
	category: ["beauty", "self-care", "face", "face-wash"],
	tags: ["organic", "sensitive-skin", "hydrating"],
	image: "node-32.png",
	variants: [{
		colorName: "default",
		colorHex: "#F0F8FF",
		image: "node-32.png"
	}, {
		colorName: "rose",
		colorHex: "#FFC0CB",
		image: "node-32.png"
	}],
	defaultVariantIndex: 0,
	description: "A mild and effective face wash for daily use, suitable for all skin types."
}, {
	id: "fw002",
	name: "Acne Control Face Wash",
	price: 599,
	rating: 4.2,
	brand: "ClearSkin",
	category: ["beauty", "self-care", "face", "face-wash"],
	tags: ["acne-prone", "tea-tree", "oil-control"],
	image: "node-32.png",
	variants: [{
		colorName: "default",
		colorHex: "#90EE90",
		image: "node-32.png"
	}],
	defaultVariantIndex: 0,
	description: "Targets blemishes and controls excess oil with natural tea tree extracts."
}, {
	id: "fs001",
	name: "Vitamin C Brightening Serum",
	price: 899,
	rating: 4.8,
	brand: "VividHue",
	category: ["beauty", "self-care", "face", "face-serum"],
	tags: ["brightening", "vitamin-c", "anti-aging"],
	image: "node-32.png",
	variants: [{
		colorName: "default",
		colorHex: "#FFD700",
		image: "node-32.png"
	}],
	defaultVariantIndex: 0,
	description: "Powerful Vitamin C serum to reduce dark spots and boost radiance."
}, {
	id: "lp001",
	name: "Matte Velvet Lipstick",
	price: 750,
	rating: 4.6,
	brand: "LuxeLips",
	category: ["beauty", "makeup", "lips", "lipstick"],
	tags: ["matte", "long-lasting", "velvet"],
	image: "node-32.png",
	variants: [{
		colorName: "ruby-red",
		colorHex: "#E0115F",
		image: "node-32.png"
	}, {
		colorName: "nude-rose",
		colorHex: "#C48189",
		image: "node-32.png"
	}, {
		colorName: "deep-plum",
		colorHex: "#6A0DAD",
		image: "node-32.png"
	}],
	defaultVariantIndex: 0,
	description: "A luxurious matte lipstick with a comfortable, long-wearing formula."
}, {
	id: "fd001",
	name: "Floral Summer Maxi Dress",
	price: 1299,
	rating: 4.7,
	brand: "BohoChic",
	category: ["fashion", "womens-wear", "dresses"],
	tags: ["floral", "summer", "maxi", "bohemian"],
	image: "node-32.png",
	variants: [{
		colorName: "blue-floral",
		colorHex: "#ADD8E6",
		image: "node-32.png"
	}, {
		colorName: "pink-floral",
		colorHex: "#FFB6C1",
		image: "node-32.png"
	}],
	defaultVariantIndex: 0,
	description: "Flowy and comfortable maxi dress perfect for summer days."
}, {
	id: "hd001",
	name: "Velvet Throw Cushion",
	price: 650,
	rating: 4.4,
	brand: "CozyHome",
	category: ["home", "decor", "cushions"],
	tags: ["velvet", "luxury", "living-room"],
	image: "node-32.png",
	variants: [{
		colorName: "royal-blue",
		colorHex: "#4169E1",
		image: "node-32.png"
	}, {
		colorName: "emerald-green",
		colorHex: "#2E8B57",
		image: "node-32.png"
	}, {
		colorName: "mustard-yellow",
		colorHex: "#FFDB58",
		image: "node-32.png"
	}],
	defaultVariantIndex: 0,
	description: "Add a touch of elegance to your sofa with this plush velvet cushion."
}, {
	id: "kt001",
	name: "Wooden Building Blocks Set",
	price: 999,
	rating: 4.9,
	brand: "PlaySmart",
	category: ["kids", "toys", "educational"],
	tags: ["wooden", "montessori", "creative-play"],
	image: "node-32.png",
	variants: [{
		colorName: "natural",
		colorHex: "#DEB887",
		image: "node-32.png"
	}],
	defaultVariantIndex: 0,
	description: "Classic wooden building blocks to inspire creativity and learning in children."
}, {
	id: "fw003",
	name: "Hydrating Face Wash",
	price: 450,
	rating: 4.3,
	brand: "PureGlow",
	category: ["beauty", "self-care", "face", "face-wash"],
	tags: ["hydrating", "gentle"],
	image: "node-32.png",
	variants: [{
		colorName: "default",
		colorHex: "#ADD8E6",
		image: "node-32.png"
	}],
	defaultVariantIndex: 0,
	description: "Extra hydrating face wash for dry skin."
}, {
	id: "fs002",
	name: "Retinol Night Serum",
	price: 1200,
	rating: 4.9,
	brand: "VividHue",
	category: ["beauty", "self-care", "face", "face-serum"],
	tags: ["retinol", "anti-aging", "night-care"],
	image: "node-32.png",
	variants: [{
		colorName: "default",
		colorHex: "#E6E6FA",
		image: "node-32.png"
	}],
	defaultVariantIndex: 0,
	description: "Potent retinol serum for overnight skin renewal."
}, {
	id: "lp002",
	name: "Glossy Lip Tint",
	price: 600,
	rating: 4.1,
	brand: "LuxeLips",
	category: ["beauty", "makeup", "lips", "lipstick"],
	tags: ["glossy", "tint", "hydrating"],
	image: "node-32.png",
	variants: [{
		colorName: "cherry",
		colorHex: "#DE3163",
		image: "node-32.png"
	}, {
		colorName: "peach",
		colorHex: "#FFDAB9",
		image: "node-32.png"
	}],
	defaultVariantIndex: 0,
	description: "A beautiful glossy lip tint for a subtle pop of color."
}, ];
const siteData = {
	beauty: {
		name: "Beauty",
		subCategories: {
			selfCare: {
				name: "Self - Care",
				subCategories: {
					face: {
						name: "Face",
						items: ["Face Wash", "Face Serum", "Face Scrub", "Face Mask", "Face Ubtan"],
						image: "node-32.png"
					},
					hair: {
						name: "Hair",
						items: ["Shampoo", "Conditioner", "Hair Oil", "Hair Mask"],
						image: "node-32.png"
					},
					body: {
						name: "Body",
						items: ["Body Wash", "Body Lotion", "Body Scrub"],
						image: "node-32.png"
					},
					hands: {
						name: "Hands",
						items: ["Hand Cream", "Hand Wash", "Sanitizer"],
						image: "node-32.png"
					},
					feet: {
						name: "Feet",
						items: ["Foot Cream", "Foot Scrub", "Foot Soak"],
						image: "node-32.png"
					}
				},
				image: "node-32.png"
			},
			postCare: {
				name: "Post - Care",
				items: ["Soothing Balm", "Repair Cream"],
				image: "node-32.png"
			},
			makeup: {
				name: "Makeup",
				subCategories: {
					lips: {
						name: "Lips",
						items: ["Lipstick", "Lip Gloss", "Lip Liner"],
						image: "node-32.png"
					},
					eyes: {
						name: "Eyes",
						items: ["Mascara", "Eyeliner", "Eyeshadow"],
						image: "node-32.png"
					}
				},
				image: "node-32.png"
			}
		}
	},
	fashion: {
		name: "Fashion",
		subCategories: {
			womensWear: {
				name: "Women's Wear",
				items: ["Dresses", "Tops", "Jeans"],
				image: "node-32.png"
			},
			mensWear: {
				name: "Men's Wear",
				items: ["Shirts", "Trousers", "Jackets"],
				image: "node-32.png"
			}
		}
	},
	kids: {
		name: "Kids",
		subCategories: {
			toys: {
				name: "Toys",
				items: ["Educational", "Action Figures", "Dolls"],
				image: "node-32.png"
			},
			clothing: {
				name: "Clothing",
				items: ["Babywear", "Boys", "Girls"],
				image: "node-32.png"
			}
		}
	},
	home: {
		name: "Home",
		subCategories: {
			decor: {
				name: "Decor",
				items: ["Cushions", "Wall Art", "Vases"],
				image: "node-32.png"
			},
			kitchen: {
				name: "Kitchen",
				items: ["Cookware", "Tableware"],
				image: "node-32.png"
			}
		}
	}
};