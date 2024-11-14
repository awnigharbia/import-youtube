import { YtdlCore } from '@ybd-project/ytdl-core';
import Queue from 'better-queue';
import { exec } from 'child_process';
import { randomBytes } from 'crypto';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import config from '../config/config';
import { UploadInfo } from '../uploadBunny';
import { createVdocipherVideo, uploadVdocipherVideo } from '../uploadVdocipher';
import { downloadYoutubeAudio, downloadYoutubeVideo } from './YoutubeImport';

const ffmpegPath = config.ffmpeg;
const execPromise = promisify(exec);

export var currentYoutubeJobs = 0;

var youtubeQueue = new Queue<UploadInfo>(async (task: UploadInfo, callback) => {
    try {
        console.log('Starting youtubeQueue');
        const videoUrl = await downloadAndConvertYoutubeVideo(task.videoID!);
        console.log(`Finished downloading from youtube with url:${videoUrl}`);

        // required for uploading
        const vdocipherFolderID = task.libId!;
        const fileNameForBunny = `lesson-${task.videoID}-${task.lessonID}`;

        console.log(`Creating video for vdocipher with lesson id:${task.videoID}`);
        const videoInfo = await createVdocipherVideo(fileNameForBunny, vdocipherFolderID);
        console.log(`Finished`);

        const url = `https://dev.vdocipher.com/api/videos?title=${fileNameForBunny}&folderId=${vdocipherFolderID}`;
        const accessKey = "BaKF1pCeOhosgNHLhWsHYZcRIGn8BDSbOTCUvb7yyCyJwWIGlcJJHd99U6rP7Sge";

        console.log(`Start uploading video for vdocipher with lesson id:${task.videoID}`);
        console.log(`Video url is ${videoUrl}`);

        await uploadVdocipherVideo({
            filePath: videoUrl,
            url,
            accessKey,
            additionalData: videoInfo.clientPayload
        });
        console.log(`Finished with ${fileNameForBunny}`);

        task.filePath = videoUrl;
        task.guid = videoInfo.videoId;
        callback(null, task);
    } catch (err) {
        console.log('Error in youtubeQueue: ', err);
        callback(task);
    }
}, { concurrent: 5 })

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
            const NORMARL_OATH2 = new YtdlCore.OAuth2({
                accessToken: "ya29.a0AcM612yNBw--kG3L2JHFSeMmUiypiZuvn8NWHcfXYigf3cvj2ajyhPG-2dG-MI8Jo4d_VY5DPj4dpoby8_x0XFKRiFwnPHXjs2THf2CZE2PAL6ilsGW14N-OO_bX_IEZAPHLvd5meUkpagEKHoFyYuGRnBX2eyRj030b9vmwOhxahaGxzzetaCgYKASsSARMSFQHGX2MiK2YMDah5-0du9qjukU5wJA0187",
                refreshToken: "1//039XB4rg0l2ALCgYIARAAGAMSNwF-L9IrnDsUQbFwBKs-Fo2Z7qQkX0T6-EPexsdiWg_x8zS-VSrzQfNcM3P0iLiBtkEN4IXTT6I",
                expiryDate: "2024-09-10T08:36:23.701Z"
            });

            await downloadYoutubeVideo(videoId!, videoFilePath, NORMARL_OATH2);

            await downloadYoutubeAudio(videoId!, audioFilePath, NORMARL_OATH2)

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

export {
    youtubeQueue
};
