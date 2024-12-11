const { downloadVideo } = require('yt-dlp-video');

// Download video in best quality MP4 format
async function download() {
    await downloadVideo('https://www.youtube.com/watch?v=IJHrPjx4egM');
}

download();