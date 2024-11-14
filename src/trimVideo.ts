import { exec } from "child_process";
import { promisify } from 'util';
import config from "./config/config";

const ffmpegPath = config.ffmpeg;
const execPromise = promisify(exec);

export default function trimVideo(filePath: string, filename: string, duration?: string) {
    const convertedDuration = duration ? duration : '0';
    const command = `${ffmpegPath} -ss ${convertedDuration} -i ${filePath} -c copy ./files/${filename}-trimmed.mp4`;

    return execPromise(command);
}