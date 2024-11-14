import axios from "axios";
import fs from 'fs';

// Function to check if the link is ready (checking for 403 or any other HTTP errors)
async function isLinkReady(url: string) {
    try {
        const response = await axios.head(url); // You can also use 'get' but 'head' is faster
        return response.status === 200; // Only proceed if the link is ready (HTTP 200 OK)
    } catch (error: any) {
        if (error.response && error.response.status === 403) {
            console.error("403 Forbidden: The link is not accessible.");
        } else {
            console.error(`Error fetching URL: ${error.message}`);
        }
        return false;
    }
}

const deleteFile = (path: string) => {
    if (fs.existsSync(path ?? '')) {
        fs.unlinkSync(path ?? '');
    }
}

export {
    isLinkReady,
    deleteFile,
}