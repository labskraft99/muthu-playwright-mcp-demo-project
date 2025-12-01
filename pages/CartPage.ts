import { Page, Locator, expect } from '@playwright/test';

export interface CartItem {
  name: string;
  description: string;
  price: string;
  quantity: number;
}

export class CartPage {
  readonly page: Page;
  readonly cartContainer: Locator;
  readonly cartItems: Locator;
  readonly continueShoppingButton: Locator;
  readonly checkoutButton: Locator;
  readonly removeButtons: Locator;
  readonly cartBadge: Locator;
  readonly cartHeader: Locator;
  readonly cartQuantity: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartContainer = page.locator('.cart_contents_container');
    this.cartItems = page.locator('.cart_item');
    this.continueShoppingButton = page.locator('[data-test="continue-shopping"]');
    this.checkoutButton = page.locator('[data-test="checkout"]');
    this.removeButtons = page.locator('button[id^="remove-"]');
    this.cartBadge = page.locator('.shopping_cart_badge');
    this.cartHeader = page.locator('.title').filter({ hasText: 'Your Cart' });
    this.cartQuantity = page.locator('.cart_quantity');
  }

  /**
   * Verify user is on the cart page
   */
  async verifyOnCartPage(): Promise<void> {
    await expect(this.page).toHaveURL(/.*cart.html/);
    await expect(this.cartContainer).toBeVisible();
    await expect(this.cartHeader).toBeVisible();
  }

  /**
   * Get all cart items
   * @returns Promise<Locator[]> - Array of cart item locators
   */
  async getCartItems(): Promise<Locator[]> {
    return await this.cartItems.all();
  }

  /**
   * Get cart item details
   * @param cartItem - The cart item locator
   * @returns Promise<CartItem> - Cart item details object
   */
  async getCartItemDetails(cartItem: Locator): Promise<CartItem> {
    const name = await cartItem.locator('.inventory_item_name').textContent() || '';
    const description = await cartItem.locator('.inventory_item_desc').textContent() || '';
    const price = await cartItem.locator('.inventory_item_price').textContent() || '';
    const quantityText = await cartItem.locator('.cart_quantity').textContent() || '1';
    const quantity = parseInt(quantityText);

    return {
      name: name.trim(),
      description: description.trim(),
      price: price.trim(),
      quantity
    };
  }

  /**
   * Get all cart item details
   * @returns Promise<CartItem[]> - Array of all cart item details
   */
  async getAllCartItemDetails(): Promise<CartItem[]> {
    const items = await this.getCartItems();
    const cartItems: CartItem[] = [];

    for (const item of items) {
      const itemDetails = await this.getCartItemDetails(item);
      cartItems.push(itemDetails);
    }

    return cartItems;
  }

  /**
   * Verify cart contains expected products
   * @param expectedProductNames - Array of expected product names
   */
  async verifyCartContainsProducts(expectedProductNames: string[]): Promise<void> {
    const cartItems = await this.getAllCartItemDetails();
    const actualProductNames = cartItems.map(item => item.name);
    
    expect(cartItems.length).toBe(expectedProductNames.length);
    
    for (const expectedName of expectedProductNames) {
      expect(actualProductNames).toContain(expectedName);
    }
  }

  /**
   * Verify specific product is in cart
   * @param productName - Name of the product to verify
   */
  async verifyProductInCart(productName: string): Promise<void> {
    const cartItem = this.page.locator('.cart_item').filter({ hasText: productName });
    await expect(cartItem).toBeVisible();
  }

  /**
   * Remove product from cart by name
   * @param productName - Name of the product to remove
   */
  async removeProductFromCart(productName: string): Promise<void> {
    const cartItem = this.page.locator('.cart_item').filter({ hasText: productName });
    const removeButton = cartItem.locator('button[id^="remove-"]');
    await expect(removeButton).toBeVisible();
    await removeButton.click();
  }

  /**
   * Remove product from cart by index
   * @param index - Zero-based index of the product to remove
   */
  async removeProductFromCartByIndex(index: number): Promise<void> {
    const items = await this.getCartItems();
    if (index < 0 || index >= items.length) {
      throw new Error(`Invalid cart item index: ${index}. Available items: ${items.length}`);
    }
    
    const removeButton = items[index].locator('button[id^="remove-"]');
    await expect(removeButton).toBeVisible();
    await removeButton.click();
  }

  /**
   * Get cart items count
   * @returns Promise<number> - Number of items in cart
   */
  async getCartItemsCount(): Promise<number> {
    const items = await this.getCartItems();
    return items.length;
  }

  /**
   * Verify cart is empty
   */
  async verifyCartIsEmpty(): Promise<void> {
    const itemsCount = await this.getCartItemsCount();
    expect(itemsCount).toBe(0);
    
    // Verify cart badge is not visible when cart is empty
    await expect(this.cartBadge).not.toBeVisible();
  }

  /**
   * Verify cart badge shows correct count
   * @param expectedCount - Expected number of items in cart
   */
  async verifyCartBadgeCount(expectedCount: number): Promise<void> {
    if (expectedCount === 0) {
      await expect(this.cartBadge).not.toBeVisible();
    } else {
      await expect(this.cartBadge).toBeVisible();
      await expect(this.cartBadge).toHaveText(expectedCount.toString());
    }
  }

  /**
   * Continue shopping - navigate back to inventory page
   */
  async continueShopping(): Promise<void> {
    await expect(this.continueShoppingButton).toBeVisible();
    await this.continueShoppingButton.click();
  }

  /**
   * Proceed to checkout
   */
  async proceedToCheckout(): Promise<void> {
    await expect(this.checkoutButton).toBeVisible();
    await this.checkoutButton.click();
  }

  /**
   * Verify continue shopping button navigates to inventory page
   */
  async verifyContinueShoppingNavigation(): Promise<void> {
    await this.continueShopping();
    await expect(this.page).toHaveURL(/.*inventory.html/);
  }

  /**
   * Verify checkout button navigates to checkout page
   */
  async verifyCheckoutNavigation(): Promise<void> {
    await this.proceedToCheckout();
    await expect(this.page).toHaveURL(/.*checkout-step-one.html/);
  }

  /**
   * Verify cart item elements are visible
   * @param cartItem - The cart item locator
   */
  async verifyCartItemElements(cartItem: Locator): Promise<void> {
    await expect(cartItem.locator('.inventory_item_name')).toBeVisible();
    await expect(cartItem.locator('.inventory_item_desc')).toBeVisible();
    await expect(cartItem.locator('.inventory_item_price')).toBeVisible();
    await expect(cartItem.locator('.cart_quantity')).toBeVisible();
    await expect(cartItem.locator('button[id^="remove-"]')).toBeVisible();
  }

  /**
   * Verify all cart items have required elements
   */
  async verifyAllCartItemElements(): Promise<void> {
    const items = await this.getCartItems();
    
    for (const item of items) {
      await this.verifyCartItemElements(item);
    }
  }

  /**
   * Calculate total price of items in cart
   * @returns Promise<number> - Total price of all items
   */
  async calculateTotalPrice(): Promise<number> {
    const cartItems = await this.getAllCartItemDetails();
    let total = 0;
    
    for (const item of cartItems) {
      const price = parseFloat(item.price.replace('$', ''));
      total += price * item.quantity;
    }
    
    return total;
  }

  /**
   * Verify cart contains at least one item
   */
  async verifyCartHasItems(): Promise<void> {
    const itemsCount = await this.getCartItemsCount();
    expect(itemsCount).toBeGreaterThan(0);
  }

  /**
   * Get product names currently in cart
   * @returns Promise<string[]> - Array of product names in cart
   */
  async getProductNamesInCart(): Promise<string[]> {
    const cartItems = await this.getAllCartItemDetails();
    return cartItems.map(item => item.name);
  }

  /**
   * Verify specific number of items in cart
   * @param expectedCount - Expected number of items
   */
  async verifyCartItemCount(expectedCount: number): Promise<void> {
    const actualCount = await this.getCartItemsCount();
    expect(actualCount).toBe(expectedCount);
    
    // Also verify the badge count matches
    await this.verifyCartBadgeCount(expectedCount);
  }

  /**
   * Clear all items from cart
   */
  async clearCart(): Promise<void> {
    const items = await this.getCartItems();
    
    // Remove items one by one (removing from end to avoid index issues)
    for (let i = items.length - 1; i >= 0; i--) {
      await this.removeProductFromCartByIndex(i);
      // Wait a bit for the page to update
      await this.page.waitForTimeout(300);
    }
    
    await this.verifyCartIsEmpty();
  }
}