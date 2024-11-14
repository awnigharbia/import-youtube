import process from 'process';
import dotenv from 'dotenv';

dotenv.config()

// get the root dir of the project
const rootDir = process.cwd();


// create a config object
const config = {
    ffprobe: process.env.FFPROBE_PATH,
    ffmpeg: process.env.FFMPEG_PATH,
    rootDir,
}

// export the config object
export default config