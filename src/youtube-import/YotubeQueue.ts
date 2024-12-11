import Queue from 'better-queue';
import { UploadInfo } from '../uploadBunny';
import { downloadAndConvertYoutubeVideo } from './YoutubeDownloader';
import { vdocipherUploadHandler } from './VdocipherUploadHandler';
import { bunnyUploadHandler } from './BunnyUploadHandler';
import { redisClient } from '../server';

export var currentYoutubeJobs = 0;

var youtubeQueue = new Queue<UploadInfo>(async (task: UploadInfo, callback) => {
    try {
        console.log('Starting youtubeQueue');
        const videoUrl = await downloadAndConvertYoutubeVideo(task.videoID!);
        console.log(`Finished downloading from youtube with url:${videoUrl}`);

        let guid;
        if (task.type == 'vdocipher') {
            guid = await vdocipherUploadHandler(
                {
                    videoUrl: videoUrl!,
                    libId: task.libId!,
                    lessonID: task.lessonID!,
                    videoID: task.videoID!
                }
            );
        } else {
            guid = await bunnyUploadHandler(
                {
                    videoUrl: videoUrl!,
                    libId: task.libId!,
                    accessKey: task.accessKey!,
                    lessonID: task.lessonID!,
                    videoID: task.videoID!
                }
            );
        }

        task.filePath = videoUrl;
        task.guid = guid;
        if (task.videoID != null) {
            const videoData = JSON.stringify({ videoId: task.videoID, guid: guid, lessonId: task.lessonID, status: 'success' });
            await redisClient.set(task.videoID?.toString(), videoData)
        }

        callback(null, task);

    } catch (err) {
        console.log('Error in youtubeQueue: ', err);
        callback(task);
    }
}, { concurrent: 5 })


export {
    youtubeQueue
};
