import axios, { AxiosRequestConfig } from "axios";
import fs from "fs";


interface UploadInfo {
    videoID?: string;
    url?: string;
    libId?: string;
    accessKey?: string;
    filePath?: string;
    lessonID?: string;
    guid?: string;
    fileID?: string;
    additionalData?: any;
    type?: string;
    dev?: string;
}

function createVideo(title: string, libId: string, accessKey: string): Promise<any> {
    const url = `https://video.bunnycdn.com/library/${libId}/videos`;
    const options: AxiosRequestConfig = {
        method: 'POST',
        headers: {
            accept: 'application/json',
            'content-type': 'application/*+json',
            'AccessKey': accessKey,
        },
        data: JSON.stringify({ title })
    };

    return axios(url, options)
        .then(res => res.data)
        .catch(err => {
            console.error('error: ' + err);
            throw err;
        });
}


// async function uploadBunnyVideo(uploadInfo: UploadInfo): Promise<any> {
//     try {
// const fileData = fs.readFileSync(uploadInfo.filePath!);
//         const options = {
//             method: 'PUT',
//             headers: {
//                 'Content-Type': 'application/octet-stream', // when dealing with files, use 'application/octet-stream'
//                 'AccessKey': uploadInfo.accessKey!
//             },
//             body: fileData
//         };

//         const response = await fetch(uploadInfo.url!, options);
//         if (!response.ok) throw new Error(`unexpected response ${response.statusText}`);
//         const data = await response.json();
//         return data;
//     } catch (error) {
//         console.error('error:', error);
//         throw error;
//     }
// }


async function uploadBunnyVideo(uploadInfo: UploadInfo): Promise<any> {
    try {
        const fileStream = fs.createReadStream(uploadInfo.filePath!);

        const response = await axios.put(uploadInfo.url!, fileStream, {
            headers: {
                'Content-Type': 'application/octet-stream',
                'AccessKey': uploadInfo.accessKey!,
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        });

        return response.data;
    } catch (error) {
        console.error('error:', error);
        throw error;
    }
}


export {
    createVideo,
    uploadBunnyVideo,
    UploadInfo,
}