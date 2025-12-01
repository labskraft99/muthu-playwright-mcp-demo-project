import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { HomePage, ProductCard } from '../pages/HomePage';
import { ExcelUtils, ProductTestData } from '../utils/ExcelUtils';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const EXCEL_FILE_PATH = process.env.EXCEL_FILE_PATH || './test-data/testdata.xlsx';

test.describe('Product Verification Tests', () => {
  let loginPage: LoginPage;
  let homePage: HomePage;
  let productTestData: ProductTestData[];
  let actualProducts: ProductCard[];

  test.beforeAll(async () => {
    // Read product test data from Excel file
    const excelFilePath = path.resolve(EXCEL_FILE_PATH);
    
    // Validate Excel file exists and has required sheets
    const isValidFile = ExcelUtils.validateExcelFile(excelFilePath, ['ProductData']);
    if (!isValidFile) {
      throw new Error(`Excel file validation failed: ${excelFilePath}`);
    }
    
    productTestData = ExcelUtils.readProductTestData(excelFilePath);
    console.log(`Loaded ${productTestData.length} product test cases from Excel`);
  });

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    homePage = new HomePage(page);
    
    // Login and navigate to home page
    await loginPage.navigateToLogin();
    await loginPage.loginWithValidCredentials();
    await homePage.verifyOnHomePage();
    
    // Get actual products from the page for comparison
    actualProducts = await homePage.getAllProductDetails();
  });

  test.afterEach(async () => {
    // Logout after each test
    try {
      await homePage.logout();
    } catch (error) {
      console.log('Logout failed or already logged out');
    }
  });

  test.describe('Product Card Element Verification', () => {
    test('Verify all product cards have required elements', async () => {
      await homePage.verifyAllProductCards();
      
      const productCards = await homePage.getProductCards();
      expect(productCards.length).toBeGreaterThan(0);
      
      for (const [index, card] of productCards.entries()) {
        await test.step(`Verify product card ${index + 1} elements`, async () => {
          await homePage.verifyProductCardElements(card);
        });
      }
    });

    test('Verify each product card has name, description, price, image, and button', async () => {
      for (const [index, product] of actualProducts.entries()) {
        await test.step(`Verify product ${index + 1}: ${product.name}`, async () => {
          // Verify product has all required fields
          expect(product.name, 'Product should have a name').toBeTruthy();
          expect(product.description, 'Product should have a description').toBeTruthy();
          expect(product.price, 'Product should have a price').toBeTruthy();
          expect(product.imageSrc, 'Product should have an image source').toBeTruthy();
          
          // Verify price format
          expect(product.price).toMatch(/^\$\d+\.\d{2}$/);
          
          // Verify image attributes
          expect(product.imageSrc).toContain('.jpg');
          expect(product.imageAlt).toBeTruthy();
        });
      }
    });

    test('Verify product images are accessible', async () => {
      for (const product of actualProducts) {
        await test.step(`Verify image accessibility for ${product.name}`, async () => {
          const productCard = homePage.page.locator('.inventory_item').filter({ hasText: product.name });
          const image = productCard.locator('img');
          
          // Verify image is visible
          await expect(image).toBeVisible();
          
          // Verify image has proper attributes
          await expect(image).toHaveAttribute('src', /.+/);
          await expect(image).toHaveAttribute('alt', /.+/);
        });
      }
    });

    test('Verify add to cart buttons are functional', async () => {
      for (const product of actualProducts) {
        await test.step(`Verify add to cart button for ${product.name}`, async () => {
          const productCard = homePage.page.locator('.inventory_item').filter({ hasText: product.name });
          const addToCartButton = productCard.locator('button[id^="add-to-cart"]');
          
          // Verify button is visible and enabled
          await expect(addToCartButton).toBeVisible();
          await expect(addToCartButton).toBeEnabled();
          await expect(addToCartButton).toHaveText('Add to cart');
          
          // Click button and verify it changes to "Remove"
          await addToCartButton.click();
          const removeButton = productCard.locator('button[id^="remove"]');
          await expect(removeButton).toBeVisible();
          await expect(removeButton).toHaveText('Remove');
          
          // Click remove to reset state
          await removeButton.click();
        });
      }
    });
  });

  test.describe('Excel Data Comparison Tests', () => {
    test('Verify Excel file contains expected product data', async () => {
      expect(productTestData).toBeDefined();
      expect(productTestData.length).toBeGreaterThan(0);
      
      // Verify each product in Excel has required fields
      productTestData.forEach((product, index) => {
        expect(product.productName, `Product ${index + 1} should have a name`).toBeTruthy();
        expect(product.description, `Product ${index + 1} should have a description`).toBeTruthy();
        expect(product.price, `Product ${index + 1} should have a price`).toBeTruthy();
        expect(product.imageFileName, `Product ${index + 1} should have an image filename`).toBeTruthy();
      });
    });

    test('Verify product count matches between page and Excel', async () => {
      console.log(`Products on page: ${actualProducts.length}`);
      console.log(`Products in Excel: ${productTestData.length}`);
      
      expect(actualProducts.length).toBe(productTestData.length);
    });

    test('Verify product names match Excel data', async () => {
      const pageProductNames = actualProducts.map(p => p.name).sort();
      const excelProductNames = productTestData.map(p => p.productName).sort();
      
      expect(pageProductNames).toEqual(excelProductNames);
    });

    test('Verify product prices match Excel data', async () => {
      for (const excelProduct of productTestData) {
        await test.step(`Verify price for ${excelProduct.productName}`, async () => {
          const actualProduct = actualProducts.find(p => p.name === excelProduct.productName);
          expect(actualProduct, `Product ${excelProduct.productName} should exist on page`).toBeDefined();
          
          if (actualProduct) {
            expect(actualProduct.price).toBe(excelProduct.price);
          }
        });
      }
    });

    test('Verify product descriptions match Excel data', async () => {
      for (const excelProduct of productTestData) {
        await test.step(`Verify description for ${excelProduct.productName}`, async () => {
          const actualProduct = actualProducts.find(p => p.name === excelProduct.productName);
          expect(actualProduct, `Product ${excelProduct.productName} should exist on page`).toBeDefined();
          
          if (actualProduct) {
            expect(actualProduct.description).toBe(excelProduct.description);
          }
        });
      }
    });

    test('Verify product images match Excel data', async () => {
      for (const excelProduct of productTestData) {
        await test.step(`Verify image for ${excelProduct.productName}`, async () => {
          const actualProduct = actualProducts.find(p => p.name === excelProduct.productName);
          expect(actualProduct, `Product ${excelProduct.productName} should exist on page`).toBeDefined();
          
          if (actualProduct) {
            // Verify image filename is contained in the image source
            expect(actualProduct.imageSrc).toContain(excelProduct.imageFileName);
            
            // Verify alt text matches product name
            expect(actualProduct.imageAlt).toContain(excelProduct.productName.toLowerCase().replace(/\s+/g, '-'));
          }
        });
      }
    });
  });

  test.describe('Product Data Integrity Tests', () => {
    test('Verify no duplicate products on page', async () => {
      const productNames = actualProducts.map(p => p.name);
      const uniqueNames = [...new Set(productNames)];
      
      expect(productNames.length).toBe(uniqueNames.length);
    });

    test('Verify price format consistency', async () => {
      for (const product of actualProducts) {
        await test.step(`Verify price format for ${product.name}`, async () => {
          // Price should be in format $XX.XX
          expect(product.price).toMatch(/^\$\d+\.\d{2}$/);
          
          // Price should be a valid number when $ is removed
          const priceNumber = parseFloat(product.price.replace('$', ''));
          expect(priceNumber).toBeGreaterThan(0);
        });
      }
    });

    test('Verify product names are not empty or just whitespace', async () => {
      for (const product of actualProducts) {
        expect(product.name.trim()).toBeTruthy();
        expect(product.name).not.toMatch(/^\s*$/);
      }
    });

    test('Verify product descriptions are meaningful', async () => {
      for (const product of actualProducts) {
        await test.step(`Verify description for ${product.name}`, async () => {
          expect(product.description.trim()).toBeTruthy();
          expect(product.description.length).toBeGreaterThan(10); // Description should be meaningful
        });
      }
    });

    test('Verify image sources are valid URLs', async () => {
      for (const product of actualProducts) {
        await test.step(`Verify image URL for ${product.name}`, async () => {
          expect(product.imageSrc).toBeTruthy();
          
          // Should contain image file extension
          expect(product.imageSrc).toMatch(/\.(jpg|jpeg|png|gif|webp)$/i);
        });
      }
    });
  });

  test.describe('Dynamic Product Verification', () => {
    test('Verify each product individually with Excel data', async () => {
      for (const excelProduct of productTestData) {
        await test.step(`Complete verification for ${excelProduct.productName}`, async () => {
          const actualProduct = actualProducts.find(p => p.name === excelProduct.productName);
          expect(actualProduct).toBeDefined();
          
          if (actualProduct) {
            // Verify all product details match
            expect(actualProduct.name).toBe(excelProduct.productName);
            expect(actualProduct.description).toBe(excelProduct.description);
            expect(actualProduct.price).toBe(excelProduct.price);
            expect(actualProduct.imageSrc).toContain(excelProduct.imageFileName);
            
            // Verify product card functionality
            await homePage.addProductToCartByName(excelProduct.productName);
            
            // Verify cart badge increases
            const cartCount = await homePage.getCartItemCount();
            expect(cartCount).toBeGreaterThan(0);
            
            // Remove from cart to reset state
            await homePage.removeProductFromCartByName(excelProduct.productName);
          }
        });
      }
    });

    test('Generate product comparison report', async () => {
      const comparisonResults = [];
      
      for (const excelProduct of productTestData) {
        const actualProduct = actualProducts.find(p => p.name === excelProduct.productName);
        
        const result = {
          productName: excelProduct.productName,
          found: !!actualProduct,
          nameMatch: actualProduct?.name === excelProduct.productName,
          priceMatch: actualProduct?.price === excelProduct.price,
          descriptionMatch: actualProduct?.description === excelProduct.description,
          imageMatch: actualProduct?.imageSrc?.includes(excelProduct.imageFileName)
        };
        
        comparisonResults.push(result);
      }
      
      console.log('Product Comparison Report:', JSON.stringify(comparisonResults, null, 2));
      
      // Verify all products passed validation
      const failedProducts = comparisonResults.filter(r => 
        !r.found || !r.nameMatch || !r.priceMatch || !r.descriptionMatch || !r.imageMatch
      );
      
      expect(failedProducts.length).toBe(0);
    });
  });
});