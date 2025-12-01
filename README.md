# Playwright Automation Framework for SauceDemo

This is a comprehensive Playwright TypeScript automation framework for testing the SauceDemo website (https://www.saucedemo.com/).

## 🚀 Features

- **Page Object Model (POM)** architecture for maintainable test code
- **Data-driven testing** using Excel files with XLSX library
- **Comprehensive test coverage** for login, products, sorting, and cart workflows
- **Environment configuration** using .env files
- **TypeScript** for type safety and better IDE support
- **Multiple browser support** (Chromium, Firefox, WebKit)
- **Parallel test execution** for faster feedback
- **Rich reporting** with HTML, JSON, and JUnit formats
- **Screenshots and videos** for failed tests
- **Trace collection** for debugging

## 📁 Project Structure

```
├── pages/                 # Page Object Model classes
│   ├── LoginPage.ts      # Login page interactions
│   ├── HomePage.ts       # Home/Inventory page interactions
│   └── CartPage.ts       # Shopping cart page interactions
├── tests/                # Test specification files
│   ├── login.spec.ts     # Login functionality tests
│   ├── products.spec.ts  # Product verification tests
│   ├── sorting.spec.ts   # Product sorting tests
│   └── cart-workflow.spec.ts # Cart workflow tests
├── utils/                # Utility functions
│   ├── ExcelUtils.ts     # Excel data reading utilities
│   └── generateTestData.ts # Test data generation script
├── test-data/            # Test data files
│   └── testdata.xlsx     # Excel file with test data
├── .env                  # Environment variables
├── playwright.config.ts  # Playwright configuration
├── package.json          # Project dependencies
└── tsconfig.json         # TypeScript configuration
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install Playwright browsers:**
   ```bash
   npx playwright install
   ```

3. **Generate test data (optional - already included):**
   ```bash
   npx ts-node utils/generateTestData.ts
   ```

## 🔧 Configuration

### Environment Variables (.env)

```env
BASE_URL=https://www.saucedemo.com
USERNAME=standard_user
PASSWORD=secret_sauce
EXCEL_FILE_PATH=./test-data/testdata.xlsx
```

### Browser Configuration

The framework supports multiple browsers configured in `playwright.config.ts`:
- Chromium (Desktop Chrome)
- Firefox
- WebKit (Safari)
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)
- Microsoft Edge
- Google Chrome

## 🧪 Running Tests

### Run all tests
```bash
npm test
```

### Run tests in headed mode (visible browser)
```bash
npm run test:headed
```

### Run tests with UI mode
```bash
npm run test:ui
```

### Run specific test file
```bash
npx playwright test login.spec.ts
```

### Run tests in specific browser
```bash
npx playwright test --project=chromium
```

### Debug tests
```bash
npm run test:debug
```

### View test report
```bash
npm run report
```

## 📊 Test Data Management

### Excel Test Data Structure

The framework uses Excel files for data-driven testing with the following sheets:

#### LoginData Sheet
| testCase | username | password | expectedResult | expectedErrorMessage |
|----------|----------|----------|----------------|---------------------|
| Valid Login - Standard User | standard_user | secret_sauce | Success | |
| Invalid Username | invalid_user | secret_sauce | Failure | Username and password do not match |

#### ProductData Sheet
| productName | description | price | imageFileName | category |
|-------------|-------------|-------|---------------|----------|
| Sauce Labs Backpack | carry.allTheThings()... | $29.99 | sauce-backpack-1200x1500.jpg | Accessories |

#### UserData Sheet
| firstName | lastName | postalCode |
|-----------|----------|------------|
| John | Doe | 12345 |

### Creating Custom Test Data

1. Modify `utils/generateTestData.ts`
2. Run the generation script:
   ```bash
   npx ts-node utils/generateTestData.ts
   ```

## 🔍 Page Object Model

### LoginPage.ts
- `navigateToLogin()` - Navigate to login page
- `loginWithValidCredentials()` - Login with env credentials
- `loginWithInvalidCredentials()` - Test invalid login scenarios
- `verifySuccessfulLogin()` - Verify successful login
- `verifyLoginError()` - Verify login error messages

### HomePage.ts
- `verifyOnHomePage()` - Verify we're on inventory page
- `getAllProductDetails()` - Get all product information
- `addProductToCartByName()` - Add specific product to cart
- `sortProducts()` - Apply sorting (az, za, lohi, hilo)
- `verifySorting()` - Verify sorting is correct
- `verifyCartBadgeCount()` - Verify cart badge shows correct count

### CartPage.ts
- `verifyOnCartPage()` - Verify we're on cart page
- `getAllCartItemDetails()` - Get cart items information
- `verifyCartContainsProducts()` - Verify specific products in cart
- `continueShopping()` - Navigate back to products
- `proceedToCheckout()` - Navigate to checkout
- `removeProductFromCart()` - Remove product from cart

## 🎯 Test Coverage

### Login Tests (`login.spec.ts`)
- ✅ Valid login with standard user
- ✅ Invalid username/password combinations
- ✅ Empty field validations
- ✅ Locked out user scenarios
- ✅ Data-driven tests from Excel

### Product Tests (`products.spec.ts`)
- ✅ Product card element verification
- ✅ Product data validation against Excel
- ✅ Image accessibility testing
- ✅ Add to cart functionality
- ✅ Product data integrity checks

### Sorting Tests (`sorting.spec.ts`)
- ✅ Name sorting (A-Z, Z-A)
- ✅ Price sorting (Low-High, High-Low)
- ✅ Sorting state persistence
- ✅ Sequential sorting changes
- ✅ Sorting performance validation

### Cart Workflow Tests (`cart-workflow.spec.ts`)
- ✅ Add multiple products to cart
- ✅ Cart badge count verification
- ✅ Continue shopping navigation
- ✅ Checkout navigation
- ✅ Cart item removal
- ✅ Complete cart workflow scenarios

## 📈 Reporting

The framework generates multiple report formats:

1. **HTML Report** - Interactive report with screenshots
2. **JSON Report** - Machine-readable test results
3. **JUnit Report** - For CI/CD integration
4. **Screenshots** - Captured on test failures
5. **Videos** - Recorded for failed tests
6. **Traces** - Detailed execution traces for debugging

## 🔧 Troubleshooting

### Common Issues

1. **Browser not installed**
   ```bash
   npx playwright install
   ```

2. **Excel file not found**
   - Verify the path in `.env` file
   - Run the test data generation script

3. **Login failures**
   - Check credentials in `.env` file
   - Verify SauceDemo website is accessible

4. **Timeout errors**
   - Increase timeout in `playwright.config.ts`
   - Check network connectivity

### Debug Mode

Run tests in debug mode to step through execution:
```bash
npx playwright test --debug
```

## 🚀 CI/CD Integration

The framework is ready for CI/CD integration with:
- GitHub Actions
- Jenkins
- Azure DevOps
- GitLab CI

Example GitHub Actions workflow:
```yaml
- name: Run Playwright Tests
  run: |
    npm ci
    npx playwright install --with-deps
    npm test
```

## 📝 Best Practices

1. **Page Objects** - Keep page-specific logic in page object classes
2. **Data-Driven** - Use Excel files for test data management
3. **Environment Variables** - Store sensitive data in .env files
4. **Assertions** - Use meaningful assertion messages
5. **Error Handling** - Implement proper error handling and cleanup
6. **Parallel Execution** - Leverage Playwright's parallel testing capabilities
7. **Reporting** - Generate comprehensive reports for test results

## 🤝 Contributing

1. Follow the existing code structure and patterns
2. Add appropriate test coverage for new features
3. Update documentation for any changes
4. Ensure all tests pass before submitting changes

## 📄 License

This project is licensed under the MIT License.