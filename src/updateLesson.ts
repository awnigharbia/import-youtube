import axios, { AxiosRequestConfig } from "axios";

function updateLesson(lessonID: string, guid: string, status?: number, dev?: boolean): Promise<any> {
    console.log(JSON.stringify({ lesson_id: lessonID, guid, "status_node": `${status}` }));

    const url = dev === true ? `https://dev.mz-academy.com/api/update_lesson_server` : `https://mz-academy.com/api/update_lesson_server`;
    const options: AxiosRequestConfig = {
        method: 'POST',
        headers: {
            accept: 'application/json',
            'content-type': 'application/*+json',
            'User-Agent': 'dart',
        },
        data: JSON.stringify({ lesson_id: parseInt(lessonID), guid, "status_node": status })
    };

    return axios(url, options)
        .then(res => res.data)
        .catch(err => {
            console.error(`Error updating lesson ${lessonID}:`);
            throw err;
        });
}

export {
    updateLesson,
}
