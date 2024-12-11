import youtubeDl from "youtube-dl-exec";

async function download() {
    const res = await youtubeDl('https://youtu.be/IJHrPjx4egM', {
        dumpSingleJson: true,
        cookies: './cookies.txt',
    })

    console.log(res);

}

download();