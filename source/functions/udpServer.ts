import dgram from 'dgram';
import {useEffect} from 'react';
import useBroadcast from './broadcast.js';
import {addDiscoveredPeer} from '../stores/peersStore.js';
import chalk from 'chalk';

type UdpMsgType = {
	method: string;
	name: string;
	id: string;
	ip: string;
	httpPort: number;
	isBroadcast: boolean;
};
export const useUdpServer = (
	MY_ID: string,
	NAME: string,
	BROADCAST_ADDR: string,
	MY_IP: string,
	UDP_PORT: number,
	HTTP_PORT: number,
) => {
	const {broadcast} = useBroadcast();

	useEffect(() => {
		const server = dgram.createSocket({
			type: 'udp4',
			reuseAddr: true,
		});
		server.bind({
			port: UDP_PORT,
			address: '0.0.0.0',
			exclusive: false,
		});
		server.setOption(dgram.SOL_SOCKET, dgram.SO_REUSEPORT, true, err => {
			if (err) {
				console.error('Error setting SO_REUSEPORT:', err);
				return;
			}

			console.log('SO_REUSEPORT option set successfully');
		});

		const msg: UdpMsgType = {
			method: 'SELF',
			name: NAME,
			id: MY_ID,
			ip: MY_IP,
			httpPort: HTTP_PORT,
			isBroadcast: true,
		};

		const initialBroadcast = () => {
			broadcast(server, BROADCAST_ADDR, UDP_PORT, JSON.stringify(msg));
		};

		server.on('listening', function () {
			const address = server.address();
			console.log(`Listening on ${address.address}:${address.port}`);
			server.setBroadcast(true);

			initialBroadcast();
		});

		server.on('message', (receivedMsg, rinfo) => {
			const data: UdpMsgType = JSON.parse(receivedMsg?.toString());

			if (data.id == MY_ID) {
				return;
			}

			console.log(
				`${chalk.bgRed('<-- Received From:')} ${chalk.underline(data.name)}: ${
					data.id
				}`,
			);
			// console.log('DATA:', data);

			if (data?.method == 'SELF') {
				const isAlreadyAdded = !addDiscoveredPeer({
					id: data.id,
					ip: rinfo.address,
					name: data.name,
					httpPort: data?.httpPort,
				});

				if (!isAlreadyAdded || data?.isBroadcast) {
					const message = JSON.stringify({
						...msg,
						isBroadcast: false,
					});

					server.send(message, rinfo.port, rinfo.address);
				}
			}
		});

		server.on('error', err => {
			console.error(`server error:\n${err.stack}`);
			server.close();
		});

		return () => {
			server.close();
		};
	}, []);
};
