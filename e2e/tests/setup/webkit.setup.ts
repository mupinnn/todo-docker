import { WEBKIT_AUTH_FILE } from "../../playwright.config";
import { setupAuth } from "./auth.setup";

setupAuth({
  email: "webkit@test.com",
  password: "webkit",
  authStorePath: WEBKIT_AUTH_FILE,
});
