
import * as fs from 'fs';
import request from 'request';
import { UploadInfo } from './uploadBunny';

async function createVdocipherVideo(filename: string, fileId: string) {
    const options = {
        method: "PUT",
        url: "https://dev.vdocipher.com/api/videos",
        qs: { title: filename, folderId: fileId },
        headers: { Authorization: "Apisecret BaKF1pCeOhosgNHLhWsHYZcRIGn8BDSbOTCUvb7yyCyJwWIGlcJJHd99U6rP7Sge" },
    };

    const params = new URLSearchParams(options.qs);
    const url = `${options.url}?${params.toString()}`;

    const response = await fetch(url, {
        method: options.method,
        headers: options.headers,
    });

    if (!response.ok) throw new Error(`unexpected response ${response.statusText}`);
    const data = await response.json();
    return data;
}


// async function uploadVdocipherVideo(uploadInfo: UploadInfo): Promise<any> {
//     const formData = new FormData();
//     const file: any = fs.createReadStream(uploadInfo.filePath);
//     console.log(uploadInfo.additionalData);

//     formData.append("policy", uploadInfo.additionalData.policy);
//     formData.append("key", uploadInfo.additionalData.key);
//     formData.append("x-amz-signature", uploadInfo.additionalData["x-amz-signature"]);
//     formData.append("x-amz-algorithm", uploadInfo.additionalData["x-amz-algorith"]);
//     formData.append("x-amz-date", uploadInfo.additionalData["x-amz-date"]);
//     formData.append("x-amz-credential", uploadInfo.additionalData["x-amz-credential"]);
//     formData.append("success_action_status", "201");
//     formData.append("success_action_redirect", "");
//     formData.append("file", file, 'video.mp4');

//     const options: RequestInit = {
//         method: "POST",
//         body: formData,
//     };

//     try {
//         const response = await fetch(uploadInfo.additionalData.uploadLink, options);
//         if (!response.ok) {
//             throw new Error(`Request failed with status ${response.status}`);
//         }
//         const body = await response.text();
//         console.log(body);
//     } catch (error) {
//         console.error(error);
//         throw error;
//     }
// }

async function uploadVdocipherVideo(uploadInfo: UploadInfo): Promise<any> {
    var options = {
        method: "POST",
        url: uploadInfo.additionalData.uploadLink,
        headers: { "content-type": "multipart/form-data" },
        formData: {
            policy: uploadInfo.additionalData.policy,
            key: uploadInfo.additionalData.key,
            "x-amz-signature": uploadInfo.additionalData["x-amz-signature"],
            "x-amz-algorithm": uploadInfo.additionalData["x-amz-algorithm"],
            "x-amz-date": uploadInfo.additionalData["x-amz-date"],
            "x-amz-credential": uploadInfo.additionalData["x-amz-credential"],
            success_action_status: "201",
            success_action_redirect: "",
            file: {
                value: fs.createReadStream(uploadInfo.filePath!),
                options: { filename: "fileName.mp4", contentType: 'mp4' },
            },
        },
    };

    try {
        return new Promise((resolve, reject) => {
            request(options, (error, response, body) => {
                if (error) {
                    reject(new Error(error));
                } else if (response.statusCode >= 200 && response.statusCode < 300) {
                    console.log(body);
                    resolve(body);
                } else {
                    reject(new Error(`Failed with status code: ${response.statusCode}`));
                }
            });
        });
    } catch (error: any) {
        throw new Error(error);
    }
}


export {
    createVdocipherVideo,
    uploadVdocipherVideo
}