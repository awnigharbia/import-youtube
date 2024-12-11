import { exec } from 'child_process';
import { promisify } from 'util';
import { randomBytes } from 'crypto';
import fs from 'fs';
import path from 'path';
import { downloadYoutubeAudio, downloadYoutubeVideo } from './YoutubeImport';
import config from '../config/config';
import { downloadFile } from '../utils/downloadFile';
import { fetchYouTubeData } from '../utils/fetchYoutubeInfo';


const ffmpegPath = config.ffmpeg;
const execPromise = promisify(exec);

export const downloadAndConvertYoutubeVideo = async (videoID: string) => {
    console.log('Starting download and convert youtube video');

    const uploadPath = path.join(config.rootDir, '..', 'data');
    const videoId = videoID;
    const randomString = randomBytes(4).toString('hex');
    // Customize the output file paths and names as per your requirements
    const videoFilePath = `${uploadPath}/video-${videoId}-${randomString}.mp4`;
    const audioFilePath = `${uploadPath}/audio-${videoId}-${randomString}.aac`;
    let retries = 0;
    let success = false;

    while (!success && retries < 3) {
        try {
            //old way
            // await downloadYoutubeVideo(videoId!, videoFilePath);

            // await downloadYoutubeAudio(videoId!, audioFilePath)

            //new way
            const videoInfo = await fetchYouTubeData(videoId!);
            await downloadFile(videoInfo.video, videoFilePath)
            await downloadFile(videoInfo.audio, videoFilePath)

            console.log('Download all completed.');

            const outputFileHex = randomBytes(4).toString('hex');

            const finalOutputFilePath = `${uploadPath}/video-${videoId}-${outputFileHex}.mp4`;

            var startTime = Date.now();
            console.log('Start merging video & audio...');

            // Combine video and audio using ffmpeg
            await execPromise(`${ffmpegPath} -i ${videoFilePath} -i ${audioFilePath} -c:v copy -c:a aac ${finalOutputFilePath}`);

            var endTime = Date.now();
            var time = (endTime - startTime) / 1000;

            console.log(`Conversion completed. ${time}s`);

            if (fs.existsSync(videoFilePath)) {
                fs.unlinkSync(videoFilePath);
            }

            if (fs.existsSync(audioFilePath)) {
                fs.unlinkSync(audioFilePath);
            }

            success = true;
            return finalOutputFilePath;
        } catch (err: any) {
            console.error('Error occurred during the download:', err.message);

            if (fs.existsSync(videoFilePath)) {
                console.log('Deleting video file');
                fs.unlinkSync(videoFilePath);
            }

            if (fs.existsSync(audioFilePath)) {
                console.log('Deleting audio file');
                fs.unlinkSync(audioFilePath);
            }
            console.log(`Retrying... (${retries + 1}/3)`);
            retries++;
        }
    }

    if (!success) {
        throw new Error(`Failed to download from youtube after ${3}`);
    }
};