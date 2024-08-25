import fs from 'fs';
import {
	CurrTransferPeerInfo,
	updateTransferFileErrorMsg,
	updateTransferFileState,
	updateTransferProgress,
} from '@/stores/fileHandlerStore.js';
import {RECEIVE_PATH} from '@/functions/variables.js';
import {useHashCheck} from '@/functions/useHashCheck.js';
import readlineSync from 'readline-sync';
import {log} from '@/functions/log.js';
import {fileExists} from '@/functions/helper.js';

export const checkDuplication = (
	FILE_ID: string,
	fileName: string,
): Promise<boolean> => {
	return new Promise<boolean>(async (resolve, reject) => {
		try {
			const isDuplicate = fileExists(`${RECEIVE_PATH}/${fileName}`);
			if (isDuplicate) {
				if (readlineSync.keyInYN('Do you want this module?')) {
					resolve(true);
				} else {
					updateTransferFileState(FILE_ID, 'ERROR');
					updateTransferFileErrorMsg(FILE_ID, 'File already exist!');
					resolve(false);
				}
			} else {
				resolve(true);
			}
		} catch (error) {
			reject(error);
		}
	});
};
export const checkEnoughSpace = (
	FILE_ID: string,
	fileSize: number,
): Promise<boolean> => {
	return new Promise<boolean>(async (resolve, reject) => {
		try {
			const isNotEnoughSpace = fileSize > 999999;
			if (isNotEnoughSpace) {
				updateTransferFileState(FILE_ID, 'ERROR');
				updateTransferFileErrorMsg(FILE_ID, 'Not enough space!');
				resolve(false);
			} else {
				resolve(true);
			}
		} catch (error) {
			reject(error);
		}
	});
};

export const performSingleDownloadSteps = async (
	fileID: string,
	fileName: string,
	fileSize: number,
	peer: CurrTransferPeerInfo,
) => {
	const isNoDuplicationIssue = await checkDuplication(fileID, fileName);
	const isNoSpaceIssue = await checkEnoughSpace(fileID, fileSize);
	if (isNoDuplicationIssue && isNoSpaceIssue) {
		await useFileDownloader(peer.peerIP, peer.peerHttpPort, fileID, fileName);
		await useHashCheck(peer.peerIP, peer.peerHttpPort, fileID, fileName);
	}
};

// TODO:: Use Pipe Later
export const useFileDownloader = (
	PEER_IP: string,
	PEER_TCP_PORT: number,
	FILE_ID: string,
	FILENAME: string,
): Promise<void> => {
	const url = `http://${PEER_IP}:${PEER_TCP_PORT}/download/${FILENAME}`;
	const outputPath = `${RECEIVE_PATH}/${FILENAME}`;

	return new Promise<void>(async (resolve, reject) => {
		try {
			const res = await fetch(url);
			if (!res.ok) {
				throw new Error(
					res.status == 404 ? 'File not found!!!' : 'Failed to download file!',
				);
			}

			const totalLength = parseInt(
				res.headers.get('content-length') || '0',
				10,
			);
			const writer = fs.createWriteStream(outputPath);
			let downloaded = 0;
			let progress = 0;

			const reader = res.body!.getReader();

			const pump = async () => {
				try {
					const {done, value} = await reader.read();
					if (done) {
						writer.end();
						resolve();
						return;
					}
					writer.write(value);
					downloaded += value.length;
					progress = parseFloat(((downloaded / totalLength) * 100).toFixed(2));

					updateTransferProgress(FILE_ID, {
						state: progress < 100 ? 'TRANSFERRING' : 'TRANSFERRED',
						progress: progress,
						fileName: FILENAME,
						totalSize: totalLength,
						downloadedSize: downloaded,
					});

					await pump();
				} catch (error) {
					writer.end();
					updateTransferFileState(FILE_ID, 'ERROR');
					updateTransferFileErrorMsg(FILE_ID, 'Failed to read file!');
					reject(new Error('Failed to read file'));
				}
			};

			writer.on('error', () => {
				reject(new Error('Failed to write file'));
			});

			await pump();
		} catch (error) {
			let errMsg = '';
			if (error instanceof Error) {
				errMsg = error.message;
			}
			updateTransferFileState(FILE_ID, 'ERROR');
			updateTransferFileErrorMsg(FILE_ID, errMsg);
			reject(error);
		}
	});
};
