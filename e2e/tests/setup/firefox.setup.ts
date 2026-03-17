import { FIREFOX_AUTH_FILE } from "../../playwright.config";
import { setupAuth } from "./auth.setup";

setupAuth({
  email: "firefox@test.com",
  password: "firefox",
  authStorePath: FIREFOX_AUTH_FILE,
});
