# Image upload sanitization

Bike Tag sanitizes every submitted photo on the server before it is written to Supabase Storage.

The processing pipeline:

1. Validates the declared MIME type, file extension, file size, and file signature.
2. Decodes the image with a bounded pixel limit.
3. Applies EXIF orientation.
4. Resizes the image so neither dimension exceeds 2400 pixels.
5. Re-encodes the image as WebP at a balanced quality setting.
6. Drops source metadata, including EXIF and GPS fields.
7. Uploads only the sanitized bytes.

Corrupt or undecodable files are rejected with a `400` response. Processing happens before a storage path is uploaded, so sanitization failures do not leave orphaned objects.
