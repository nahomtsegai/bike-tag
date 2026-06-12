import { assertAdminRequestAccess } from "../../../utils/adminAuth";
import { createSupabaseServerClient } from "../../../utils/supabase";
import {
  deleteBikeTagPhotos,
  getStoragePathFromPublicUrl,
} from "../../../utils/supabaseStorage";

type DeleteGameDataRequestBody = {
  confirmation?: string;
};

type SubmissionPhotoUrls = {
  match_photo_url: string | null;
  next_tag_photo_url: string | null;
};

type TagPhotoUrls = {
  tag_photo_url: string | null;
  match_photo_url: string | null;
};

const requiredConfirmationText = "DELETE GAME DATA";

const assertGameDataDeleteEnabled = () => {
  const runtimeConfig = useRuntimeConfig();

  if (String(runtimeConfig.enableGameDataDelete).toLowerCase() !== "true") {
    throw createError({
      statusCode: 403,
      statusMessage: "Game data deletion is disabled in this environment.",
    });
  }
};

const getConfirmation = async (event: Parameters<typeof readBody>[0]) => {
  const body = await readBody<DeleteGameDataRequestBody>(event);

  if (body.confirmation !== requiredConfirmationText) {
    throw createError({
      statusCode: 400,
      statusMessage: `Type ${requiredConfirmationText} to confirm.`,
    });
  }
};

const isSubmissionPhotoUrls = (
  value: unknown,
): value is SubmissionPhotoUrls => {
  return (
    typeof value === "object" &&
    value !== null &&
    "match_photo_url" in value &&
    (typeof value.match_photo_url === "string" ||
      value.match_photo_url === null) &&
    "next_tag_photo_url" in value &&
    (typeof value.next_tag_photo_url === "string" ||
      value.next_tag_photo_url === null)
  );
};

const isTagPhotoUrls = (value: unknown): value is TagPhotoUrls => {
  return (
    typeof value === "object" &&
    value !== null &&
    "tag_photo_url" in value &&
    (typeof value.tag_photo_url === "string" || value.tag_photo_url === null) &&
    "match_photo_url" in value &&
    (typeof value.match_photo_url === "string" ||
      value.match_photo_url === null)
  );
};

const getStoragePathsFromUrls = (photoUrls: Array<string | null>) => {
  return photoUrls
    .map((photoUrl) => getStoragePathFromPublicUrl(photoUrl ?? ""))
    .filter(Boolean);
};

const getUniqueStoragePaths = (storagePaths: string[]) => {
  return [...new Set(storagePaths)];
};

const loadSubmissionStoragePaths = async () => {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("submissions")
    .select("match_photo_url,next_tag_photo_url");

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Could not load submission photos before cleanup: ${error.message}`,
    });
  }

  if (!Array.isArray(data)) {
    throw createError({
      statusCode: 500,
      statusMessage: "Submission photos returned an unexpected response.",
    });
  }

  return data.flatMap((submission) => {
    if (!isSubmissionPhotoUrls(submission)) {
      throw createError({
        statusCode: 500,
        statusMessage: "Submission photos returned an invalid row.",
      });
    }

    return getStoragePathsFromUrls([
      submission.match_photo_url,
      submission.next_tag_photo_url,
    ]);
  });
};

const loadTagStoragePaths = async () => {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("tags")
    .select("tag_photo_url,match_photo_url");

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Could not load tag photos before cleanup: ${error.message}`,
    });
  }

  if (!Array.isArray(data)) {
    throw createError({
      statusCode: 500,
      statusMessage: "Tag photos returned an unexpected response.",
    });
  }

  return data.flatMap((tag) => {
    if (!isTagPhotoUrls(tag)) {
      throw createError({
        statusCode: 500,
        statusMessage: "Tag photos returned an invalid row.",
      });
    }

    return getStoragePathsFromUrls([tag.tag_photo_url, tag.match_photo_url]);
  });
};

const loadGameDataStoragePaths = async () => {
  const [submissionStoragePaths, tagStoragePaths] = await Promise.all([
    loadSubmissionStoragePaths(),
    loadTagStoragePaths(),
  ]);

  return getUniqueStoragePaths([...submissionStoragePaths, ...tagStoragePaths]);
};

const deleteRowsFromTable = async (tableName: "submissions" | "tags") => {
  const supabase = createSupabaseServerClient();

  const { count, error } = await supabase
    .from(tableName)
    .delete({
      count: "exact",
    })
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Could not delete ${tableName}: ${error.message}`,
    });
  }

  return count ?? 0;
};

const cleanupGameDataStorage = async (storagePaths: string[]) => {
  if (!storagePaths.length) {
    return {
      deletedStoragePathCount: 0,
      storageCleanupError: null,
    };
  }

  try {
    await deleteBikeTagPhotos(storagePaths);

    return {
      deletedStoragePathCount: storagePaths.length,
      storageCleanupError: null,
    };
  } catch (error) {
    const storageCleanupError =
      error instanceof Error ? error.message : "Unknown storage cleanup error.";

    console.error("Could not delete game data photos.", {
      storagePaths,
      error,
    });

    return {
      deletedStoragePathCount: 0,
      storageCleanupError,
    };
  }
};

export default defineEventHandler(async (event) => {
  await assertAdminRequestAccess(event);
  assertGameDataDeleteEnabled();
  await getConfirmation(event);

  const storagePaths = await loadGameDataStoragePaths();

  const deletedSubmissionCount = await deleteRowsFromTable("submissions");
  const deletedTagCount = await deleteRowsFromTable("tags");

  const { deletedStoragePathCount, storageCleanupError } =
    await cleanupGameDataStorage(storagePaths);

  return {
    success: storageCleanupError === null,
    message:
      storageCleanupError === null
        ? "Game data deleted."
        : "Game data deleted, but photo cleanup failed.",
    deletedSubmissionCount,
    deletedTagCount,
    deletedStoragePathCount,
    storageCleanupError,
  };
});
