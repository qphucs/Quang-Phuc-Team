import { randomInt } from "node:crypto";

// No look-alike characters (0/O, 1/l/I) so the code is easy to read out loud or copy.
const ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** 10-character temporary password. Shown once to the admin, then the member must change it. */
export function generateTempPassword(length = 10): string {
  return Array.from({ length }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
}
