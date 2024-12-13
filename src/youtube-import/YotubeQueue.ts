import Queue from 'better-queue';
import { UploadInfo } from '../uploadBunny';
import { downloadAndConvertYoutubeVideo } from './YoutubeDownloader';
import { vdocipherUploadHandler } from './VdocipherUploadHandler';
import { bunnyUploadHandler } from './BunnyUploadHandler';
import { deleteFile } from '../utils';

export var currentYoutubeJobs = 0;

var youtubeQueue = new Queue<UploadInfo>(async (task: UploadInfo, callback) => {
    try {
        console.log(`Starting download queue for video:${task.videoID}, lesson:${task.lessonID}, lib:${task.libId}`);
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

        console.log('Clean video files after uploading');
        deleteFile(videoUrl ?? '');
        console.log('Done.');

        task.filePath = videoUrl;
        task.guid = guid;
        callback(null, task);
    } catch (err) {
        console.log('Error in youtubeQueue: ', err);
        callback(task);
    }
}, { concurrent: 1 })


export {
    youtubeQueue
};
