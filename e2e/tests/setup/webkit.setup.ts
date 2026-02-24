import { WEBKIT_AUTH_FILE } from "../../playwright.config";
import { setupAuth } from "./auth.setup";

setupAuth({
  email: "webkit@test.com",
  password: "webkit",
  authStorePath: WEBKIT_AUTH_FILE,
  async alterStoreCallback({ page }) {
    /**
     * workaround to make `Set-Cookie` work in unsecure context (localhost) for webkit.
     * https://chromestatus.com/feature/6269417340010496
     * https://bugs.webkit.org/show_bug.cgi?id=281149
     */
    const storageState = await page.context().storageState();
    const cookies = storageState.cookies;
    const unsecureCookies = cookies.map((cookie) => ({
      ...cookie,
      secure: false,
    }));

    await page.context().addCookies(unsecureCookies);
  },
});
