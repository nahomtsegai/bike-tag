import { describe, expect, it } from "vitest";
import {
  isAllowedRequestOrigin,
  shouldProtectAdminMutationRequest,
} from "../../server/utils/requestOrigin";

describe("requestOrigin", () => {
  describe("isAllowedRequestOrigin", () => {
    it("allows an origin matching the request origin", () => {
      expect(
        isAllowedRequestOrigin({
          originHeader: "https://louisvillebiketag.vercel.app",
          requestUrl:
            "https://louisvillebiketag.vercel.app/api/admin/submissions",
        }),
      ).toBe(true);
    });

    it("allows a matching local development origin", () => {
      expect(
        isAllowedRequestOrigin({
          originHeader: "http://localhost:3000",
          requestUrl: "http://localhost:3000/api/admin/session/login",
        }),
      ).toBe(true);
    });

    it("rejects a missing origin header", () => {
      expect(
        isAllowedRequestOrigin({
          originHeader: undefined,
          requestUrl:
            "https://louisvillebiketag.vercel.app/api/admin/submissions",
        }),
      ).toBe(false);
    });

    it("rejects a null origin", () => {
      expect(
        isAllowedRequestOrigin({
          originHeader: "null",
          requestUrl:
            "https://louisvillebiketag.vercel.app/api/admin/submissions",
        }),
      ).toBe(false);
    });

    it("rejects a mismatched hostname", () => {
      expect(
        isAllowedRequestOrigin({
          originHeader: "https://malicious.example",
          requestUrl:
            "https://louisvillebiketag.vercel.app/api/admin/submissions",
        }),
      ).toBe(false);
    });

    it("rejects a mismatched protocol", () => {
      expect(
        isAllowedRequestOrigin({
          originHeader: "http://louisvillebiketag.vercel.app",
          requestUrl:
            "https://louisvillebiketag.vercel.app/api/admin/submissions",
        }),
      ).toBe(false);
    });

    it("rejects a mismatched port", () => {
      expect(
        isAllowedRequestOrigin({
          originHeader: "http://localhost:3001",
          requestUrl: "http://localhost:3000/api/admin/session/login",
        }),
      ).toBe(false);
    });

    it("rejects an invalid origin value", () => {
      expect(
        isAllowedRequestOrigin({
          originHeader: "not-an-origin",
          requestUrl:
            "https://louisvillebiketag.vercel.app/api/admin/submissions",
        }),
      ).toBe(false);
    });
  });

  describe("shouldProtectAdminMutationRequest", () => {
    it.each([
      ["POST", "/api/admin/session/login"],
      ["POST", "/api/admin/session/logout"],
      ["POST", "/api/admin/submissions/submission-id/approve"],
      ["PUT", "/api/admin/example"],
      ["PATCH", "/api/admin/example"],
      ["DELETE", "/api/admin/example"],
    ])("protects %s requests under the admin API", (method, pathname) => {
      expect(
        shouldProtectAdminMutationRequest({
          method,
          pathname,
        }),
      ).toBe(true);
    });

    it.each([
      ["GET", "/api/admin/submissions"],
      ["HEAD", "/api/admin/submissions"],
      ["OPTIONS", "/api/admin/session/login"],
      ["POST", "/api/tags/submit"],
      ["POST", "/admin/submissions"],
      ["POST", "/api/administrator/example"],
    ])(
      "does not protect %s requests outside the admin mutation scope",
      (method, pathname) => {
        expect(
          shouldProtectAdminMutationRequest({
            method,
            pathname,
          }),
        ).toBe(false);
      },
    );

    it("normalizes lowercase HTTP methods", () => {
      expect(
        shouldProtectAdminMutationRequest({
          method: "post",
          pathname: "/api/admin/session/login",
        }),
      ).toBe(true);
    });
  });
});
