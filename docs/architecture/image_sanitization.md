# Server-side image sanitization

HP4 will normalize submitted Bike Tag photos before they are stored. The implementation will decode each image server-side, apply orientation, constrain dimensions, strip metadata, encode a fresh JPEG, and reject files that cannot be decoded safely.
