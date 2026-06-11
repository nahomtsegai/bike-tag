import { createSupabaseServerClient } from "./supabase";
import {
  deleteBikeTagPhotos,
  getStoragePathFromPublicUrl,
} from "./supabaseStorage";

type DeleteSubmissionInput = {
  submissionId: string;
};

type SubmissionForDeletion = {
  id: string;
  status: string;
  match_photo_url: string | null;
  next_tag_photo_url: string | null;
};

type DeletedSubmissionRow = {
  id: string;
};

const isSubmissionForDeletion = (
  value: unknown,
): value is SubmissionForDeletion => {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "status" in value &&
    typeof value.status === "string" &&
    "match_photo_url" in value &&
    (typeof value.match_photo_url === "string" ||
      value.match_photo_url === null) &&
    "next_tag_photo_url" in value &&
    (typeof value.next_tag_photo_url === "string" ||
      value.next_tag_photo_url === null)
  );
};

const isDeletedSubmissionRow = (
  value: unknown,
): value is DeletedSubmissionRow => {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string"
  );
};

const createDeleteSubmissionError = (message: string) => {
  return createError({
    statusCode: 500,
    statusMessage: message,
  });
};

const loadSubmissionForDeletion = async (submissionId: string) => {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("submissions")
    .select("id,status,match_photo_url,next_tag_photo_url")
    .eq("id", submissionId)
    .maybeSingle();

  if (error) {
    throw createDeleteSubmissionError(
      `Could not load submission before deletion: ${error.message}`,
    );
  }

  if (!data) {
    throw createError({
      statusCode: 404,
      statusMessage: "Submission was not found.",
    });
  }

  if (!isSubmissionForDeletion(data)) {
    throw createDeleteSubmissionError(
      "Submission returned an unexpected response.",
    );
  }

  return data;
};

const deleteSubmissionRow = async (submissionId: string) => {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("submissions")
    .delete()
    .eq("id", submissionId)
    .in("status", ["pending", "rejected"])
    .select("id")
    .maybeSingle();

  if (error) {
    throw createDeleteSubmissionError(
      `Could not delete submission from Supabase: ${error.message}`,
    );
  }

  if (!data) {
    throw createError({
      statusCode: 409,
      statusMessage:
        "Submission was not deleted because it is no longer pending or rejected.",
    });
  }

  if (!isDeletedSubmissionRow(data)) {
    throw createDeleteSubmissionError(
      "Deleted submission returned an unexpected response.",
    );
  }

  return data.id;
};

const cleanupSubmissionPhotos = async (
  submissionId: string,
  submission: SubmissionForDeletion,
) => {
  const storagePaths = [
    getStoragePathFromPublicUrl(submission.match_photo_url ?? ""),
    getStoragePathFromPublicUrl(submission.next_tag_photo_url ?? ""),
  ].filter(Boolean);

  if (!storagePaths.length) {
    return;
  }

  try {
    await deleteBikeTagPhotos(storagePaths);
  } catch (error) {
    console.error("Could not delete pending submission photos.", {
      submissionId,
      storagePaths,
      error,
    });
  }
};

export const deletePendingSubmissionFromSupabase = async ({
  submissionId,
}: DeleteSubmissionInput) => {
  const submission = await loadSubmissionForDeletion(submissionId);

  if (!["pending", "rejected"].includes(submission.status)) {
    throw createError({
      statusCode: 409,
      statusMessage: "Only pending or rejected submissions can be deleted.",
    });
  }

  await deleteSubmissionRow(submissionId);
  await cleanupSubmissionPhotos(submissionId, submission);

  return {
    submissionId,
  };
};
