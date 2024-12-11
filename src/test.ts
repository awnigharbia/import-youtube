import YtdlCore from "@ybd-project/ytdl-core";

const ytdl = new YtdlCore();

async function download() {
    // Attempt to get the video info using the current credentials set
    const videoData = await ytdl.getFullInfo('IJHrPjx4egM', {
        oauth2Credentials: {
            accessToken: 'ya29.a0AeDClZBdO6YcJNGcr5z4mEY3lwRc-heAxw1GACIovmhb_CrABAK5W9iRM1T79ks0fcIGGh60muDrHDMUzIV3Mkm6-au48zl9nQAWmsvVhBM86IH8ZypxrNAyWcTtfXlPlOx5EIQgmj3i5Wa_UZowx2DB6zlwPPFM2WMJOokPdPcwDZtmvfN7aCgYKAdkSARASFQHGX2MiyerpHGw-H0Qlpi7QEV535w0187',
            refreshToken: '1//03FAMNvnO3Cq5CgYIARAAGAMSNwF-L9Ir7-hOfdtW_kAFbYb3WcHM7EyDOV6OR7MsbiheJo2tq4HDAl54b9zBnnUiquy44QMi9mI',
            expiryDate: '2024-12-12T06:00:14.017Z',
        },
        disableDefaultClients: true,
        clients: ['android', 'ios', 'tv']
    });

    console.log(videoData);

}

download();