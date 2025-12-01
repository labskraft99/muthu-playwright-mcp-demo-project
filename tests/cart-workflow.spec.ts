import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';
import { CartPage } from '../pages/CartPage';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

test.describe('Cart Workflow Tests', () => {
  let loginPage: LoginPage;
  let homePage: HomePage;
  let cartPage: CartPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    homePage = new HomePage(page);
    cartPage = new CartPage(page);
    
    // Login and navigate to home page
    await loginPage.navigateToLogin();
    await loginPage.loginWithValidCredentials();
    await homePage.verifyOnHomePage();
  });

  test.afterEach(async () => {
    // Clean up: Try to clear cart and logout
    try {
      // If we're on cart page, clear it
      if (homePage.page.url().includes('cart.html')) {
        await cartPage.clearCart();
        await cartPage.continueShopping();
      } else {
        // If we're on home page, go to cart, clear it, then continue shopping
        const cartCount = await homePage.getCartItemCount();
        if (cartCount > 0) {
          await homePage.goToCart();
          await cartPage.clearCart();
          await cartPage.continueShopping();
        }
      }
      
      await homePage.logout();
    } catch (error) {
      console.log('Cleanup failed or already logged out');
    }
  });

  test.describe('Add Products to Cart', () => {
    test('Add two specific products to cart and verify', async () => {
      // Get all available products
      const allProducts = await homePage.getAllProductDetails();
      expect(allProducts.length).toBeGreaterThanOrEqual(2);
      
      // Select first two products
      const product1 = allProducts[0];
      const product2 = allProducts[1];
      
      console.log(`Adding products: ${product1.name} and ${product2.name}`);
      
      // Add first product to cart
      await homePage.addProductToCartByName(product1.name);
      await homePage.verifyCartBadgeCount(1);
      
      // Add second product to cart
      await homePage.addProductToCartByName(product2.name);
      await homePage.verifyCartBadgeCount(2);
      
      // Go to cart and verify both products are there
      await homePage.goToCart();
      await cartPage.verifyOnCartPage();
      
      // Verify cart contains both products
      await cartPage.verifyCartContainsProducts([product1.name, product2.name]);
      await cartPage.verifyCartItemCount(2);
    });

    test('Add products by index and verify cart badge updates', async () => {
      // Add first product
      await homePage.addProductToCartByIndex(0);
      await homePage.verifyCartBadgeCount(1);
      
      // Add second product
      await homePage.addProductToCartByIndex(1);
      await homePage.verifyCartBadgeCount(2);
      
      // Verify cart icon shows correct count
      const cartCount = await homePage.getCartItemCount();
      expect(cartCount).toBe(2);
    });

    test('Add multiple products and verify cart state', async () => {
      const productsToAdd = ['Sauce Labs Backpack', 'Sauce Labs Bike Light'];
      
      for (const [index, productName] of productsToAdd.entries()) {
        await test.step(`Add ${productName} to cart`, async () => {
          await homePage.addProductToCartByName(productName);
          await homePage.verifyCartBadgeCount(index + 1);
        });
      }
      
      // Go to cart and verify
      await homePage.goToCart();
      await cartPage.verifyCartContainsProducts(productsToAdd);
    });
  });

  test.describe('Cart Page Verification', () => {
    test('Verify cart displays correct product details', async () => {
      // Add two products to cart first
      const product1Name = 'Sauce Labs Backpack';
      const product2Name = 'Sauce Labs Bolt T-Shirt';
      
      await homePage.addProductToCartByName(product1Name);
      await homePage.addProductToCartByName(product2Name);
      
      // Go to cart
      await homePage.goToCart();
      await cartPage.verifyOnCartPage();
      
      // Get cart items and verify details
      const cartItems = await cartPage.getAllCartItemDetails();
      expect(cartItems.length).toBe(2);
      
      // Verify each cart item has required fields
      for (const item of cartItems) {
        expect(item.name).toBeTruthy();
        expect(item.description).toBeTruthy();
        expect(item.price).toBeTruthy();
        expect(item.quantity).toBeGreaterThan(0);
      }
      
      // Verify specific products are in cart
      await cartPage.verifyProductInCart(product1Name);
      await cartPage.verifyProductInCart(product2Name);
    });

    test('Verify cart item elements are visible and functional', async () => {
      // Add a product to cart
      await homePage.addProductToCartByIndex(0);
      await homePage.goToCart();
      
      // Verify cart page elements
      await cartPage.verifyOnCartPage();
      await cartPage.verifyAllCartItemElements();
      
      // Verify cart has items
      await cartPage.verifyCartHasItems();
    });

    test('Remove products from cart', async () => {
      const productName = 'Sauce Labs Fleece Jacket';
      
      // Add product and go to cart
      await homePage.addProductToCartByName(productName);
      await homePage.goToCart();
      
      // Verify product is in cart
      await cartPage.verifyProductInCart(productName);
      await cartPage.verifyCartItemCount(1);
      
      // Remove product from cart
      await cartPage.removeProductFromCart(productName);
      
      // Verify cart is empty
      await cartPage.verifyCartIsEmpty();
    });
  });

  test.describe('Continue Shopping Navigation', () => {
    test('Continue Shopping button navigates back to products page', async () => {
      // Add a product and go to cart
      await homePage.addProductToCartByIndex(0);
      await homePage.goToCart();
      await cartPage.verifyOnCartPage();
      
      // Click continue shopping
      await cartPage.continueShopping();
      
      // Verify we're back on the products page
      await homePage.verifyOnHomePage();
      await expect(homePage.page).toHaveURL(/.*inventory.html/);
      
      // Verify cart badge still shows 1 item
      await homePage.verifyCartBadgeCount(1);
    });

    test('Navigation preserves cart state', async () => {
      const product1 = 'Sauce Labs Backpack';
      const product2 = 'Sauce Labs Bike Light';
      
      // Add products to cart
      await homePage.addProductToCartByName(product1);
      await homePage.addProductToCartByName(product2);
      
      // Go to cart
      await homePage.goToCart();
      await cartPage.verifyCartItemCount(2);
      
      // Continue shopping
      await cartPage.continueShopping();
      await homePage.verifyOnHomePage();
      
      // Verify cart badge still shows 2 items
      await homePage.verifyCartBadgeCount(2);
      
      // Go back to cart and verify items are still there
      await homePage.goToCart();
      await cartPage.verifyCartContainsProducts([product1, product2]);
    });

    test('Multiple navigation cycles preserve cart', async () => {
      const productName = 'Test.allTheThings() T-Shirt (Red)';
      
      // Add product to cart
      await homePage.addProductToCartByName(productName);
      
      for (let i = 0; i < 3; i++) {
        await test.step(`Navigation cycle ${i + 1}`, async () => {
          // Go to cart
          await homePage.goToCart();
          await cartPage.verifyProductInCart(productName);
          
          // Continue shopping
          await cartPage.continueShopping();
          await homePage.verifyOnHomePage();
          await homePage.verifyCartBadgeCount(1);
        });
      }
    });
  });

  test.describe('Checkout Navigation', () => {
    test('Checkout button navigates to checkout info page', async () => {
      // Add products and go to cart
      await homePage.addProductToCartByIndex(0);
      await homePage.addProductToCartByIndex(1);
      await homePage.goToCart();
      
      // Verify we're on cart page with items
      await cartPage.verifyOnCartPage();
      await cartPage.verifyCartItemCount(2);
      
      // Click checkout
      await cartPage.proceedToCheckout();
      
      // Verify we're on checkout step one page
      await expect(cartPage.page).toHaveURL(/.*checkout-step-one.html/);
    });

    test('Checkout with empty cart should not be possible', async () => {
      // Go to cart without adding any products
      await homePage.goToCart();
      await cartPage.verifyCartIsEmpty();
      
      // Try to checkout (button might not be visible or enabled)
      const checkoutButton = cartPage.checkoutButton;
      
      // Checkout button should either be disabled or not visible
      try {
        await expect(checkoutButton).toBeDisabled();
      } catch {
        // If not disabled, it might not be visible
        await expect(checkoutButton).not.toBeVisible();
      }
    });

    test('Verify checkout navigation maintains cart data', async () => {
      const products = ['Sauce Labs Onesie', 'Sauce Labs Fleece Jacket'];
      
      // Add products to cart
      for (const product of products) {
        await homePage.addProductToCartByName(product);
      }
      
      // Go to cart and verify
      await homePage.goToCart();
      await cartPage.verifyCartContainsProducts(products);
      
      // Proceed to checkout
      await cartPage.proceedToCheckout();
      
      // Go back to cart (using browser back button)
      await cartPage.page.goBack();
      
      // Verify cart still contains the products
      await cartPage.verifyOnCartPage();
      await cartPage.verifyCartContainsProducts(products);
    });
  });

  test.describe('Complete Cart Workflow', () => {
    test('Full workflow: Add products → View cart → Continue shopping → Checkout', async () => {
      const product1 = 'Sauce Labs Backpack';
      const product2 = 'Sauce Labs Bolt T-Shirt';
      
      await test.step('Add two products to cart', async () => {
        await homePage.addProductToCartByName(product1);
        await homePage.addProductToCartByName(product2);
        await homePage.verifyCartBadgeCount(2);
      });
      
      await test.step('Navigate to cart and verify products', async () => {
        await homePage.goToCart();
        await cartPage.verifyOnCartPage();
        await cartPage.verifyCartContainsProducts([product1, product2]);
        await cartPage.verifyCartItemCount(2);
      });
      
      await test.step('Continue shopping and verify navigation', async () => {
        await cartPage.continueShopping();
        await homePage.verifyOnHomePage();
        await homePage.verifyCartBadgeCount(2);
      });
      
      await test.step('Return to cart and proceed to checkout', async () => {
        await homePage.goToCart();
        await cartPage.verifyCartContainsProducts([product1, product2]);
        await cartPage.proceedToCheckout();
        await expect(cartPage.page).toHaveURL(/.*checkout-step-one.html/);
      });
    });

    test('Cart workflow with product modifications', async () => {
      const initialProduct = 'Sauce Labs Backpack';
      const additionalProduct = 'Sauce Labs Bike Light';
      
      await test.step('Add initial product', async () => {
        await homePage.addProductToCartByName(initialProduct);
        await homePage.verifyCartBadgeCount(1);
      });
      
      await test.step('Go to cart and verify', async () => {
        await homePage.goToCart();
        await cartPage.verifyProductInCart(initialProduct);
      });
      
      await test.step('Continue shopping and add another product', async () => {
        await cartPage.continueShopping();
        await homePage.addProductToCartByName(additionalProduct);
        await homePage.verifyCartBadgeCount(2);
      });
      
      await test.step('Return to cart and remove first product', async () => {
        await homePage.goToCart();
        await cartPage.verifyCartContainsProducts([initialProduct, additionalProduct]);
        await cartPage.removeProductFromCart(initialProduct);
        await cartPage.verifyCartItemCount(1);
        await cartPage.verifyProductInCart(additionalProduct);
      });
      
      await test.step('Proceed to checkout with remaining product', async () => {
        await cartPage.proceedToCheckout();
        await expect(cartPage.page).toHaveURL(/.*checkout-step-one.html/);
      });
    });

    test('Comprehensive cart validation with all features', async () => {
      // Get all available products for testing
      const allProducts = await homePage.getAllProductDetails();
      const testProducts = allProducts.slice(0, 3); // Use first 3 products
      
      await test.step('Add multiple products and verify each addition', async () => {
        for (const [index, product] of testProducts.entries()) {
          await homePage.addProductToCartByName(product.name);
          await homePage.verifyCartBadgeCount(index + 1);
        }
      });
      
      await test.step('Verify cart contents and calculate total', async () => {
        await homePage.goToCart();
        const cartItems = await cartPage.getAllCartItemDetails();
        expect(cartItems.length).toBe(testProducts.length);
        
        const totalPrice = await cartPage.calculateTotalPrice();
        expect(totalPrice).toBeGreaterThan(0);
        
        console.log(`Cart total: $${totalPrice.toFixed(2)}`);
      });
      
      await test.step('Test continue shopping functionality', async () => {
        await cartPage.continueShopping();
        await homePage.verifyOnHomePage();
        await homePage.verifyCartBadgeCount(testProducts.length);
      });
      
      await test.step('Modify cart contents', async () => {
        await homePage.goToCart();
        
        // Remove one product
        await cartPage.removeProductFromCart(testProducts[0].name);
        await cartPage.verifyCartItemCount(testProducts.length - 1);
        
        // Verify remaining products
        const remainingProducts = testProducts.slice(1).map(p => p.name);
        await cartPage.verifyCartContainsProducts(remainingProducts);
      });
      
      await test.step('Final checkout navigation', async () => {
        await cartPage.verifyCartHasItems();
        await cartPage.proceedToCheckout();
        await expect(cartPage.page).toHaveURL(/.*checkout-step-one.html/);
      });
    });
  });
});