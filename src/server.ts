import Queue from 'better-queue';
import bodyParser from 'body-parser';
import express from 'express';
import fs from 'fs';
import path from 'path';
import serveIndex from 'serve-index';
import tus from 'tus-node-server';
import { parseMetadataString } from './parseMetadata';
import trimVideo from './trimVideo';
import { updateLesson } from './updateLesson';
import { createVideo, uploadVideo } from './uploadBunny';
import { createVdocipherVideo, uploadVdocipherVideo } from './uploadVdocipher';
import { bunnyYoutubeDownloadHandler, multipleYoutubeDownloadHandler, vdocipherYoutubeDownloadHandler } from './youtube-import/YoutubeImportHander';

const uploadServer = new tus.Server({
    path: '/files'
});
uploadServer.datastore = new tus.FileStore({ directory: './files' });

var bunnyQueue = new Queue(async (task, callback) => {
    try {
        await uploadVideo(task);
        callback(null, task);
    }
    catch (err) {
        callback(err);
    }
}, { concurrent: 1 })

var vdocipherQueue = new Queue(async (task, callback) => {
    try {
        await uploadVdocipherVideo(task);
        callback(null, task);
    }
    catch (err) {
        callback(err);
    }
}, { concurrent: 1 })

uploadServer.on(tus.EVENTS.EVENT_UPLOAD_COMPLETE, async (event) => {
    console.log(`Upload complete for file ${event}`);
    console.log(JSON.stringify(event.file.upload_metadata));
    const metadata = parseMetadataString(event.file.upload_metadata);
    const duration = metadata['duration']?.decoded ?? "";
    const fileType = metadata['filetype'].decoded.split('/')[1];
    const libraryKey = metadata['key']?.decoded ?? "";
    const libraryId = metadata['library_id']?.decoded ?? "";
    const lessonID = metadata['lesson_id']?.decoded ?? "";
    const videoType = metadata['type_video']?.decoded ?? "";

    const fileName = `${event.file.id}.${fileType}`;
    const fileNameForBunny = `lesson-${lessonID}.mp4`;

    await fs.promises.rename(`./files/${event.file.id}`, `./files/${fileName}`);

    if (videoType.toString().toLocaleLowerCase() === 'bunny') {

        const { guid } = await createVideo(fileNameForBunny, libraryId, libraryKey);

        const filePath = `./files/${fileName}`;
        const filePathWithNoExtensions = `./files/${event.file.id}`;

        const url = `https://video.bunnycdn.com/library/${libraryId}/videos/${guid}`;
        const accessKey = libraryKey;

        let finalFilePath;
        if (duration !== "") {
            await trimVideo(filePath, event.file.id.toString(), duration);
            finalFilePath = `${filePathWithNoExtensions}-trimmed.mp4`;
        } else {
            finalFilePath = filePath;
        }

        bunnyQueue.push({
            filePath: finalFilePath,
            url,
            accessKey,
            lessonID,
            guid,
        }, (err) => {
            if (err) {
                updateLesson(lessonID, "", 0);
            }
        })

        bunnyQueue.on('task_finish', async (taskId: any, result: any, stats: any) => {
            console.log('task_finish', taskId, result, stats);
            await updateLesson(result.lessonID, result.guid, 1);

            await fs.promises.unlink(filePath);
        })

        bunnyQueue.on('task_failed', async (result: any, err: any, stats: any) => {
            console.log('task_failed', result, err, stats);

            updateLesson(result.lessonID, result.guid, 0);
            await fs.promises.unlink(filePathWithNoExtensions);
        })
    } else {
        try {
            const filePath = `./files/${fileName}`;
            const filePathWithNoExtensions = `./files/${event.file.id}`;
            // const filePath = path.join(__dirname, '..', 'files', fileName);
            const vdocipherFolderID = metadata['id_folder_vdosipher']?.decoded ?? "";
            const videoInfo = await createVdocipherVideo(fileNameForBunny, vdocipherFolderID);

            const url = `https://dev.vdocipher.com/api/videos?title=${fileName}&folderId=${vdocipherFolderID}`;
            const accessKey = "BaKF1pCeOhosgNHLhWsHYZcRIGn8BDSbOTCUvb7yyCyJwWIGlcJJHd99U6rP7Sge";
            // const accessKey = "kpXVs1UF3oONS2Yfm9d3Bx8K5MnxX88dhMd6m4pYE20z8vaI64m8a1QyD056Jyg3";

            let finalFilePath;
            if (duration !== "") {
                await trimVideo(filePath, event.file.id.toString(), duration);
                finalFilePath = `${filePathWithNoExtensions}-trimmed.mp4`;
            } else {
                finalFilePath = filePath;
            }

            vdocipherQueue.push({
                filePath: finalFilePath,
                url,
                accessKey,
                lessonID,
                fileID: vdocipherFolderID,
                guid: videoInfo.videoId,
                additionalData: videoInfo.clientPayload,
            }, (err) => {
                if (err) {
                    console.log('task_failed', err);

                    updateLesson(lessonID, "", 0);
                }
            })

            vdocipherQueue.on('task_finish', async (taskId: any, result: any, stats: any) => {
                console.log('task_finish', taskId, result, stats);
                await updateLesson(result.lessonID, result.guid, 1);
                await fs.promises.unlink(filePath);
            })

            vdocipherQueue.on('task_failed', async (result: any, err: any, stats: any) => {
                console.log('task_failed', result, err, stats);

                updateLesson(result.lessonID, "", 0);
                await fs.promises.unlink(filePathWithNoExtensions);
            })
        } catch (e) {
            console.log('task_failed', e);
            updateLesson(lessonID, "", 0);
        }
    }
});

const app = express();
const port = 8080;
const uploadApp = express();
uploadApp.all('*', uploadServer.handle.bind(uploadServer));

app.use('/files', uploadApp);

// Parse JSON bodies
app.use(bodyParser.json());

// Parse URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled Rejection at:', promise, 'reason:', reason);
    // Application specific logging, throwing an error, or other logic here
});


app.use('/videos', express.static(path.join(__dirname, '..', 'files')), serveIndex(path.join(__dirname, '..', 'files'), { 'icons': true }))

const router = express.Router();

router.get('/import/youtube/vdocipher', vdocipherYoutubeDownloadHandler);
router.get('/import/youtube/bunny', bunnyYoutubeDownloadHandler);
router.post('/import/multi/youtube/vdocipher', multipleYoutubeDownloadHandler);

app.use(router);

const server = app.listen(port, () => {
    console.log(`upload app listening at http://localhost:${port}`)
})

server.on('connection', function (socket) {
    socket.setTimeout(60 * 60 * 1000);
});

