import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

test.describe('Product Sorting Tests', () => {
  let loginPage: LoginPage;
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    homePage = new HomePage(page);
    
    // Login and navigate to home page
    await loginPage.navigateToLogin();
    await loginPage.loginWithValidCredentials();
    await homePage.verifyOnHomePage();
  });

  test.afterEach(async () => {
    // Logout after each test
    try {
      await homePage.logout();
    } catch (error) {
      console.log('Logout failed or already logged out');
    }
  });

  test.describe('Individual Sorting Options', () => {
    test('Sort products A to Z (Name ascending)', async () => {
      // Sort by name A-Z
      await homePage.sortProducts('az');
      
      // Verify sorting is applied correctly
      await homePage.verifySorting('az');
      
      // Get product names and verify they are sorted alphabetically
      const productNames = await homePage.getProductNamesInOrder();
      const sortedNames = [...productNames].sort();
      expect(productNames).toEqual(sortedNames);
      
      console.log('Products sorted A-Z:', productNames);
    });

    test('Sort products Z to A (Name descending)', async () => {
      // Sort by name Z-A
      await homePage.sortProducts('za');
      
      // Verify sorting is applied correctly
      await homePage.verifySorting('za');
      
      // Get product names and verify they are sorted reverse alphabetically
      const productNames = await homePage.getProductNamesInOrder();
      const sortedNames = [...productNames].sort().reverse();
      expect(productNames).toEqual(sortedNames);
      
      console.log('Products sorted Z-A:', productNames);
    });

    test('Sort products by price Low to High', async () => {
      // Sort by price low to high
      await homePage.sortProducts('lohi');
      
      // Verify sorting is applied correctly
      await homePage.verifySorting('lohi');
      
      // Get product prices and verify they are sorted ascending
      const productPrices = await homePage.getProductPricesInOrder();
      const sortedPrices = [...productPrices].sort((a, b) => a - b);
      expect(productPrices).toEqual(sortedPrices);
      
      console.log('Products sorted by price Low-High:', productPrices);
    });

    test('Sort products by price High to Low', async () => {
      // Sort by price high to low
      await homePage.sortProducts('hilo');
      
      // Verify sorting is applied correctly
      await homePage.verifySorting('hilo');
      
      // Get product prices and verify they are sorted descending
      const productPrices = await homePage.getProductPricesInOrder();
      const sortedPrices = [...productPrices].sort((a, b) => b - a);
      expect(productPrices).toEqual(sortedPrices);
      
      console.log('Products sorted by price High-Low:', productPrices);
    });
  });

  test.describe('Sorting State and Persistence', () => {
    test('Verify default sorting is Name A-Z', async () => {
      // Verify default sort option
      const currentSort = await homePage.getCurrentSortOption();
      expect(currentSort).toBe('az');
      
      // Verify products are sorted alphabetically by default
      const productNames = await homePage.getProductNamesInOrder();
      const sortedNames = [...productNames].sort();
      expect(productNames).toEqual(sortedNames);
    });

    test('Sort option persists after product interaction', async () => {
      // Set sorting to price high to low
      await homePage.sortProducts('hilo');
      
      // Add a product to cart
      await homePage.addProductToCartByIndex(0);
      
      // Verify sorting is still applied
      const currentSort = await homePage.getCurrentSortOption();
      expect(currentSort).toBe('hilo');
      await homePage.verifySorting('hilo');
      
      // Remove product from cart by getting the first product name
      const firstProduct = await homePage.getAllProductDetails();
      await homePage.removeProductFromCartByName(firstProduct[0].name);
      
      // Verify sorting is still applied
      expect(await homePage.getCurrentSortOption()).toBe('hilo');
    });

    test('Navigate to cart and back maintains sorting', async () => {
      // Set sorting to Z-A
      await homePage.sortProducts('za');
      
      // Add product and go to cart
      await homePage.addProductToCartByIndex(0);
      await homePage.goToCart();
      
      // Navigate back to inventory
      await homePage.page.goBack();
      
      // Verify sorting is maintained
      const currentSort = await homePage.getCurrentSortOption();
      expect(currentSort).toBe('za');
      await homePage.verifySorting('za');
    });
  });

  test.describe('Sequential Sorting Changes', () => {
    test('Switch between all four sorting options sequentially', async () => {
      const sortOptions: Array<'az' | 'za' | 'lohi' | 'hilo'> = ['az', 'za', 'lohi', 'hilo'];
      
      for (const sortOption of sortOptions) {
        await test.step(`Apply sorting: ${sortOption}`, async () => {
          // Apply sorting
          await homePage.sortProducts(sortOption);
          
          // Verify sort option is selected
          const currentSort = await homePage.getCurrentSortOption();
          expect(currentSort).toBe(sortOption);
          
          // Verify sorting is applied correctly
          await homePage.verifySorting(sortOption);
          
          // Log current state
          if (sortOption === 'az' || sortOption === 'za') {
            const names = await homePage.getProductNamesInOrder();
            console.log(`${sortOption.toUpperCase()} - Product names:`, names);
          } else {
            const prices = await homePage.getProductPricesInOrder();
            console.log(`${sortOption.toUpperCase()} - Product prices:`, prices);
          }
        });
      }
    });

    test('Rapid sorting changes', async () => {
      const sortSequence: Array<'az' | 'za' | 'lohi' | 'hilo'> = ['hilo', 'az', 'lohi', 'za'];
      
      for (const sortOption of sortSequence) {
        await homePage.sortProducts(sortOption);
        await homePage.page.waitForTimeout(500); // Brief wait for UI to update
        await homePage.verifySorting(sortOption);
      }
      
      // Verify final state
      const finalSort = await homePage.getCurrentSortOption();
      expect(finalSort).toBe('za');
    });
  });

  test.describe('Sorting Validation', () => {
    test('Verify sorting dropdown contains all expected options', async () => {
      const sortDropdown = homePage.productSortDropdown;
      
      // Get all options
      const options = await sortDropdown.locator('option').all();
      expect(options.length).toBe(4);
      
      // Verify option values exist
      const optionValues = [];
      for (const option of options) {
        const value = await option.getAttribute('value');
        optionValues.push(value);
      }
      
      expect(optionValues).toContain('az');
      expect(optionValues).toContain('za');
      expect(optionValues).toContain('lohi');
      expect(optionValues).toContain('hilo');
      
      console.log('Available sort options:', optionValues);
    });

    test('Verify product count remains same after sorting', async () => {
      // Get initial product count
      const initialProducts = await homePage.getProductCards();
      const initialCount = initialProducts.length;
      
      const sortOptions: Array<'az' | 'za' | 'lohi' | 'hilo'> = ['za', 'lohi', 'hilo', 'az'];
      
      for (const sortOption of sortOptions) {
        await homePage.sortProducts(sortOption);
        
        const currentProducts = await homePage.getProductCards();
        expect(currentProducts.length).toBe(initialCount);
      }
    });

    test('Verify product data integrity after sorting', async () => {
      // Get initial product details
      const initialProducts = await homePage.getAllProductDetails();
      const initialNames = initialProducts.map(p => p.name).sort();
      const initialPrices = initialProducts.map(p => p.price).sort();
      
      // Apply different sorting
      await homePage.sortProducts('hilo');
      
      // Get products after sorting
      const sortedProducts = await homePage.getAllProductDetails();
      const sortedNames = sortedProducts.map(p => p.name).sort();
      const sortedPrices = sortedProducts.map(p => p.price).sort();
      
      // Verify same products exist (just in different order)
      expect(sortedNames).toEqual(initialNames);
      expect(sortedPrices).toEqual(initialPrices);
    });
  });

  test.describe('Sorting Performance and UX', () => {
    test('Sorting change is reflected immediately', async () => {
      // Record initial state
      await homePage.sortProducts('az');
      const initialNames = await homePage.getProductNamesInOrder();
      
      // Change sorting
      await homePage.sortProducts('za');
      
      // Verify change happened
      const newNames = await homePage.getProductNamesInOrder();
      expect(newNames).not.toEqual(initialNames);
      expect(newNames).toEqual([...initialNames].reverse());
    });

    test('Sorting works with products in cart', async () => {
      // Add some products to cart
      await homePage.addProductToCartByIndex(0);
      await homePage.addProductToCartByIndex(1);
      
      // Verify cart has items
      const cartCount = await homePage.getCartItemCount();
      expect(cartCount).toBe(2);
      
      // Apply sorting
      await homePage.sortProducts('lohi');
      await homePage.verifySorting('lohi');
      
      // Verify cart count is maintained
      const newCartCount = await homePage.getCartItemCount();
      expect(newCartCount).toBe(2);
      
      // Verify cart items are preserved
      await homePage.goToCart();
      const cartPage = await import('../pages/CartPage');
      const cart = new cartPage.CartPage(homePage.page);
      await cart.verifyCartItemCount(2);
    });

    test('Multiple sorting operations in sequence', async () => {
      const operations = [
        { sort: 'lohi' as const, operation: 'Sort by price low-high' },
        { sort: 'za' as const, operation: 'Sort by name Z-A' },
        { sort: 'hilo' as const, operation: 'Sort by price high-low' },
        { sort: 'az' as const, operation: 'Sort by name A-Z' }
      ];

      for (const { sort, operation } of operations) {
        await test.step(operation, async () => {
          await homePage.sortProducts(sort);
          await homePage.verifySorting(sort);
          
          // Brief pause to simulate user interaction
          await homePage.page.waitForTimeout(200);
        });
      }
    });
  });
});