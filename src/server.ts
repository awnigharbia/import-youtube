import bodyParser from 'body-parser';
import express from 'express';
import { getYoutubeFormats } from './youtube-import/youtubeInfo';
import { bunnyYoutubeDownloadHandler, multipleYoutubeDownloadHandler, vdocipherYoutubeDownloadHandler } from './youtube-import/YoutubeImportHander';

const app = express();
const port = 8080;
const uploadApp = express();

app.use('/files', uploadApp);

// Parse JSON bodies
app.use(bodyParser.json());

// Parse URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

process.on('unhandledRejection', (reason, promise) => {
    // console.log('Unhandled Rejection at:', promise, 'reason:', reason);
    // Application specific logging, throwing an error, or other logic here
});

const router = express.Router();

router.get('/import/youtube/vdocipher', vdocipherYoutubeDownloadHandler);
router.get('/import/youtube/bunny', bunnyYoutubeDownloadHandler);
router.post('/import/multi/youtube/vdocipher', multipleYoutubeDownloadHandler);

router.get('/fetch/youtube', getYoutubeFormats);

app.use(router);

const server = app.listen(port, async () => {
    console.log(`upload app listening at http://localhost:${port}`)
})

server.on('connection', function (socket) {
    socket.setTimeout(60 * 60 * 1000);
});

