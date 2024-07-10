import React, {useEffect, useMemo, useState} from 'react';
import {Box, Newline, Text, useInput, useStdin} from 'ink';
import {ConnectedPeersType} from '../../stores/peersStore.js';
import {useFileDownloader} from '../../functions/useFileDownloader.js';
import {useStore} from '@nanostores/react';
import {$transferInfo} from '../../stores/fileHandlerStore.js';
import FileTransferProgress from './FileTransferProgress.js';
import ProgressBar from 'ink-progress-bar';

type PropsType = {
	peers: ConnectedPeersType;
};

export default function PeerList({peers}: PropsType) {
	if (!peers) throw new Error('No sender found');

	const transferInfo = useStore($transferInfo);

	const peersIds = useMemo(() => Object.keys(peers).map(key => key), [peers]);
	const [selectedIndex, setSelectedIndex] = useState<number>(0);

	useInput((input, key) => {
		if (key.downArrow) {
			setSelectedIndex(prevIndex => (prevIndex + 1) % peersIds.length);
		} else if (key.upArrow) {
			setSelectedIndex(
				prevIndex => (prevIndex - 1 + peersIds.length) % peersIds.length,
			);
		} else if (key.return) {
			const peerID = peersIds[selectedIndex];
			if (!peerID) {
				console.log('Peer ID not found');
				return;
			}
			const selectedPeer = peers[peerID];
			const fileNames = selectedPeer?.sendFileNames;

			if (!selectedPeer) {
				console.log('Selected Peer not found');
				return;
			}

			// console.log(selectedPeer);

			fileNames?.forEach(async fileName => {
				console.log(`Downloading: ${fileName}`);
				await useFileDownloader(
					selectedPeer.id,
					selectedPeer.ip,
					selectedPeer.httpPort,
					fileName,
				);
			});
		}
	});

	return (
		<Box flexDirection="column" marginTop={1} marginLeft={1}>
			{Object.keys(peers).map(key => (
				<Box flexDirection="column">
					<Box
						key={key}
						borderColor={key === peersIds[selectedIndex] ? 'green' : 'black'}
						borderStyle={key === peersIds[selectedIndex] ? 'bold' : 'single'}
						paddingX={1}
					>
						<Text>{peers[key]?.name}</Text>
						<Text>{peers[key]?.sendFileNames?.toString()}</Text>
					</Box>
					<Text>{peers[key]?.name}</Text>
					{transferInfo[key] && (
						<FileTransferProgress
							peerID={key}
							transferData={transferInfo[key]!}
						/>
					)}
				</Box>
			))}

			<ProgressBar left={50} percent={70} />
		</Box>
	);
}
