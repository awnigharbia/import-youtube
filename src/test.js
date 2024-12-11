const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;

// Initialize OAuth2 client
const oauth2Client = new OAuth2(
    '400185510790-u6579gtq1j6fiav3tdviocfq95gqi56h.apps.googleusercontent.com',
    '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',
    'http://mysite.com',
);

// Generate new tokens using refresh token
async function refreshAccessToken() {
    oauth2Client.setCredentials({
        refresh_token: '1//09_7oFCDo2rV_CgYIARAAGAkSNwF-L9Ir5QPDwOg6gmFcTaEM3JNrPjZZ0OkT8OrMimiEYRXP-I6z5UlovARt33cf_2Xbg_BITAw'
    });

    try {
        const tokens = await oauth2Client.getAccessToken();
        console.log('Access Token:', tokens.token);
        console.log('Expiry Date:', tokens.res.data.expiry_date);
    } catch (error) {
        console.error('Error refreshing access token:', error);
    }
}

refreshAccessToken();
