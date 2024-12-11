import { createVideo, uploadBunnyVideo } from '../uploadBunny';

interface BunnyProperties { videoUrl: string, accessKey: string, libId: string, videoID: string, lessonID: string }

export const bunnyUploadHandler = async ({ videoUrl, libId, accessKey, videoID, lessonID }: BunnyProperties): Promise<string> => {
    const fileNameForBunny = `lesson-${videoID}-${lessonID}`;

    const { guid } = await createVideo(fileNameForBunny, libId, accessKey);

    const url = `https://video.bunnycdn.com/library/${libId}/videos/${guid}`;

    console.log(`Start uploading video for bunny with lesson id:${videoID}`);
    console.log(`Video url is ${videoUrl}`);

    await uploadBunnyVideo({
        filePath: videoUrl,
        url,
        accessKey,
    });

    console.log(`Finished with ${fileNameForBunny}`);
    return guid;
}

