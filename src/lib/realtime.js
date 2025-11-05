/**
 * OpenAI Realtime API 관련 함수들
 */

/**
 * Realtime 세션 상태
 */
export function createRealtimeState() {
	return {
		session: null,
		isConnected: false,
		status: 'disconnected', // disconnected, connecting, connected, speaking, listening
		conversationText: '',
		transcriptBuffer: ''
	};
}

/**
 * Realtime 세션 연결
 * @param {object} state - Realtime 상태 객체
 * @param {function} onError - 에러 발생 시 콜백
 * @param {function} onEvent - 이벤트 발생 시 콜백
 * @param {function} onStatusUpdate - 상태 업데이트 콜백
 */
export async function connectRealtime(state, onError, onEvent, onStatusUpdate) {
	try {
		state.status = 'connecting';

		// Ephemeral client secret 가져오기
		const response = await fetch('/api/realtime', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Failed to get client secret');
		}

		const { clientSecret } = await response.json();

		// WebRTC 연결 설정
		const pc = new RTCPeerConnection({
			iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
		});

		// 마이크 스트림 가져오기
		const micStream = await navigator.mediaDevices.getUserMedia({ 
			audio: {
				channelCount: 1,
				sampleRate: 24000,
				echoCancellation: true,
				noiseSuppression: true
			}
		});

		// 오디오 출력을 위한 AudioContext
		const audioCtx = new (window.AudioContext || window.webkitAudioContext)({
			sampleRate: 24000
		});

		// 마이크 입력 추가
		micStream.getTracks().forEach(track => {
			pc.addTrack(track, micStream);
		});

		// 원격 오디오 처리
		pc.ontrack = (event) => {
			const [remoteStream] = event.streams;
			const remoteAudioElement = new Audio();
			remoteAudioElement.srcObject = remoteStream;
			remoteAudioElement.autoplay = true;
			remoteAudioElement.play().catch(console.error);
		};

		// SDP offer 생성
		const offer = await pc.createOffer({
			offerToReceiveAudio: true,
			offerToReceiveVideo: false
		});
		await pc.setLocalDescription(offer);

		// OpenAI Realtime API에 SDP 전송
		const sdpResponse = await fetch('https://api.openai.com/v1/realtime/calls', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${clientSecret}`,
				'Content-Type': 'application/sdp'
			},
			body: offer.sdp
		});

		if (!sdpResponse.ok) {
			throw new Error('Failed to establish WebRTC connection');
		}

		const answerSdp = await sdpResponse.text();
		const answer = { type: 'answer', sdp: answerSdp };
		await pc.setRemoteDescription(answer);

		// WebSocket 연결 (이벤트 처리용)
		const wsUrl = `wss://api.openai.com/v1/realtime?model=gpt-realtime&client_secret=${clientSecret}`;
		const ws = new WebSocket(wsUrl);

	ws.onopen = () => {
		// WebSocket 연결 성공 시 상태 업데이트
			state.isConnected = true;
			state.status = 'connected';
			if (onStatusUpdate) {
				onStatusUpdate({
					status: 'connected',
					isConnected: true,
					isListening: true,
					isSpeaking: false
				});
			}

			// 세션 설정 - 한국어 강제
			ws.send(JSON.stringify({
				type: 'session.update',
				session: {
					type: 'realtime',
					instructions: 'You are a helpful and friendly assistant. You MUST speak ONLY in Korean. Always respond in Korean language. Never use English or any other language. Speak naturally and conversationally. Keep responses concise and engaging. 모든 대화는 반드시 한국어로만 진행합니다.',
					audio: {
						output: {
							voice: 'alloy'
						}
					}
				}
			}));
		};

	ws.onmessage = (event) => {
		const data = JSON.parse(event.data);
		handleRealtimeEvent(state, data, onStatusUpdate);
		if (onEvent) {
			onEvent(data);
		}
	};

		ws.onerror = (error) => {
			console.error('WebSocket error:', error);
			const message = 'Realtime 연결 오류가 발생했습니다.';
			state.status = 'disconnected';
			state.isConnected = false;
			
			if (onStatusUpdate) {
				onStatusUpdate({
					status: 'disconnected',
					isConnected: false,
					error: message
				});
			}
			
			if (onError) {
				onError(message);
			}
		};

		ws.onclose = () => {
			state.status = 'disconnected';
			state.isConnected = false;
		};

		state.session = { pc, ws, micStream, audioCtx };
		state.isConnected = true;
		state.status = 'connected';
		
		// 상태 업데이트 콜백 호출 (즉시 UI 업데이트)
		if (onStatusUpdate) {
			onStatusUpdate({ 
				status: 'connected', 
				isConnected: true 
			});
		}
	} catch (error) {
		console.error('Realtime 연결 실패:', error);
		const message = error.message || 'Realtime 연결에 실패했습니다.';
		state.status = 'disconnected';
		if (onError) {
			onError(message);
		}
	}
}

/**
 * Realtime 이벤트 처리
 * @param {object} state - Realtime 상태 객체
 * @param {object} event - 이벤트 데이터
 * @param {function} onStatusUpdate - 상태 업데이트 콜백
 */
function handleRealtimeEvent(state, event, onStatusUpdate) {
	let updates = {};

	switch (event.type) {
		case 'response.output_text.delta':
			state.transcriptBuffer += event.delta;
			state.conversationText += event.delta;
			updates = {
				conversationText: state.conversationText,
				status: state.status
			};
			break;

		case 'response.output_text.done':
			state.conversationText += '\n';
			state.transcriptBuffer = '';
			updates = {
				conversationText: state.conversationText,
				status: state.status
			};
			break;

		case 'response.output_audio.delta':
			// 오디오 델타는 WebRTC를 통해 자동으로 처리됨
			break;

		case 'response.output_audio.done':
			state.status = 'listening';
			updates = { 
				status: 'listening',
				isListening: true,
				isSpeaking: false
			};
			break;

		case 'conversation.item.input_audio_transcription.completed':
			state.status = 'speaking';
			updates = { 
				status: 'speaking',
				isListening: false,
				isSpeaking: true
			};
			break;

		case 'session.created':
		case 'session.updated':
			state.status = 'connected';
			state.isConnected = true;
			updates = { 
				status: 'connected', 
				isConnected: true,
				isListening: true,
				isSpeaking: false
			};
			break;

		case 'session.error':
			state.status = 'error';
			updates = {
				status: 'error',
				isConnected: false,
				error: event.error || '연결 오류가 발생했습니다'
			};
			break;

		case 'session.closed':
			state.status = 'disconnected';
			updates = {
				status: 'disconnected',
				isConnected: false,
				isListening: false,
				isSpeaking: false
			};
			break;
	}

	// 상태 업데이트가 있는 경우에만 콜백 호출
	if (Object.keys(updates).length > 0 && onStatusUpdate) {
		onStatusUpdate(updates);
	}
}

/**
 * Realtime 세션 종료
 * @param {object} state - Realtime 상태 객체
 */
export async function disconnectRealtime(state, onStatusUpdate = null) {
	if (!state.session) return;
	
	const { ws, pc, micStream, audioCtx } = state.session;
	
	// WebSocket 연결 종료
	if (ws) {
		ws.close();
	}

	// WebRTC 연결 종료
	if (pc) {
		pc.close();
	}

	// 마이크 스트림 종료
	if (micStream) {
		micStream.getTracks().forEach(track => track.stop());
	}

	// 오디오 컨텍스트 종료
	if (audioCtx) {
		await audioCtx.close();
	}
	
	// 상태 초기화
	state.session = null;
	state.isConnected = false;
	state.status = 'disconnected';
	state.transcriptBuffer = '';
	
	// 상태 업데이트 콜백 호출
	if (onStatusUpdate) {
		onStatusUpdate({
			status: 'disconnected',
			isConnected: false,
			isListening: false,
			isSpeaking: false
		});
	}
}

