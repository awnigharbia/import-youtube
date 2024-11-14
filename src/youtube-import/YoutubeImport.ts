import { isLinkReady } from "../utils";
import { OAuth2 } from '@ybd-project/ytdl-core/package/core/OAuth2';
import { YtdlCore } from '@ybd-project/ytdl-core';
import fs from 'fs';
import { pipeline } from 'stream';

// Main function to download the YouTube video with formats sorted by quality
async function downloadYoutubeVideo(videoId: string, videoFilePath: string, oauth2: OAuth2) {
    const ytdl = new YtdlCore({ oauth2: oauth2, debug: false });

    const videoData = await ytdl.getFullInfo(videoId, {
        oauth2: oauth2,
    });

    const formats = videoData.formats
        .filter((format) => {
            try {
                const qualityLabel = format.quality.label;
                const indexOfP = qualityLabel.indexOf('p');
                const qualityNumber = parseInt(qualityLabel.slice(0, indexOfP));
                const containsHDR = qualityLabel.toLowerCase().includes('hdr');
                const higherThan1080 = qualityNumber > 1080;
                const badSourceClient = ['web', 'webCreator'].includes(format.sourceClientName);
                const isAudio = format.hasAudio;

                if (containsHDR || higherThan1080 || badSourceClient || isAudio) {
                    return false;
                }
                return true;
            } catch (e) {
                return false;
            }
        })
        .sort((a, b) => {
            const qualityA = parseInt(a.quality.label.slice(0, a.quality.label.indexOf('p')));
            const qualityB = parseInt(b.quality.label.slice(0, b.quality.label.indexOf('p')));
            return qualityB - qualityA; // Higher resolution comes first
        });

    // Start the recursive download process with the first format (index 0)
    await downloadFormatRecursive(videoId, formats, 0, videoFilePath, oauth2);
}


// Main function to download the YouTube video with formats sorted by quality
async function downloadYoutubeAudio(videoId: string, videoFilePath: string, oauth2: OAuth2) {
    const ytdl = new YtdlCore({ oauth2: oauth2, debug: false });
    const videoData = await ytdl.getFullInfo(videoId, {
        oauth2: oauth2,

    });

    const formats = videoData.formats
        .filter((format) => {
            try {
                const qualityLabel = format.quality.label;
                const indexOfP = qualityLabel.indexOf('p');
                const qualityNumber = parseInt(qualityLabel.slice(0, indexOfP));
                const containsHDR = qualityLabel.toLowerCase().includes('hdr');
                const higherThan1080 = qualityNumber > 1080;
                const badSourceClient = ['web', 'webCreator'].includes(format.sourceClientName);
                const isAudio = format.hasVideo;

                if (containsHDR || higherThan1080 || badSourceClient || isAudio) {
                    return false;
                }
                return true;
            } catch (e) {
                return false;
            }
        })
        .sort((a, b) => {
            const qualityA = parseInt(a.quality.label.slice(0, a.quality.label.indexOf('p')));
            const qualityB = parseInt(b.quality.label.slice(0, b.quality.label.indexOf('p')));
            return qualityB - qualityA; // Higher resolution comes first
        });

    // Start the recursive download process with the first format (index 0)
    await downloadFormatRecursive(videoId, formats, 0, videoFilePath, oauth2);
}


// Recursive function to attempt to download formats one by one
async function downloadFormatRecursive(videoId: string, formats: any[], index: number, videoFilePath: string, oauth2: any): Promise<void> {
    if (index >= formats.length) {
        console.log("No more formats to try.");
        return;
    }

    const format = formats[index];
    const isReady = await isLinkReady(format.url);

    if (isReady) {
        console.log(`Attempting to download format: ${format.quality.label}, link is: ${format.url}`);

        try {
            const ytdl = new YtdlCore({ oauth2: oauth2 });

            const download = ytdl.download(videoId, {
                oauth2: oauth2,
                format: format,
                disableDefaultClients: true,
                clients: ['ios', 'android', 'tv', 'tvEmbedded'],
            });

            const videoWriteStream = fs.createWriteStream(videoFilePath);

            await new Promise((resolve, reject) => {
                pipeline(download, videoWriteStream, (error) => {
                    if (error) {
                        console.error(`Error while downloading format ${format.quality.label}: ${error.message}`);
                        reject(error);
                    } else {
                        console.log('Download Video completed successfully.');
                        resolve(null);
                    }
                });
            });

        } catch (error: any) {
            console.error(`Error while processing format ${format.quality.label}: ${error.message}`);
            // Move to the next format in case of error
            return downloadFormatRecursive(videoId, formats, index + 1, videoFilePath, oauth2);
        }
    } else {
        console.log(`Skipping format: ${format.quality.label} (link not ready)`);
        // Move to the next format if link is not ready
        return downloadFormatRecursive(videoId, formats, index + 1, videoFilePath, oauth2);
    }
}

export {
    downloadYoutubeVideo,
    downloadYoutubeAudio,
}