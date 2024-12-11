import { createVdocipherVideo, uploadVdocipherVideo } from '../uploadVdocipher';

interface VdocipherProperties { videoUrl: string, libId: string, videoID: string, lessonID: string }

export const vdocipherUploadHandler = async ({ videoUrl, libId, videoID, lessonID }: VdocipherProperties): Promise<string> => {
    // required for uploading
    const vdocipherFolderID = libId!;
    const fileNameForBunny = `lesson-${videoID}-${lessonID}`;

    console.log(`Creating video for vdocipher with lesson id:${videoID}`);
    const videoInfo = await createVdocipherVideo(fileNameForBunny, vdocipherFolderID);
    console.log(`Finished`);

    const url = `https://dev.vdocipher.com/api/videos?title=${fileNameForBunny}&folderId=${vdocipherFolderID}`;
    const accessKey = "BaKF1pCeOhosgNHLhWsHYZcRIGn8BDSbOTCUvb7yyCyJwWIGlcJJHd99U6rP7Sge";

    console.log(`Start uploading video for vdocipher with lesson id:${videoID}`);
    console.log(`Video url is ${videoUrl}`);

    await uploadVdocipherVideo({
        filePath: videoUrl,
        url,
        accessKey,
        additionalData: videoInfo.clientPayload
    });

    console.log(`Finished with ${fileNameForBunny}`);
    return videoInfo.videoId;
}

