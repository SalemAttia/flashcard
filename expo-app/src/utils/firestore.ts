/**
 * Recursively removes 'undefined' fields from an object so Firestore doesn't crash.
 * Firestore does not support 'undefined' as a value.
 */
export function sanitize(obj: any): any {
  if (Array.isArray(obj)) return obj.map(sanitize);
  if (obj && typeof obj === "object" && obj.constructor === Object) {
    const fresh: any = {};
    Object.keys(obj).forEach((key) => {
      const val = sanitize(obj[key]);
      if (val !== undefined) fresh[key] = val;
    });
    return fresh;
  }
  return obj;
}
