import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly logoImage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator('[data-test="username"]');
    this.passwordInput = page.locator('[data-test="password"]');
    this.loginButton = page.locator('[data-test="login-button"]');
    this.errorMessage = page.locator('[data-test="error"]');
    this.logoImage = page.locator('.login_logo');
  }

  /**
   * Navigate to the login page
   */
  async navigateToLogin(): Promise<void> {
    await this.page.goto('/');
    await expect(this.logoImage).toBeVisible();
  }

  /**
   * Perform login with provided credentials
   * @param username - Username for login
   * @param password - Password for login
   */
  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  /**
   * Login with valid credentials (standard_user)
   */
  async loginWithValidCredentials(): Promise<void> {
    const username = process.env.USERNAME || 'standard_user';
    const password = process.env.PASSWORD || 'secret_sauce';
    await this.login(username, password);
  }

  /**
   * Login with invalid username
   * @param invalidUsername - Invalid username to test
   * @param password - Valid password
   */
  async loginWithInvalidUsername(invalidUsername: string, password: string = 'secret_sauce'): Promise<void> {
    await this.login(invalidUsername, password);
  }

  /**
   * Login with invalid password
   * @param username - Valid username
   * @param invalidPassword - Invalid password to test
   */
  async loginWithInvalidPassword(username: string = 'standard_user', invalidPassword: string): Promise<void> {
    await this.login(username, invalidPassword);
  }

  /**
   * Login with both invalid credentials
   * @param invalidUsername - Invalid username
   * @param invalidPassword - Invalid password
   */
  async loginWithInvalidCredentials(invalidUsername: string, invalidPassword: string): Promise<void> {
    await this.login(invalidUsername, invalidPassword);
  }

  /**
   * Login with empty credentials
   */
  async loginWithEmptyCredentials(): Promise<void> {
    await this.login('', '');
  }

  /**
   * Verify login is successful by checking URL and inventory container
   */
  async verifySuccessfulLogin(): Promise<void> {
    await expect(this.page).toHaveURL(/.*inventory.html/);
    await expect(this.page.locator('.inventory_container')).toBeVisible();
  }

  /**
   * Verify login failed by checking error message
   * @param expectedErrorText - Expected error message text
   */
  async verifyLoginError(expectedErrorText?: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    if (expectedErrorText) {
      await expect(this.errorMessage).toContainText(expectedErrorText);
    }
  }

  /**
   * Get the current error message text
   * @returns Promise<string> - The error message text
   */
  async getErrorMessage(): Promise<string> {
    return await this.errorMessage.textContent() || '';
  }

  /**
   * Clear username field
   */
  async clearUsername(): Promise<void> {
    await this.usernameInput.clear();
  }

  /**
   * Clear password field
   */
  async clearPassword(): Promise<void> {
    await this.passwordInput.clear();
  }

  /**
   * Clear both username and password fields
   */
  async clearCredentials(): Promise<void> {
    await this.clearUsername();
    await this.clearPassword();
  }

  /**
   * Check if login button is enabled
   * @returns Promise<boolean> - True if button is enabled
   */
  async isLoginButtonEnabled(): Promise<boolean> {
    return await this.loginButton.isEnabled();
  }

  /**
   * Verify page elements are visible
   */
  async verifyPageElements(): Promise<void> {
    await expect(this.usernameInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
    await expect(this.logoImage).toBeVisible();
  }
}