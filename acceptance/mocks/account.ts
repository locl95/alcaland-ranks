import { Page } from '@playwright/test';

// JWT with payload {"username":"testuser"} — signature is irrelevant for the frontend
export const TEST_ACCESS_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3R1c2VyIn0.test-sig';
export const TEST_REFRESH_TOKEN = 'test-refresh-token';

const API = 'http://localhost:8080/api';

export async function seedAuth(page: Page) {
  await page.addInitScript(
    ({ refresh }) => {
      localStorage.setItem('auth.refreshToken', refresh);
    },
    { refresh: TEST_REFRESH_TOKEN },
  );

  await page.route(`${API}/auth/refresh`, (route) =>
    route.fulfill({ json: { accessToken: TEST_ACCESS_TOKEN } }),
  );
}
