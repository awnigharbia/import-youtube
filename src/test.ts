import ytdl from 'youtube-dl-exec';

async function download() {
    const data = ytdl('https://www.youtube.com/watch?v=5qap5aO4i9A', {
        dumpSingleJson: true,
        noWarnings: true,
        cookies: 'cookie.txt'
    })
}

download();