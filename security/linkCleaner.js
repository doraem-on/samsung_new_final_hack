// security/linkCleaner.js

const TRACKING_PARAMS = [
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
    "fbclid", "gclid", "_hsenc", "_hsmi", "mc_eid", "mc_cid"
];

export function cleanUrl(url) {
    try {
        const urlObj = new URL(url);
        let cleaned = false;

        TRACKING_PARAMS.forEach(param => {
            if (urlObj.searchParams.has(param)) {
                urlObj.searchParams.delete(param);
                cleaned = true;
            }
        });

        return cleaned ? urlObj.href : null;
    } catch (e) {
        return null;
    }
}