import React, {useEffect, useMemo, useState} from 'react';
import {Box, Newline, Text, useInput, useStdin} from 'ink';
import {ConnectedPeersType} from '../../stores/peersStore.js';
import {useFileDownloader} from '../../functions/useFileDownloader.js';

type PropsType = {
	peers: ConnectedPeersType;
};

export default function PeerList({peers}: PropsType) {
	if (!peers) throw new Error('No sender found');

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

			console.log(selectedPeer);

			fileNames?.forEach(fileName => {
				console.log(`Downloading: ${fileName}`);
				useFileDownloader(selectedPeer.ip, selectedPeer.httpPort, fileName);
			});
		}
	});

	const handleSelect = (item: any) => {
		console.log(item);
	};

	return (
		<Box flexDirection="column" marginTop={1} marginLeft={1}>
			{Object.keys(peers).map(key => (
				<Box
					key={key}
					borderColor={key === peersIds[selectedIndex] ? 'green' : 'black'}
					borderStyle={key === peersIds[selectedIndex] ? 'bold' : 'single'}
					paddingX={1}
				>
					<Text>{peers[key]?.name}</Text>
					<Text>{peers[key]?.sendFileNames?.toString()}</Text>
				</Box>
			))}
		</Box>
	);
}
