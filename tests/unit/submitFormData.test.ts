import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { maxImageFileSizeInBytes } from '../../shared/utils/imageValidation'
import { parseSubmitFormData } from '../../server/utils/submitFormData'

type CreateErrorInput = {
  statusCode: number;
  statusMessage: string;
};

const createTestError = ({ statusCode, statusMessage }: CreateErrorInput) => {
  const error = new Error(statusMessage) as Error & CreateErrorInput;

  error.statusCode = statusCode;
  error.statusMessage = statusMessage;

  return error;
};

const createImageFile = ({
  name = "photo.jpg",
  type = "image/jpeg",
  contents = ["test photo content"],
}: {
  name?: string;
  type?: string;
  contents?: BlobPart[];
} = {}) => {
  return new File(contents, name, { type });
};

const createValidSubmitFormData = () => {
  const formData = new FormData();

  formData.append("riderName", " Test Rider ");
  formData.append(
    "foundLocationMapUrl",
    " https://maps.google.com/maps?q=Current+Tag ",
  );
  formData.append("foundLatitude", "38.2527");
  formData.append("foundLongitude", "-85.7585");
  formData.append("foundLocationAccuracyMeters", "24");
  formData.append("foundLocationCapturedAt", "2026-05-29T12:00:00.000Z");
  formData.append("nextTitle", " Smoke Test Tag ");
  formData.append("nextClue", " Look near the bike rack. ");
  formData.append(
    "nextHiddenLocationMapUrl",
    " https://maps.google.com/maps?q=Louisville ",
  );
  formData.append("matchPhoto", createImageFile({ name: "match.jpg" }));
  formData.append(
    "nextPhoto",
    createImageFile({ name: "next.webp", type: "image/webp" }),
  );

  return formData;
};

