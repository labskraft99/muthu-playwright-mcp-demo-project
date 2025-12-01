import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';
import { ExcelUtils, LoginTestData } from '../utils/ExcelUtils';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const EXCEL_FILE_PATH = process.env.EXCEL_FILE_PATH || './test-data/testdata.xlsx';

test.describe('Login Feature Tests', () => {
  let loginPage: LoginPage;
  let homePage: HomePage;
  let loginTestData: LoginTestData[];

  test.beforeAll(async () => {
    // Read login test data from Excel file
    const excelFilePath = path.resolve(EXCEL_FILE_PATH);
    
    // Validate Excel file exists and has required sheets
    const isValidFile = ExcelUtils.validateExcelFile(excelFilePath, ['LoginData']);
    if (!isValidFile) {
      throw new Error(`Excel file validation failed: ${excelFilePath}`);
    }
    
    loginTestData = ExcelUtils.readLoginTestData(excelFilePath);
    console.log(`Loaded ${loginTestData.length} login test cases from Excel`);
  });

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    homePage = new HomePage(page);
    await loginPage.navigateToLogin();
  });

  test('Verify login page elements are visible', async () => {
    await loginPage.verifyPageElements();
  });

  // Data-driven tests using Excel data
  for (let i = 0; i < 10; i++) { // We'll iterate through test data in the actual test
    test(`Login Test Case ${i + 1}`, async () => {
      // Skip if no test data available for this index
      if (!loginTestData || i >= loginTestData.length) {
        test.skip(true, `No test data available for index ${i}`);
        return;
      }

      const testData = loginTestData[i];
      console.log(`Executing: ${testData.testCase}`);

      // Clear any existing values
      await loginPage.clearCredentials();
      
      // Perform login with test data
      await loginPage.login(testData.username, testData.password);

      if (testData.expectedResult === 'Success') {
        // Verify successful login
        await homePage.verifyOnHomePage();
        await loginPage.verifySuccessfulLogin();
        
        // Logout after successful login
        await homePage.logout();
        await expect(loginPage.page).toHaveURL(/.*\/$/);
      } else {
        // Verify login failure
        await loginPage.verifyLoginError();
        
        if (testData.expectedErrorMessage) {
          const actualErrorMessage = await loginPage.getErrorMessage();
          expect(actualErrorMessage).toContain(testData.expectedErrorMessage);
        }
        
        // Verify we're still on login page
        await expect(loginPage.page).toHaveURL(/.*\/$/);
      }
    });
  }

  test.describe('Specific Login Scenarios', () => {
    test('Valid login with standard user', async () => {
      await loginPage.loginWithValidCredentials();
      await homePage.verifyOnHomePage();
      await loginPage.verifySuccessfulLogin();
    });

    test('Invalid username with valid password', async () => {
      await loginPage.loginWithInvalidUsername('invalid_user');
      await loginPage.verifyLoginError('Username and password do not match');
    });

    test('Valid username with invalid password', async () => {
      await loginPage.loginWithInvalidPassword('standard_user', 'invalid_password');
      await loginPage.verifyLoginError('Username and password do not match');
    });

    test('Empty username', async () => {
      await loginPage.login('', 'secret_sauce');
      await loginPage.verifyLoginError('Username is required');
    });

    test('Empty password', async () => {
      await loginPage.login('standard_user', '');
      await loginPage.verifyLoginError('Password is required');
    });

    test('Empty credentials', async () => {
      await loginPage.loginWithEmptyCredentials();
      await loginPage.verifyLoginError('Username is required');
    });

    test('Locked out user', async () => {
      await loginPage.login('locked_out_user', 'secret_sauce');
      await loginPage.verifyLoginError('Sorry, this user has been locked out');
    });

    test('Problem user login', async () => {
      await loginPage.login('problem_user', 'secret_sauce');
      await homePage.verifyOnHomePage();
    });

    test('Performance glitch user login', async () => {
      await loginPage.login('performance_glitch_user', 'secret_sauce');
      await homePage.verifyOnHomePage();
    });

    test('Visual user login', async () => {
      await loginPage.login('visual_user', 'secret_sauce');
      await homePage.verifyOnHomePage();
    });
  });

  test.describe('Login Form Validation', () => {
    test('Login button is enabled by default', async () => {
      const isEnabled = await loginPage.isLoginButtonEnabled();
      expect(isEnabled).toBe(true);
    });

    test('Clear credentials functionality', async () => {
      // Fill in some data
      await loginPage.login('test_user', 'test_password');
      
      // Clear and verify
      await loginPage.clearCredentials();
      
      // Verify fields are empty
      const usernameValue = await loginPage.usernameInput.inputValue();
      const passwordValue = await loginPage.passwordInput.inputValue();
      
      expect(usernameValue).toBe('');
      expect(passwordValue).toBe('');
    });

    test('Multiple failed login attempts', async () => {
      const invalidCredentials = [
        { username: 'user1', password: 'wrong1' },
        { username: 'user2', password: 'wrong2' },
        { username: 'user3', password: 'wrong3' }
      ];

      for (const creds of invalidCredentials) {
        await loginPage.clearCredentials();
        await loginPage.login(creds.username, creds.password);
        await loginPage.verifyLoginError();
      }
    });
  });

  test.describe('Excel Data Validation Tests', () => {
    test('Verify Excel file contains required test data', async () => {
      expect(loginTestData).toBeDefined();
      expect(loginTestData.length).toBeGreaterThan(0);
      
      // Verify each test case has required fields
      loginTestData.forEach((testData, index) => {
        expect(testData.testCase, `Test case ${index + 1} should have a testCase`).toBeTruthy();
        expect(testData.expectedResult, `Test case ${index + 1} should have expectedResult`).toBeTruthy();
        // Note: username and password can be empty for negative test cases
      });
    });

    test('Verify test data coverage', async () => {
      const successCases = loginTestData.filter(data => data.expectedResult === 'Success');
      const failureCases = loginTestData.filter(data => data.expectedResult === 'Failure');
      
      expect(successCases.length, 'Should have at least one success case').toBeGreaterThan(0);
      expect(failureCases.length, 'Should have at least one failure case').toBeGreaterThan(0);
      
      console.log(`Success cases: ${successCases.length}, Failure cases: ${failureCases.length}`);
    });

    test('Execute all Excel test cases dynamically', async () => {
      for (const testData of loginTestData) {
        console.log(`Executing: ${testData.testCase}`);
        
        await test.step(testData.testCase, async () => {
          // Navigate to login page for each test
          await loginPage.navigateToLogin();
          await loginPage.clearCredentials();
          
          // Perform login
          await loginPage.login(testData.username, testData.password);
          
          if (testData.expectedResult === 'Success') {
            await homePage.verifyOnHomePage();
            // Logout after successful login
            await homePage.logout();
          } else {
            await loginPage.verifyLoginError();
            if (testData.expectedErrorMessage) {
              const actualError = await loginPage.getErrorMessage();
              expect(actualError).toContain(testData.expectedErrorMessage);
            }
          }
        });
      }
    });
  });
});