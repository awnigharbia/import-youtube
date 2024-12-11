import ytdl, { Payload } from 'youtube-dl-exec'
import { Request, Response } from "express";

export const getYoutubeFormats = async (req: Request, res: Response) => {
    const videoId = req.query.id as string;

    try {
        const data = await ytdl(`https://www.youtube.com/watch?v=${videoId}`, {
            dumpSingleJson: true,
            noWarnings: true,
            quiet: true,
            skipDownload: true,

        });

        let videoFormat = (data as Payload).formats.find(format =>
            format.vcodec !== 'none' && format.ext === 'mp4' && format.protocol === 'https' && format.format_note === '1080p' && format.audio_ext === 'none'
        );

        if (!videoFormat) {
            videoFormat = (data as Payload).formats.find(format =>
                format.vcodec !== 'none' && format.ext === 'mp4' && format.protocol === 'https' && format.format_note === '720p' && format.audio_ext === 'none'
            );
        }

        let audioFormat = (data as Payload).formats.find(format =>
            format.format_note === 'medium' && format.ext === 'webm' && format.protocol === 'https' && format.audio_ext === 'webm'
        );

        if (!videoFormat) {
            audioFormat = (data as Payload).formats.find(format =>
                format.format_note === 'low' && format.ext === 'webm' && format.protocol === 'https' && format.audio_ext === 'webm'
            );
        }

        res.json((data as Payload).formats)
        if (videoFormat && audioFormat) {
            res.json({ video: videoFormat.url, audio: audioFormat.url });
        } else {
            res.status(404).json({ error: 'Suitable video format not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch video formats', details: error });
    }
}