import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';
import * as path from 'path';

export interface LoginTestData {
  testCase: string;
  username: string;
  password: string;
  expectedResult: string;
  expectedErrorMessage?: string;
}

export interface ProductTestData {
  productName: string;
  description: string;
  price: string;
  imageFileName: string;
  category?: string;
}

export interface UserTestData {
  firstName: string;
  lastName: string;
  postalCode: string;
}

export class ExcelUtils {
  /**
   * Read Excel file and return workbook
   * @param filePath - Path to Excel file
   * @returns XLSX.WorkBook - The workbook object
   */
  static readExcelFile(filePath: string): XLSX.WorkBook {
    try {
      const fullPath = path.resolve(filePath);
      const fileBuffer = readFileSync(fullPath);
      return XLSX.read(fileBuffer, { type: 'buffer' });
    } catch (error) {
      throw new Error(`Failed to read Excel file: ${filePath}. Error: ${error}`);
    }
  }

  /**
   * Get worksheet from workbook
   * @param workbook - XLSX workbook
   * @param sheetName - Name of the worksheet
   * @returns XLSX.WorkSheet - The worksheet object
   */
  static getWorksheet(workbook: XLSX.WorkBook, sheetName: string): XLSX.WorkSheet {
    if (!workbook.Sheets[sheetName]) {
      const availableSheets = Object.keys(workbook.Sheets).join(', ');
      throw new Error(`Sheet '${sheetName}' not found. Available sheets: ${availableSheets}`);
    }
    return workbook.Sheets[sheetName];
  }

  /**
   * Convert worksheet to JSON
   * @param worksheet - XLSX worksheet
   * @returns any[] - Array of row objects
   */
  static worksheetToJson(worksheet: XLSX.WorkSheet): any[] {
    return XLSX.utils.sheet_to_json(worksheet);
  }

  /**
   * Read login test data from Excel file
   * @param filePath - Path to Excel file
   * @param sheetName - Sheet name containing login data (default: 'LoginData')
   * @returns LoginTestData[] - Array of login test data
   */
  static readLoginTestData(filePath: string, sheetName: string = 'LoginData'): LoginTestData[] {
    try {
      const workbook = this.readExcelFile(filePath);
      const worksheet = this.getWorksheet(workbook, sheetName);
      const rawData = this.worksheetToJson(worksheet);
      
      return rawData.map((row: any) => ({
        testCase: row.testCase || row.TestCase || '',
        username: row.username || row.Username || '',
        password: row.password || row.Password || '',
        expectedResult: row.expectedResult || row.ExpectedResult || '',
        expectedErrorMessage: row.expectedErrorMessage || row.ExpectedErrorMessage || undefined
      }));
    } catch (error) {
      throw new Error(`Failed to read login test data: ${error}`);
    }
  }

  /**
   * Read product test data from Excel file
   * @param filePath - Path to Excel file
   * @param sheetName - Sheet name containing product data (default: 'ProductData')
   * @returns ProductTestData[] - Array of product test data
   */
  static readProductTestData(filePath: string, sheetName: string = 'ProductData'): ProductTestData[] {
    try {
      const workbook = this.readExcelFile(filePath);
      const worksheet = this.getWorksheet(workbook, sheetName);
      const rawData = this.worksheetToJson(worksheet);
      
      return rawData.map((row: any) => ({
        productName: row.productName || row.ProductName || '',
        description: row.description || row.Description || '',
        price: row.price || row.Price || '',
        imageFileName: row.imageFileName || row.ImageFileName || '',
        category: row.category || row.Category || undefined
      }));
    } catch (error) {
      throw new Error(`Failed to read product test data: ${error}`);
    }
  }

  /**
   * Read user test data from Excel file
   * @param filePath - Path to Excel file
   * @param sheetName - Sheet name containing user data (default: 'UserData')
   * @returns UserTestData[] - Array of user test data
   */
  static readUserTestData(filePath: string, sheetName: string = 'UserData'): UserTestData[] {
    try {
      const workbook = this.readExcelFile(filePath);
      const worksheet = this.getWorksheet(workbook, sheetName);
      const rawData = this.worksheetToJson(worksheet);
      
      return rawData.map((row: any) => ({
        firstName: row.firstName || row.FirstName || '',
        lastName: row.lastName || row.LastName || '',
        postalCode: row.postalCode || row.PostalCode || ''
      }));
    } catch (error) {
      throw new Error(`Failed to read user test data: ${error}`);
    }
  }

  /**
   * Read data from any sheet with custom mapping
   * @param filePath - Path to Excel file
   * @param sheetName - Sheet name
   * @param columnMapping - Object mapping Excel columns to property names
   * @returns any[] - Array of mapped objects
   */
  static readCustomData(filePath: string, sheetName: string, columnMapping: Record<string, string>): any[] {
    try {
      const workbook = this.readExcelFile(filePath);
      const worksheet = this.getWorksheet(workbook, sheetName);
      const rawData = this.worksheetToJson(worksheet);
      
      return rawData.map((row: any) => {
        const mappedRow: any = {};
        Object.entries(columnMapping).forEach(([excelColumn, propertyName]) => {
          mappedRow[propertyName] = row[excelColumn] || '';
        });
        return mappedRow;
      });
    } catch (error) {
      throw new Error(`Failed to read custom data from sheet '${sheetName}': ${error}`);
    }
  }

  /**
   * Get all sheet names from Excel file
   * @param filePath - Path to Excel file
   * @returns string[] - Array of sheet names
   */
  static getSheetNames(filePath: string): string[] {
    try {
      const workbook = this.readExcelFile(filePath);
      return Object.keys(workbook.Sheets);
    } catch (error) {
      throw new Error(`Failed to get sheet names: ${error}`);
    }
  }

  /**
   * Validate Excel file exists and has expected sheets
   * @param filePath - Path to Excel file
   * @param expectedSheets - Array of expected sheet names
   * @returns boolean - True if file exists and has all expected sheets
   */
  static validateExcelFile(filePath: string, expectedSheets: string[] = []): boolean {
    try {
      const sheetNames = this.getSheetNames(filePath);
      
      for (const expectedSheet of expectedSheets) {
        if (!sheetNames.includes(expectedSheet)) {
          console.error(`Sheet '${expectedSheet}' not found in Excel file. Available sheets: ${sheetNames.join(', ')}`);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error(`Excel file validation failed: ${error}`);
      return false;
    }
  }

  /**
   * Filter test data by criteria
   * @param data - Array of test data objects
   * @param filterCriteria - Object with filter criteria
   * @returns any[] - Filtered array
   */
  static filterTestData(data: any[], filterCriteria: Record<string, any>): any[] {
    return data.filter(item => {
      return Object.entries(filterCriteria).every(([key, value]) => {
        return item[key] === value;
      });
    });
  }

  /**
   * Get environment-specific test data file path
   * @param baseFileName - Base file name (without environment prefix)
   * @param environment - Environment name (dev, staging, prod, etc.)
   * @returns string - Full file path
   */
  static getTestDataFilePath(baseFileName: string, environment: string = 'dev'): string {
    const testDataDir = process.env.TEST_DATA_DIR || './test-data';
    return path.join(testDataDir, `${environment}_${baseFileName}`);
  }
}