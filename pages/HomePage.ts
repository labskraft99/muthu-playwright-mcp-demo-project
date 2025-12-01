import { Page, Locator, expect } from '@playwright/test';

export interface ProductCard {
  name: string;
  description: string;
  price: string;
  imageSrc: string;
  imageAlt: string;
}

export class HomePage {
  readonly page: Page;
  readonly inventoryContainer: Locator;
  readonly productSortDropdown: Locator;
  readonly productCards: Locator;
  readonly shoppingCartLink: Locator;
  readonly shoppingCartBadge: Locator;
  readonly menuButton: Locator;
  readonly appLogo: Locator;

  constructor(page: Page) {
    this.page = page;
    this.inventoryContainer = page.locator('.inventory_container');
    this.productSortDropdown = page.locator('[data-test="product_sort_container"]');
    this.productCards = page.locator('.inventory_item');
    this.shoppingCartLink = page.locator('.shopping_cart_link');
    this.shoppingCartBadge = page.locator('.shopping_cart_badge');
    this.menuButton = page.locator('#react-burger-menu-btn');
    this.appLogo = page.locator('.app_logo');
  }

  /**
   * Verify user is on the home/inventory page
   */
  async verifyOnHomePage(): Promise<void> {
    await expect(this.page).toHaveURL(/.*inventory.html/);
    await expect(this.inventoryContainer).toBeVisible();
    await expect(this.appLogo).toBeVisible();
  }

  /**
   * Get all product cards
   * @returns Promise<Locator[]> - Array of product card locators
   */
  async getProductCards(): Promise<Locator[]> {
    const cards = await this.productCards.all();
    return cards;
  }

  /**
   * Get product details from a product card
   * @param productCard - The product card locator
   * @returns Promise<ProductCard> - Product details object
   */
  async getProductDetails(productCard: Locator): Promise<ProductCard> {
    const name = await productCard.locator('.inventory_item_name').textContent() || '';
    const description = await productCard.locator('.inventory_item_desc').textContent() || '';
    const price = await productCard.locator('.inventory_item_price').textContent() || '';
    const image = productCard.locator('.inventory_item_img img');
    const imageSrc = await image.getAttribute('src') || '';
    const imageAlt = await image.getAttribute('alt') || '';

    return {
      name: name.trim(),
      description: description.trim(),
      price: price.trim(),
      imageSrc,
      imageAlt
    };
  }

  /**
   * Get all product details from the page
   * @returns Promise<ProductCard[]> - Array of all product details
   */
  async getAllProductDetails(): Promise<ProductCard[]> {
    const cards = await this.getProductCards();
    const products: ProductCard[] = [];

    for (const card of cards) {
      const productDetails = await this.getProductDetails(card);
      products.push(productDetails);
    }

    return products;
  }

  /**
   * Add a product to cart by product name
   * @param productName - Name of the product to add
   */
  async addProductToCartByName(productName: string): Promise<void> {
    const productCard = this.page.locator('.inventory_item').filter({ hasText: productName });
    const addToCartButton = productCard.locator('button[id^="add-to-cart"]');
    await expect(addToCartButton).toBeVisible();
    await addToCartButton.click();
  }

  /**
   * Add a product to cart by index
   * @param index - Zero-based index of the product to add
   */
  async addProductToCartByIndex(index: number): Promise<void> {
    const productCards = await this.getProductCards();
    if (index < 0 || index >= productCards.length) {
      throw new Error(`Invalid product index: ${index}. Available products: ${productCards.length}`);
    }
    
    const addToCartButton = productCards[index].locator('button[id^="add-to-cart"]');
    await expect(addToCartButton).toBeVisible();
    await addToCartButton.click();
  }

  /**
   * Remove a product from cart by product name
   * @param productName - Name of the product to remove
   */
  async removeProductFromCartByName(productName: string): Promise<void> {
    const productCard = this.page.locator('.inventory_item').filter({ hasText: productName });
    const removeButton = productCard.locator('button[id^="remove"]');
    await expect(removeButton).toBeVisible();
    await removeButton.click();
  }

  /**
   * Verify product card elements are visible
   * @param productCard - The product card locator
   */
  async verifyProductCardElements(productCard: Locator): Promise<void> {
    await expect(productCard.locator('.inventory_item_name')).toBeVisible();
    await expect(productCard.locator('.inventory_item_desc')).toBeVisible();
    await expect(productCard.locator('.inventory_item_price')).toBeVisible();
    await expect(productCard.locator('.inventory_item_img img')).toBeVisible();
    await expect(productCard.locator('button[id^="add-to-cart"], button[id^="remove"]')).toBeVisible();
  }

