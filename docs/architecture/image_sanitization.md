# Server-side image sanitization

HP4 normalizes Bike Tag photos before they are stored in Supabase. The server decodes every JPEG, PNG, or WebP upload, verifies that the decoded format matches the declared MIME type, applies orientation, constrains the longest edge, strips embedded metadata, flattens transparency, and encodes a fresh JPEG.

## Processing defaults

- Maximum longest edge: 1600 pixels
- JPEG quality: 75
- Maximum decoded input: 40 million pixels
- Output MIME type: `image/jpeg`
- Output extension: `.jpg`
- Animated or multi-frame images: rejected

## Validation order

1. Existing MIME, extension, magic-byte, individual-size, and combined request-size checks run first.
2. Sharp decodes the image with a decoded-pixel limit.
3. The decoded format must match the submitted MIME type.
4. Orientation is applied and oversized dimensions are reduced without enlargement.
5. Alpha is flattened onto white and a new progressive JPEG is encoded without source metadata.
6. The normalized output is revalidated before it can reach Supabase Storage.

Corrupt files, fake image content, invalid dimensions, multi-frame images, and decoded-pixel-limit violations return a client validation error before any storage write. Existing submit cleanup still removes an earlier upload when a later photo or database step fails.
