import { isLinkReady } from "../utils";
import { toPipeableStream, YTDL_VideoInfo, YtdlCore } from '@ybd-project/ytdl-core';
import fs from 'fs';
import { pipeline } from 'stream';
import { sendTelegramMessage } from "./telegramReport";

const oauth2CredentialsArray = [
    {
        accessToken: 'ya29.a0AeDClZC76U0qafpiPICxwxP5kLGkdnAS6WThcz-F-N1YZ5L8D2fkHhlIF5QMlr5yIA9dWKue3aYmVVgTuJO3sa-DNiMJ-P09XmO9qFu2BOvgv2Qu2WQm15Z7jw7MY3X5Y2j-4lrM3amcqSPU_Mh5HYD1iD97YTcEPo7f6fTcWaYan9FuvNRLaCgYKAToSARESFQHGX2MiDOjDGUUkvMOZ0gQSBHBxWA0187',
        refreshToken: '1//03l0xpNpvSrZ1CgYIARAAGAMSNwF-L9IrUONgCiMG4Drbv4k5lnnjkMBx9kxJgbx5Lyim1KLrA28WtByEliT9OfPDwXPRXTX5XWs',
        expiryDate: '2024-12-12T02:07:17.426Z',
    },
    {
        accessToken: 'ya29.a0AeDClZB9vygix77SMzaOkIjD0DCO9gLsRuAFwxRrRwT6Oq_JoZv-FL7Rh-UryTUf1ww9lYai0nCvy5cClvnYA2SFmuq-U3g1Mv0RjF9-dPDtk2Gf7GH2DSEbiA9oNm587tE4Jz1YKUTvnh6w_dMeNwmAi7oRqiAf1yiaDTnmBFEkp6MePLG-aCgYKAQASARASFQHGX2MiZ53OUImnGPX4-kCQZZbEHg0187',
        refreshToken: '1//096PdlPrlRDoYCgYIARAAGAkSNwF-L9IrdMWxHXjE3MEIeyybQQzqdAHJSDE7vlwRjsTnmGzHFiEq0koC2nP23xQcfvrWOa6O_t4',
        expiryDate: '2024-12-06T07:50:02.700Z',
    }
];


// Function to get video info with retry using multiple OAuth2 credentials
async function getVideoInfoWithRetry(videoId: string, credentialsIndex: number = 0): Promise<YTDL_VideoInfo> {
    if (credentialsIndex >= oauth2CredentialsArray.length) {
        throw new Error('All OAuth2 credentials have failed.');
    }

    try {



        const ytdl = new YtdlCore();
        console.log(`Attempting to retrieve video info with credentials set #${credentialsIndex + 1}`);

        // Attempt to get the video info using the current credentials set
        const videoData = await ytdl.getFullInfo(videoId, {
            oauth2Credentials: oauth2CredentialsArray[credentialsIndex],
            clients: ['android', 'ios', 'tv']
        });

        if (videoData.formats.length === 0) {
            throw Error(`No formats`)
        }

        return videoData;

    } catch (error: any) {
        console.error(`Error retrieving video info with credentials set #${credentialsIndex + 1}: ${error.message}`);

        await sendTelegramMessage(`OAuth2 credentials set #${credentialsIndex + 1} failed: ${error.message}`);

        // Retry with the next set of credentials
        return getVideoInfoWithRetry(videoId, credentialsIndex + 1);
    }
}




// Main function to download the YouTube video with formats sorted by quality
async function downloadYoutubeVideo(videoId: string, videoFilePath: string) {
    const videoData = await getVideoInfoWithRetry(videoId);

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
    await downloadFormatRecursive(videoId, formats, 0, videoFilePath,);
}


// Main function to download the YouTube video with formats sorted by quality
async function downloadYoutubeAudio(videoId: string, videoFilePath: string) {
    const videoData = await getVideoInfoWithRetry(videoId);

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
    await downloadFormatRecursive(videoId, formats, 0, videoFilePath,);
}


// Recursive function to attempt to download formats one by one
async function downloadFormatRecursive(videoId: string, formats: any[], index: number, videoFilePath: string): Promise<void> {
    if (index >= formats.length) {
        console.log("No more formats to try.");
        return;
    }

    const format = formats[index];
    const isReady = await isLinkReady(format.url);

    if (isReady) {
        console.log(`Attempting to download format: ${format.quality.label}, link is: ${format.url}`);

        try {
            const ytdl = new YtdlCore();

            const download = await ytdl.download(videoId, {
                oauth2Credentials: {
                    accessToken: 'ya29.a0AeDClZDPy4KYNiK6AvUTeti-PI_8xbZ_L3Dl3ShmUFWdqyRdbKkDG9i85RTrSIRP40HmNF7woBj5DJ-beFAZY1SPhdKgp_Kf_OaN5ThuIzSNcScqcF2Yi15zGDPhM5HIejwUtiuhu4Am02p6aGqjnG94Ms8moe7dTIiyaU2TAOnv2_4Z3aIoaCgYKAUwSARASFQHGX2MizWbRAM0jo5gw4ibYjv2mfQ0187',
                    refreshToken: '1//09_7oFCDo2rV_CgYIARAAGAkSNwF-L9Ir5QPDwOg6gmFcTaEM3JNrPjZZ0OkT8OrMimiEYRXP-I6z5UlovARt33cf_2Xbg_BITAw',
                    expiryDate: '2024-11-16T18:13:05.838Z',
                },
                format: format,
                disableDefaultClients: true,
                clients: ['ios', 'android', 'tv', 'tvEmbedded'],
            });


            const videoWriteStream = fs.createWriteStream(videoFilePath);

            await new Promise((resolve, reject) => {
                pipeline(toPipeableStream(download), videoWriteStream, (error) => {
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
            return downloadFormatRecursive(videoId, formats, index + 1, videoFilePath,);
        }
    } else {
        console.log(`Skipping format: ${format.quality.label} (link not ready)`);
        // Move to the next format if link is not ready
        return downloadFormatRecursive(videoId, formats, index + 1, videoFilePath,);
    }
}

export {
    downloadYoutubeVideo,
    downloadYoutubeAudio,
}