  /**
   * Verify all product cards have required elements
   */
  async verifyAllProductCards(): Promise<void> {
    const cards = await this.getProductCards();
    expect(cards.length).toBeGreaterThan(0);
    
    for (const card of cards) {
      await this.verifyProductCardElements(card);
    }
  }

  /**
   * Sort products by option
   * @param sortOption - Sort option ('az', 'za', 'lohi', 'hilo')
   */
  async sortProducts(sortOption: 'az' | 'za' | 'lohi' | 'hilo'): Promise<void> {
    await this.productSortDropdown.selectOption(sortOption);
    // Wait for the page to re-render after sorting
    await this.page.waitForTimeout(500);
  }

  /**
   * Get current sorting option
   * @returns Promise<string> - Current sort option value
   */
  async getCurrentSortOption(): Promise<string> {
    return await this.productSortDropdown.inputValue();
  }

  /**
   * Get product names in current order
   * @returns Promise<string[]> - Array of product names in display order
   */
  async getProductNamesInOrder(): Promise<string[]> {
    const cards = await this.getProductCards();
    const names: string[] = [];
    
    for (const card of cards) {
      const name = await card.locator('.inventory_item_name').textContent();
      if (name) names.push(name.trim());
    }
    
    return names;
  }

  /**
   * Get product prices in current order
   * @returns Promise<number[]> - Array of product prices in display order
   */
  async getProductPricesInOrder(): Promise<number[]> {
    const cards = await this.getProductCards();
    const prices: number[] = [];
    
    for (const card of cards) {
      const priceText = await card.locator('.inventory_item_price').textContent();
      if (priceText) {
        // Remove $ sign and convert to number
        const price = parseFloat(priceText.replace('$', ''));
        prices.push(price);
      }
    }
    
    return prices;
  }

  /**
   * Verify sorting is correct
   * @param sortOption - Expected sort option
   */
  async verifySorting(sortOption: 'az' | 'za' | 'lohi' | 'hilo'): Promise<void> {
    const currentSort = await this.getCurrentSortOption();
    expect(currentSort).toBe(sortOption);

    switch (sortOption) {
      case 'az': {
        const names = await this.getProductNamesInOrder();
        const sortedNames = [...names].sort();
        expect(names).toEqual(sortedNames);
        break;
      }
      case 'za': {
        const names = await this.getProductNamesInOrder();
        const sortedNames = [...names].sort().reverse();
        expect(names).toEqual(sortedNames);
        break;
      }
      case 'lohi': {
        const prices = await this.getProductPricesInOrder();
        const sortedPrices = [...prices].sort((a, b) => a - b);
        expect(prices).toEqual(sortedPrices);
        break;
      }
      case 'hilo': {
        const prices = await this.getProductPricesInOrder();
        const sortedPrices = [...prices].sort((a, b) => b - a);
        expect(prices).toEqual(sortedPrices);
        break;
      }
    }
  }

  /**
   * Navigate to shopping cart
   */
  async goToCart(): Promise<void> {
    await this.shoppingCartLink.click();
  }

  /**
   * Get shopping cart badge count
   * @returns Promise<number> - Number of items in cart (0 if no badge visible)
   */
  async getCartItemCount(): Promise<number> {
    if (await this.shoppingCartBadge.isVisible()) {
      const badgeText = await this.shoppingCartBadge.textContent();
      return parseInt(badgeText || '0');
    }
    return 0;
  }

  /**
   * Verify cart badge shows correct count
   * @param expectedCount - Expected number of items in cart
   */
  async verifyCartBadgeCount(expectedCount: number): Promise<void> {
    if (expectedCount === 0) {
      await expect(this.shoppingCartBadge).not.toBeVisible();
    } else {
      await expect(this.shoppingCartBadge).toBeVisible();
      await expect(this.shoppingCartBadge).toHaveText(expectedCount.toString());
    }
  }

  /**
   * Open burger menu
   */
  async openMenu(): Promise<void> {
    await this.menuButton.click();
  }

  /**
   * Logout from the application
   */
  async logout(): Promise<void> {
    await this.openMenu();
    await this.page.locator('#logout_sidebar_link').click();
  }
}