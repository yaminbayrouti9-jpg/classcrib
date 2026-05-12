/**
 * Sanitizes MongoDB results to be passed from Server Components to Client Components.
 * Converts _id to string and ensures deep objects are POJOs.
 */
export function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}
