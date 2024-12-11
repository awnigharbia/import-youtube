import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Downloads a file from the given URL and saves it to the specified local path.
 * 
 * @param url - The URL of the file to download.
 * @param localPath - The local file path where the downloaded file should be saved.
 * @returns A Promise that resolves when the download is complete.
 */
export async function downloadFile(url: string, localPath: string): Promise<void> {
    const protocol = url.startsWith('https') ? https : http;

    await new Promise<void>((resolve, reject) => {
        const request = protocol.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
                return;
            }

            const writer = fs.createWriteStream(localPath);
            response.pipe(writer);

            writer.on('finish', resolve);
            writer.on('error', (error) => {
                fs.unlink(localPath, () => reject(error)); // Delete the file if it was partially written
            });
        });

        request.on('error', (error) => {
            reject(new Error(`Request error: ${error.message}`));
        });
    });
}