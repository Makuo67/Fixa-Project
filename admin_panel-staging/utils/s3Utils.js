/**
 * Extracts the key from the URL based on the provided bucket and region.
 * @param {string} bucket - The name of the bucket.
 * @param {string} region - The region of the bucket.
 * @param {string} url - The URL from which to extract the key.
 * @returns {string|null} - The extracted key or null if the URL doesn't contain the expected bucket name.
 */
export const extractKeyFromUrl = (bucket, region, url) => {
    if(url === null || url === '') return null;
    // parse the url
    const urlParts = url.split('/');
    const bucketName = urlParts[2];
    if (bucketName !== `${bucket}.s3.${region}.amazonaws.com`) {
        return null; // URL doesn't contain the expected bucket name
    }
    const bucketIndex = url.indexOf(bucketName);
    if (bucketIndex !== -1) {
        return url.substring(bucketIndex + bucketName.length + 1);
    } else {
        return null; // URL doesn't contain the expected bucket name
    }
}