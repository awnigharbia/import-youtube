import ytdl from 'youtube-dl-exec';

async function download() {
    const data = ytdl('https://www.youtube.com/watch?v=IJHrPjx4egM', {
        dumpSingleJson: true,
        noWarnings: true,
        cookies: 'cookie.txt'
    })
}

download();