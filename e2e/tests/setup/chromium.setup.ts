import { CHROMIUM_AUTH_FILE } from "../../playwright.config";
import { setupAuth } from "./auth.setup";

setupAuth({
  email: "chromium@test.com",
  password: "chromium",
  authStorePath: CHROMIUM_AUTH_FILE,
});
