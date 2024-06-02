import React, {useCallback, useEffect} from 'react';
import {Box, Text} from 'ink';
import {Spinner} from './Misc/Spinner.js';
import {useStore} from '@nanostores/react';
import {$baseInfo, $users} from '../stores/baseStore.js';
import {useUdpServer} from '../functions/udpServer.js';
import {hasNullValue} from '../functions/helper.js';
import SenderList from './Misc/UserList.js';
import {useHttpServer} from '../functions/httpServer.js';

const Discover = () => {
	const baseInfo = useStore($baseInfo);
	const peers = useStore($users);

	if (
		!baseInfo.MY_NAME ||
		!baseInfo.BROADCAST_ADDR ||
		!baseInfo.MY_IP ||
		!baseInfo.UDP_PORT
	) {
		throw new Error('Base Info Data not set properly');
	}

	// const sendHttpDiscoverMe = useCallback(
	// 	(_IP: string) => {
	// 		const data = {
	// 			name: baseInfo.MY_NAME,
	// 			ip: baseInfo.MY_IP,
	// 		};

	// 		const url = `http://${_IP}:${baseInfo.HTTP_PORT}/discover`;
	// 		fetch(url, {
	// 			method: 'POST',
	// 			headers: {
	// 				'Content-Type': 'application/json',
	// 			},
	// 			body: JSON.stringify(data),
	// 		})
	// 			.then(response => response.json())
	// 			.then(data => {
	// 				console.log(data);
	// 			})
	// 			.catch(error => {
	// 				console.error('Error:', error);
	// 			});
	// 	},
	// 	[baseInfo, baseInfo?.HTTP_PORT],
	// );

	useUdpServer(
		baseInfo.MY_NAME,
		baseInfo.BROADCAST_ADDR,
		baseInfo.MY_IP,
		baseInfo.UDP_PORT,
		baseInfo.HTTP_PORT,
		// sendHttpDiscoverMe,
	);

	// useHttpServer(baseInfo.MY_IP, baseInfo.HTTP_PORT);

	return (
		<Box flexDirection="column">
			{true && (
				<Text>
					<Spinner /> Discovering
				</Text>
			)}
			{users && <SenderList users={users} />}
		</Box>
	);
};

export default Discover;
