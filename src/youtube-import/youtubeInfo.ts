import ytdl, { Payload } from 'youtube-dl-exec'
import { Request, Response } from "express";
import { isLinkReady } from '../utils';

// export const getYoutubeFormats = async (req: Request, res: Response) => {
//     const videoId = req.query.id as string;

//     try {
//         const data = await ytdl(`https://www.youtube.com/watch?v=${videoId}`, {
//             dumpSingleJson: true,
//             noWarnings: true,
//             quiet: true,
//             skipDownload: true,

//         });

//         let videoFormat = (data as Payload).formats.find(format =>
//             format.vcodec !== 'none' && format.ext === 'mp4' && format.protocol === 'https' && format.format_note === '1080p' && format.audio_ext === 'none'
//         );

//         if (!videoFormat) {
//             videoFormat = (data as Payload).formats.find(format =>
//                 format.vcodec !== 'none' && format.ext === 'mp4' && format.protocol === 'https' && format.format_note === '720p' && format.audio_ext === 'none'
//             );
//         }

//         let audioFormat = (data as Payload).formats.find(format =>
//             format.format_note === 'medium' && format.ext === 'webm' && format.protocol === 'https' && format.audio_ext === 'webm'
//         );

//         if (!videoFormat) {
//             audioFormat = (data as Payload).formats.find(format =>
//                 format.format_note === 'low' && format.ext === 'webm' && format.protocol === 'https' && format.audio_ext === 'webm'
//             );
//         }

//         // res.json((data as Payload).formats)
//         if (videoFormat && audioFormat) {
//             res.json({ video: videoFormat.url, audio: audioFormat.url });
//         } else {
//             res.status(404).json({ error: 'Suitable video format not found' });
//         }
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to fetch video formats', details: error });
//     }
// }


export const getYoutubeFormats = async (req: Request, res: Response) => {
    const videoId = req.query.id as string;

    try {
        const data = await ytdl(`https://www.youtube.com/watch?v=${videoId}`, {
            dumpSingleJson: true,
            noWarnings: true,
            quiet: true,
            skipDownload: true,
        });

        const videoFormats = (data as Payload).formats.filter(format =>
            format.vcodec !== 'none' && format.ext === 'mp4' && format.protocol === 'https' && format.audio_ext === 'none'
        );

        const audioFormats = (data as Payload).formats.filter(format =>
            format.ext === 'webm' && format.protocol === 'https' && format.audio_ext === 'webm'
        );

        let videoFormat = null;
        let audioFormat = null;

        // Find the first video link that is ready
        for (const format of videoFormats) {
            if (await isLinkReady(format.url)) {
                videoFormat = format;
                break;
            }
        }

        // Find the first audio link that is ready
        for (const format of audioFormats) {
            if (await isLinkReady(format.url)) {
                audioFormat = format;
                break;
            }
        }

        if (videoFormat && audioFormat) {
            res.json({ video: videoFormat.url, audio: audioFormat.url });
        } else {
            res.status(404).json({ error: 'Suitable video or audio format not found' });
        }
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch video formats', details: error.message });
    }
};