import axios from 'axios';
import * as fs from 'fs';

/**
 * Downloads a file from the given URL and saves it to the specified local path.
 * 
 * @param url - The URL of the file to download.
 * @param localPath - The local file path where the downloaded file should be saved.
 * @returns A Promise that resolves when the download is complete.
 */
export async function downloadFile(url: string, localPath: string): Promise<void> {
    const writer = fs.createWriteStream(localPath);

    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream',
        });

        // Pipe the response data to the file stream
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', (error) => {
                fs.unlink(localPath, () => reject(error)); // Delete the file if it was partially written
            });
        });
    } catch (error: any) {
        fs.unlink(localPath, () => { }); // Clean up on error
        throw new Error(`Error downloading file: ${error.message}`);
    }
}
