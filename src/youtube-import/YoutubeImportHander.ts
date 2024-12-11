import { Request, Response } from "express";
import { youtubeQueue } from "./YotubeQueue";
import { UploadInfo } from "../uploadBunny";
import { deleteFile } from "../utils";
import { updateLesson } from "../updateLesson";
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 10 }); // Cache TTL set to 1 hour

export const vdocipherYoutubeDownloadHandler = async (req: Request, res: Response) => {
    try {
        const videoId = req.query.id as string;
        const libId = req.query.vdocipher_id as string;
        const lessonId = req.query.lesson_id as string;
        const skipCache = req.query.skip_cache as string ?? 'false';
        const dev = req.query.dev as string ?? 'false';

        if (!videoId) {
            res.status(400).json({ error: 'Missing required parameter' });
            return;
        }

        // Check cache for existing response
        const cachedResponse = cache.get(videoId);
        if (cachedResponse && skipCache == 'false') {
            console.log(`Cache hit for video: ${videoId}`);
            res.json(cachedResponse);
            return;
        }

        console.log(`Starting download for video:${videoId}, lesson:${lessonId}, lib:${libId}`);

        const response = { videoId: videoId, message: 'Download started' };
        res.json(response);

        // Add response to cache
        cache.set(videoId, response);

        youtubeQueue.push({
            videoID: videoId,
            lessonID: lessonId,
            libId: libId,
            type: "vdocipher",
            dev: dev,
        })
            .on('finish', async function (result: UploadInfo) {
                deleteFile(result.filePath ?? '')
                console.log('Finished downloading and uploading to bunny server', result);
                if (result.lessonID && result.guid)
                    await updateLesson(result.lessonID, result.guid, 1, result.dev === 'true');

            }).on('failed', async function (err) {
                await updateLesson(err.lessonID, err.guid, 0, err.dev === 'true');
            });
    } catch (err) {
        // console.error('Error occurred during the download:', err);
        res.status(500).json({ error: 'Error occurred during the download', err: err });
    }
};

export const bunnyYoutubeDownloadHandler = async (req: Request, res: Response) => {
    try {
        const videoId = req.query.id as string;
        const libId = req.query.library_id as string;
        const libAccessKey = req.query.access_key as string;
        const lessonId = req.query.lesson_id as string;
        const skipCache = req.query.skip_cache as string ?? 'false';
        const dev = req.query.dev as string ?? 'false';


        if (!videoId) {
            res.status(400).json({ error: 'Missing required parameter' });
            return;
        }

        // // Check cache for existing response
        // const cachedResponse = cache.get(videoId);
        // if (cachedResponse && skipCache == 'false') {
        //     console.log(`Cache hit for video: ${videoId}`);
        //     res.json(cachedResponse);
        //     return;
        // }



        console.log(`Starting download for video:${videoId}, lesson:${lessonId}, lib:${libId}`);

        const response = { videoId: videoId, message: 'Download started' };
        res.json(response);

        // Add response to cache
        // cache.set(videoId, response);

        youtubeQueue.push({
            videoID: videoId,
            lessonID: lessonId,
            libId: libId,
            accessKey: libAccessKey,
            type: "bunny",
            dev: dev,
        })
            .on('finish', async function (result: UploadInfo) {
                console.log('Clean video files after uploading');
                deleteFile(result.filePath ?? '');
                console.log('Done.');

                console.log('Finished downloading and uploading to bunny server', result);
                if (result.lessonID && result.guid)
                    await updateLesson(result.lessonID, result.guid, 1, result.dev === 'true');
            }).on('failed', async function (err) {
                await updateLesson(err.lessonID, err.guid, 0, err.dev === 'true');
            });
    } catch (err) {
        // console.error('Error occurred during the download:', err);
        res.status(500).json({ error: 'Error occurred during the download', err: err });
    }
};

export const multipleYoutubeDownloadHandler = async (req: Request, res: Response) => {
    try {
        const videoIds = typeof req.body.videoIds === 'string' ? JSON.parse(req.body.videoIds) : (Array.isArray(req.body.videoIds) ? req.body.videoIds : []); // Accepting video IDs as an array from the request body
        const libId = req.body.vdocipher_id as string;
        const lessonId = req.body.lesson_id as string;

        if (!Array.isArray(videoIds) || videoIds.length === 0) {
            res.status(400).json({ error: 'Missing required parameter: videoIds' });
            return;
        }

        console.log(`Starting download for videos: ${videoIds.join(', ')}, lesson: ${lessonId}, lib: ${libId}`);

        res.json({ videoIds: videoIds, message: 'Downloads started' });

        // Iterate over each video ID and push it to the queue
        videoIds.forEach(videoId => {
            youtubeQueue.push({
                videoID: videoId,
                lessonID: lessonId,
                libId: libId,
                type: "vdocipher"
            })
                .on('finish', async function (result: UploadInfo) {
                    deleteFile(result.filePath ?? '');
                    console.log('Finished downloading and uploading to bunny server', result);
                }).on('failed', async function (err) {
                    deleteFile(err.filePath ?? '');
                    console.error('Download YouTube Task failed', err);
                });
        });
    } catch (err) {
        console.error('Error occurred during the download:', err);
        res.status(500).json({ error: 'Error occurred during the download', err: err });
    }
};
