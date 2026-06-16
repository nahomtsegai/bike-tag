import { getMethod, getRequestURL } from "h3";
import { assertHumanSubmission } from "../utils/botProtection";

const protectedSubmitPath = "/api/tags/submit";

const normalizePathname = (pathname: string) => {
  if (pathname === "/") {
    return pathname;
  }

  return pathname.replace(/\/+$/, "");
};

export default defineEventHandler(async (event) => {
  if (getMethod(event) !== "POST") {
    return;
  }

  const pathname = normalizePathname(getRequestURL(event).pathname);

  if (pathname !== protectedSubmitPath) {
    return;
  }

  await assertHumanSubmission();
});