describe("submitFormData", () => {
  beforeEach(() => {
    vi.stubGlobal("createError", createTestError);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("parseSubmitFormData", () => {
    it("parses a valid submit form payload with captured match location metadata", async () => {
      const result = await parseSubmitFormData(createValidSubmitFormData());

      expect(result).toEqual({
        riderName: "Test Rider",
        foundLocationMapUrl: "https://maps.google.com/maps?q=Current+Tag",
        nextHiddenLatitude: null,
        nextHiddenLongitude: null,
        nextHiddenLocationAccuracyMeters: null,
        nextHiddenLocationCapturedAt: null,
        foundLatitude: 38.2527,
        foundLongitude: -85.7585,
        foundLocationAccuracyMeters: 24,
        foundLocationCapturedAt: "2026-05-29T12:00:00.000Z",
        nextTitle: "Smoke Test Tag",
        nextClue: "Look near the bike rack.",
        nextHiddenLocationMapUrl: "https://maps.google.com/maps?q=Louisville",
        matchPhoto: {
          fileName: "match.jpg",
          mimeType: "image/jpeg",
          fileBuffer: expect.any(Uint8Array),
        },
        nextPhoto: {
          fileName: "next.webp",
          mimeType: "image/webp",
          fileBuffer: expect.any(Uint8Array),
        },
      });
    });

    it("accepts long Google Maps URLs under the server map URL limit", async () => {
      const formData = createValidSubmitFormData();
      const longMapUrl = `https://www.google.com/maps/search/?api=1&query=38.2527,-85.7585&query_place_id=${"a".repeat(
        600,
      )}`;

      formData.set("foundLocationMapUrl", longMapUrl);
      formData.set("nextHiddenLocationMapUrl", longMapUrl);

      const result = await parseSubmitFormData(formData);

      expect(result.foundLocationMapUrl).toBe(longMapUrl);
      expect(result.nextHiddenLocationMapUrl).toBe(longMapUrl);
    });

    it("parses a valid submit form payload with a manual match location map link", async () => {
      const formData = createValidSubmitFormData();

      formData.delete("foundLatitude");
      formData.delete("foundLongitude");
      formData.delete("foundLocationAccuracyMeters");
      formData.delete("foundLocationCapturedAt");

      const result = await parseSubmitFormData(formData);

      expect(result).toEqual({
        riderName: "Test Rider",
        foundLocationMapUrl: "https://maps.google.com/maps?q=Current+Tag",
        foundLatitude: null,
        foundLongitude: null,
        foundLocationAccuracyMeters: null,
        foundLocationCapturedAt: null,
        nextTitle: "Smoke Test Tag",
        nextClue: "Look near the bike rack.",
        nextHiddenLocationMapUrl: "https://maps.google.com/maps?q=Louisville",
        nextHiddenLatitude: null,
        nextHiddenLongitude: null,
        nextHiddenLocationAccuracyMeters: null,
        nextHiddenLocationCapturedAt: null,
        matchPhoto: {
          fileName: "match.jpg",
          mimeType: "image/jpeg",
          fileBuffer: expect.any(Uint8Array),
        },
        nextPhoto: {
          fileName: "next.webp",
          mimeType: "image/webp",
          fileBuffer: expect.any(Uint8Array),
        },
      });
    });

    it("requires rider name", async () => {
      const formData = createValidSubmitFormData();

      formData.set("riderName", "");

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: "Rider name is required.",
      });
    });

    it("requires found location map link", async () => {
      const formData = createValidSubmitFormData();

      formData.set("foundLocationMapUrl", "");

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: "Found location map link is required.",
      });
    });

    it("rejects invalid found location map link", async () => {
      const formData = createValidSubmitFormData();

      formData.set("foundLocationMapUrl", "not a url");

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: "Found location map link must be a valid map link.",
      });
    });

    it("rejects non-Google found location map links", async () => {
      const formData = createValidSubmitFormData();

      formData.set("foundLocationMapUrl", "https://example.com/current-tag");

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: "Found location map link must be a valid map link.",
      });
    });
    it("rejects non-Google hidden location map links", async () => {
      const formData = createValidSubmitFormData();

      formData.set(
        "nextHiddenLocationMapUrl",
        "https://example.com/hidden-tag",
      );

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: "Hidden location map link must be a valid map link.",
      });
    });

    it("rejects invalid found latitude", async () => {
      const formData = createValidSubmitFormData();

      formData.set("foundLatitude", "120");

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: "Found latitude is invalid.",
      });
    });

    it("rejects invalid found longitude", async () => {
      const formData = createValidSubmitFormData();

      formData.set("foundLongitude", "-200");

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: "Found longitude is invalid.",
      });
    });

    it("rejects invalid found location accuracy", async () => {
      const formData = createValidSubmitFormData();

      formData.set("foundLocationAccuracyMeters", "-1");

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: "Found location accuracy is invalid.",
      });
    });

    it("rejects invalid found location captured time", async () => {
      const formData = createValidSubmitFormData();

      formData.set("foundLocationCapturedAt", "not a date");

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: "Found location captured time is invalid.",
      });
    });

    it("rejects incomplete found captured location metadata", async () => {
      const formData = createValidSubmitFormData();

      formData.delete("foundLongitude");

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: "Found captured location details are incomplete.",
      });
    });

    it("requires next tag title", async () => {
      const formData = createValidSubmitFormData();

      formData.set("nextTitle", "");

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: "Next tag title is required.",
      });
    });

    it("requires next tag clue", async () => {
      const formData = createValidSubmitFormData();

      formData.set("nextClue", "");

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: "Next tag clue is required.",
      });
    });

    it("requires hidden location map link", async () => {
      const formData = createValidSubmitFormData();

      formData.set("nextHiddenLocationMapUrl", "");

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: "Hidden location map link is required.",
      });
    });

    it("rejects invalid hidden location map link", async () => {
      const formData = createValidSubmitFormData();

      formData.set("nextHiddenLocationMapUrl", "not a url");

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: "Hidden location map link must be a valid map link.",
      });
    });

    it("requires matching photo", async () => {
      const formData = createValidSubmitFormData();

      formData.delete("matchPhoto");

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: "Matching photo is required.",
      });
    });

    it("requires next tag photo", async () => {
      const formData = createValidSubmitFormData();

      formData.delete("nextPhoto");

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: "Next tag photo is required.",
      });
    });

    it("rejects image files with invalid MIME type", async () => {
      const formData = createValidSubmitFormData();

      formData.set(
        "matchPhoto",
        createImageFile({ name: "match.txt", type: "text/plain" }),
      );

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: "Matching photo must be a jpg, png, or webp image.",
      });
    });

    it("rejects image files with mismatched extension", async () => {
      const formData = createValidSubmitFormData();

      formData.set(
        "matchPhoto",
        createImageFile({ name: "match.png", type: "image/jpeg" }),
      );

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage:
          "Matching photo file extension must match the image type.",
      });
    });

    it("rejects image files that are too large", async () => {
      const formData = createValidSubmitFormData();
      const largeContents = [new Uint8Array(maxImageFileSizeInBytes + 1)];

      formData.set(
        "nextPhoto",
        createImageFile({
          name: "next.jpg",
          type: "image/jpeg",
          contents: largeContents,
        }),
      );

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: "Next tag photo must be smaller than 8 MB.",
      });
    });
  });
});
