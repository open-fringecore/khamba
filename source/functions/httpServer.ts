import express from 'express';
import {useEffect} from 'react';
import fs from 'fs';
import path from 'path';
import {hashFile} from '@/functions/useHashCheck.js';
import {log, logError, logToFile} from '@/functions/log.js';
import {SEND_PATH} from '@/functions/variables.js';
import {SendingFiles} from '@/types/storeTypes.js';
import tar from 'tar-fs';
import {getFolderSize} from '@/functions/helper.js';

export const useHttpServer = (
	MY_IP: string,
	TCP_PORT: number,
	isSending: boolean,
	sendingFileNames: SendingFiles | null,
) => {
	useEffect(() => {
		const app = express();
		app.use(express.json());

		app.get('/', (req, res) => {
			res.json({
				msg: 'Hoe!',
			});
		});

		app.get('/get-active-peer-info', (req, res) => {
			res.json({
				isSending,
				sendingFileNames,
			});
		});

		app.get('/get-active-peer', (req, res) => {
			setTimeout(() => {
				res.json({active: true});
			}, 10000);
		});

		app.get('/download/*', (req, res) => {
			try {
				// const {filename} = req.params;
				const filename = (req.params as any)['0'];

				if (!filename) {
					return res.status(400).json({msg: 'filename required.'});
				}

				const filePath = path.join(SEND_PATH, filename);

				if (!fs.existsSync(filePath)) {
					return res.status(404).json({msg: 'File not found!', filePath});
				}

				const stat = fs.statSync(filePath);
				const fileSize = stat.size;

				res.setHeader('Content-Length', fileSize);
				res.setHeader(
					'Content-Disposition',
					`attachment; filename=${filename}`,
				);

				const fileStream = fs.createReadStream(filePath);
				fileStream.pipe(res);

				// res.download(filePath, path.basename(filePath), err => {
				// 	if (err) {
				// 		logError('Error downloading file:', err);
				// 		res.status(500).send('Error downloading file');
				// 	}
				// });
			} catch (error) {
				logError(error);
			}
		});

		app.get('/download-tar/*', (req, res) => {
			try {
				const foldername = (req.params as any)['0'];

				if (!foldername) {
					return res.status(400).json({msg: 'foldername required.'});
				}

				const folderPath = path.join(SEND_PATH, foldername);

				if (!fs.existsSync(folderPath)) {
					return res.status(404).json({msg: 'Folder not found!', folderPath});
				}

				const folderSize = getFolderSize(folderPath);

				console.log('====================================');
				console.log('folderSize', folderSize);
				console.log('folderPath', folderPath);
				console.log('====================================');

				res.setHeader('Content-Type', 'application/x-tar');
				res.setHeader('Content-Length', folderSize);
				res.setHeader(
					'Content-Disposition',
					`attachment; filename=${foldername}.tar`,
				);

				const pack = tar.pack(folderPath);

				pack.on('error', err => {
					console.error('Pack stream error:', err);
				});

				res.on('error', err => {
					console.error('Response stream error:', err);
				});

				res.on('close', () => {
					console.log('Response stream closed');
				});

				pack.on('data', chunk => {
					console.log(chunk.length);
				});

				pack.pipe(res);

				// pump(pack, res, err => {
				// 	if (err) {
				// 		console.error('Pump error:', err);
				// 		if (!res.headersSent) {
				// 			res.statusCode = 500;
				// 			res.end('Internal Server Error');
				// 		}
				// 	}
				// });
			} catch (error) {
				logError(error);
			}
		});

		app.get('/get-hash/*', async (req, res) => {
			try {
				// const {filename} = req.params;
				const filename = (req.params as any)['0'];

				if (!filename) {
					return res.status(400).json({msg: 'filename required.'});
				}

				const filePath = `${SEND_PATH}/${filename}`;

				if (!fs.existsSync(filePath)) {
					return res.status(404).json({msg: 'File not found!!'});
				}

				try {
					const hash = await hashFile(filePath);
					log(`Hash of the file is: ${hash}`);
					return res.status(200).json({msg: 'Hash Successful!', hash});
				} catch (err) {
					logError('Error hashing file:', err);
					return res.status(400).json({msg: 'Hash Failed!'});
				}
			} catch (error) {
				logError(error);
			}
		});

		const server = app.listen(TCP_PORT, MY_IP, () => {
			log(`Server is running on http://${MY_IP}:${TCP_PORT}`);
		});

		return () => {
			server.close(() => {
				log('Server stopped listening for requests.');
			});
		};
	}, []);
};
