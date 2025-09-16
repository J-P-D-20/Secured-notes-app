import crypto from "crypto";

export function generateChecksum(content) {
    return crypto.createHash("sha256").update(content).digest("hex");
}

export function verifyChecksum(content, checksum) {
    const generatedChecksum = generateChecksum(content);
    return generatedChecksum === checksum;
}