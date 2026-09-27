import type { Locator, Page } from '@playwright/test';

/** Admin › Users at `/admin/users`: the add form and the user table. */
export class AdminUsersPage {
  readonly name: Locator;
  readonly email: Locator;
  readonly role: Locator;
  readonly addUser: Locator;
  readonly message: Locator;
  readonly rows: Locator;

  constructor(private readonly page: Page) {
    this.name = page.getByLabel('Name', { exact: true });
    this.email = page.getByLabel('Email', { exact: true });
    this.role = page.getByLabel('Role', { exact: true });
    this.addUser = page.getByRole('button', { name: 'Add user' });
    this.message = page.getByRole('status');
    this.rows = page.getByRole('table', { name: 'Users' }).getByRole('row').filter({ has: page.getByRole('cell') });
  }

  async goto(): Promise<void> {
    await this.page.goto('/admin/users');
  }

  /** The table row for one user. */
  row(name: string): Locator {
    return this.rows.filter({ has: this.page.getByRole('cell', { name, exact: true }) });
  }

  /**
   * Clicks Delete for a user and answers the browser confirmation.
   * Returns the confirmation's text so the test can check what was asked.
   */
  async deleteUser(name: string, { confirm }: { confirm: boolean }): Promise<string> {
    const dialogShown = this.page.waitForEvent('dialog');
    // The click only settles once the dialog is answered, so it is awaited after the dialog.
    const clicked = this.page.getByRole('button', { name: `Delete ${name}`, exact: true }).click();
    const dialog = await dialogShown;
    const question = dialog.message();
    await (confirm ? dialog.accept() : dialog.dismiss());
    await clicked;
    return question;
  }
}
