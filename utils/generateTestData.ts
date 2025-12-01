import * as XLSX from 'xlsx';
import * as path from 'path';

// Sample login test data
const loginTestData = [
  {
    testCase: 'Valid Login - Standard User',
    username: 'standard_user',
    password: 'secret_sauce',
    expectedResult: 'Success',
    expectedErrorMessage: ''
  },
  {
    testCase: 'Invalid Username',
    username: 'invalid_user',
    password: 'secret_sauce',
    expectedResult: 'Failure',
    expectedErrorMessage: 'Epic sadface: Username and password do not match any user in this service'
  },
  {
    testCase: 'Invalid Password',
    username: 'standard_user',
    password: 'invalid_password',
    expectedResult: 'Failure',
    expectedErrorMessage: 'Epic sadface: Username and password do not match any user in this service'
  },
  {
    testCase: 'Empty Username',
    username: '',
    password: 'secret_sauce',
    expectedResult: 'Failure',
    expectedErrorMessage: 'Epic sadface: Username is required'
  },
  {
    testCase: 'Empty Password',
    username: 'standard_user',
    password: '',
    expectedResult: 'Failure',
    expectedErrorMessage: 'Epic sadface: Password is required'
  },
  {
    testCase: 'Empty Credentials',
    username: '',
    password: '',
    expectedResult: 'Failure',
    expectedErrorMessage: 'Epic sadface: Username is required'
  },
  {
    testCase: 'Locked Out User',
    username: 'locked_out_user',
    password: 'secret_sauce',
    expectedResult: 'Failure',
    expectedErrorMessage: 'Epic sadface: Sorry, this user has been locked out.'
  }
];

// Sample product test data
const productTestData = [
  {
    productName: 'Sauce Labs Backpack',
    description: 'carry.allTheThings() with the sleek, streamlined Sly Pack that melds uncompromising style with unequaled laptop and tablet protection.',
    price: '$29.99',
    imageFileName: 'sauce-backpack-1200x1500.jpg',
    category: 'Accessories'
  },
  {
    productName: 'Sauce Labs Bike Light',
    description: 'A red light isn\'t the desired state in testing but it sure helps when riding your bike at night. Water-resistant with 3 lighting modes, 1 AAA battery included.',
    price: '$9.99',
    imageFileName: 'bike-light-1200x1500.jpg',
    category: 'Accessories'
  },
  {
    productName: 'Sauce Labs Bolt T-Shirt',
    description: 'Get your testing superhero on with the Sauce Labs bolt T-shirt. From American Apparel, 100% ringspun combed cotton, heather grey with red bolt.',
    price: '$15.99',
    imageFileName: 'bolt-shirt-1200x1500.jpg',
    category: 'Clothing'
  },
  {
    productName: 'Sauce Labs Fleece Jacket',
    description: 'It\'s not every day that you come across a midweight quarter-zip fleece jacket capable of handling everything from a relaxing day outdoors to a busy day at the office.',
    price: '$49.99',
    imageFileName: 'sauce-pullover-1200x1500.jpg',
    category: 'Clothing'
  },
  {
    productName: 'Sauce Labs Onesie',
    description: 'Rib snap infant onesie for the junior automation engineer in development. Reinforced 3-snap bottom closure, two-needle hemmed sleeved and bottom won\'t unravel.',
    price: '$7.99',
    imageFileName: 'red-onesie-1200x1500.jpg',
    category: 'Clothing'
  },
  {
    productName: 'Test.allTheThings() T-Shirt (Red)',
    description: 'This classic Sauce Labs t-shirt is perfect to wear when cozying up to your keyboard to automate a few tests. Super-soft and comfy ringspun combed cotton.',
    price: '$15.99',
    imageFileName: 'red-tatt-1200x1500.jpg',
    category: 'Clothing'
  }
];

// Sample user data for checkout
const userTestData = [
  {
    firstName: 'John',
    lastName: 'Doe',
    postalCode: '12345'
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    postalCode: '54321'
  },
  {
    firstName: 'Bob',
    lastName: 'Johnson',
    postalCode: '98765'
  }
];

function generateTestDataExcel(): void {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Create worksheets
  const loginWorksheet = XLSX.utils.json_to_sheet(loginTestData);
  const productWorksheet = XLSX.utils.json_to_sheet(productTestData);
  const userWorksheet = XLSX.utils.json_to_sheet(userTestData);
  
  // Add worksheets to workbook
  XLSX.utils.book_append_sheet(workbook, loginWorksheet, 'LoginData');
  XLSX.utils.book_append_sheet(workbook, productWorksheet, 'ProductData');
  XLSX.utils.book_append_sheet(workbook, userWorksheet, 'UserData');
  
  // Set column widths for better readability
  const columnWidths = [
    { wch: 30 }, // testCase/productName/firstName
    { wch: 20 }, // username/description/lastName
    { wch: 20 }, // password/price/postalCode
    { wch: 15 }, // expectedResult/imageFileName
    { wch: 60 }, // expectedErrorMessage/category
  ];
  
  loginWorksheet['!cols'] = columnWidths;
  productWorksheet['!cols'] = columnWidths;
  userWorksheet['!cols'] = columnWidths;
  
  // Write to file
  const filePath = path.join(__dirname, '../test-data/testdata.xlsx');
  XLSX.writeFile(workbook, filePath);
  
  console.log(`Test data Excel file generated: ${filePath}`);
}

// Run the function if this script is executed directly
if (require.main === module) {
  generateTestDataExcel();
}

export { generateTestDataExcel };