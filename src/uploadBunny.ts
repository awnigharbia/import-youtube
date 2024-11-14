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


async function uploadVideo(uploadInfo: UploadInfo): Promise<any> {
    try {
        const fileData = fs.readFileSync(uploadInfo.filePath!);
        const options = {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/octet-stream', // when dealing with files, use 'application/octet-stream'
                'AccessKey': uploadInfo.accessKey!
            },
            body: fileData
        };

        const response = await fetch(uploadInfo.url!, options);
        if (!response.ok) throw new Error(`unexpected response ${response.statusText}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('error:', error);
        throw error;
    }
}

export {
    createVideo,
    uploadVideo,
    UploadInfo,
}