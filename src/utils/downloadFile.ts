import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const pipelineAsync = promisify(require('stream').pipeline);

/**
 * Ensures the directory exists and has write permissions.
 * If the directory does not exist, it creates it.
 * 
 * @param dirPath - The directory path to check or create.
 */
function ensureDirectoryWritable(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

    try {
        fs.accessSync(dirPath, fs.constants.W_OK);
    } catch {
        throw new Error(`Directory '${dirPath}' is not writable.`);
    }
}

/**
 * Downloads a file in multiple parts and saves it to the specified local path for improved performance.
 * 
 * @param url - The URL of the file to download.
 * @param localPath - The local file path where the downloaded file should be saved.
 * @param numConnections - Number of simultaneous connections to use.
 * @returns A Promise that resolves when the download is complete.
 */
export async function downloadFile(url: string, localPath: string, numConnections: number = 4): Promise<void> {
    const protocol = url.startsWith('https') ? https : http;

    // Ensure the directory is writable
    const dirPath = path.dirname(localPath);
    ensureDirectoryWritable(dirPath);

    // Get file size from server
    const getFileSize = (): Promise<number> => {
        return new Promise((resolve, reject) => {
            const request = protocol.request(url, { method: 'HEAD' }, (response) => {
                const contentLength = response.headers['content-length'];
                if (!contentLength) {
                    reject(new Error('Failed to retrieve file size'));
                } else {
                    resolve(parseInt(contentLength, 10));
                }
            });
            request.on('error', reject);
            request.end();
        });
    };

    // Download a specific range of bytes
    const downloadRange = (start: number, end: number, partPath: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            const request = protocol.get(url, { headers: { Range: `bytes=${start}-${end}` } }, async (response) => {
                if (response.statusCode !== 206) {
                    reject(new Error(`Failed to download range ${start}-${end}`));
                    return;
                }

                try {
                    const writer = fs.createWriteStream(partPath);
                    await pipelineAsync(response, writer);
                    resolve();
                } catch (error) {
                    fs.unlink(partPath, () => reject(error)); // Delete the file if it was partially written
                }
            });

            request.on('error', reject);
        });
    };

    const fileSize = await getFileSize();
    const partSize = Math.ceil(fileSize / numConnections);
    const partPaths = Array.from({ length: numConnections }, (_, i) => `${localPath}.part${i}`);

    // Download all parts concurrently
    await Promise.all(
        partPaths.map((partPath, index) => {
            const start = index * partSize;
            const end = Math.min(start + partSize - 1, fileSize - 1);
            return downloadRange(start, end, partPath);
        })
    );

    // Merge parts into the final file
    const writer = fs.createWriteStream(localPath);
    for (const partPath of partPaths) {
        const data = fs.createReadStream(partPath);
        await pipelineAsync(data, writer);
        fs.unlinkSync(partPath); // Clean up part file
    }

    writer.end();
}