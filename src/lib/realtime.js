/**
 * OpenAI Realtime API 관련 함수들
 */
import { get } from 'svelte/store';
import { getPromptForStyle, CONVERSATION_STYLES } from './conversationStyles.js';
import { debugStore } from './stores/debugStore.js';
import { realtimeStore } from './stores/realtimeStore.js';

/**
 * 메시지를 DB에 즉시 저장
 * @param {string} role - 역할 ('user' 또는 'assistant')
 * @param {string} content - 메시지 내용
 */
async function saveMessageToDB(role, content) {
	const storeState = get(realtimeStore);
	const conversationId = storeState.conversationId;

	if (!conversationId) {
		console.warn('대화 ID가 없어서 메시지를 저장하지 않습니다.');
		return;
	}

	if (!content || !content.trim()) {
		console.warn('메시지 내용이 비어있어서 저장하지 않습니다.');
		return;
	}

	try {
		const response = await fetch('/api/conversations/save-item', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				conversationId,
				role,
				content: content.trim()
			})
		});

		if (response.ok) {
			console.log(`✅ ${role === 'user' ? '사용자' : 'AI'} 메시지가 DB에 저장되었습니다.`);
			debugStore.addLog({
				type: 'success',
				message: `${role === 'user' ? '사용자' : 'AI'} 메시지 DB 저장 완료`,
				data: { role, contentLength: content.length }
			});
		} else {
			const error = await response.json();
			console.error('메시지 저장 실패:', error);
			debugStore.addLog({
				type: 'error',
				message: '메시지 DB 저장 실패',
				data: { error }
			});
		}
	} catch (error) {
		console.error('메시지 저장 오류:', error);
		debugStore.addLog({
			type: 'error',
			message: '메시지 DB 저장 오류',
			data: { error: error.message }
		});
	}
}

/**
 * Realtime 세션 상태
 */
export function createRealtimeState() {
	return {
		session: null,
		isConnected: false,
		status: 'disconnected', // disconnected, connecting, connected, speaking, listening
		conversationText: '',
		transcriptBuffer: '',
		currentUserInput: '', // 현재 사용자 입력 중인 텍스트
		currentAssistantResponse: '' // 현재 AI 응답 중인 텍스트 (빈 문자열로 초기화)
	};
}

/**
 * Realtime 세션 연결
 * @param {object} state - Realtime 상태 객체
 * @param {function} onError - 에러 발생 시 콜백
 * @param {function} onEvent - 이벤트 발생 시 콜백
 * @param {function} onStatusUpdate - 상태 업데이트 콜백
 * @param {string|null} selectedStyleId - 선택된 대화 스타일 ID (null이면 기본)
 * @param {Array|null} previousMessages - 이전 대화 메시지 배열 (대화 이어하기용)
 */
export async function connectRealtime(state, onError, onEvent, onStatusUpdate, selectedStyleId = null, previousMessages = null) {
	try {
		// 상태 초기화
		state.status = 'connecting';
		state.currentAssistantResponse = ''; // undefined 방지를 위한 초기화
		state.currentUserInput = '';
		state.transcriptBuffer = '';
		
		debugStore.addLog({
			type: 'info',
			message: 'Realtime 연결 시작',
			data: { selectedStyleId: selectedStyleId || '기본' }
		});

	// 프롬프트 준비
	let instructions = getPromptForStyle(selectedStyleId, true);
	
	// 이전 대화 내용이 있으면 컨텍스트에 추가
	if (previousMessages && previousMessages.length > 0) {
		const conversationHistory = previousMessages
			.map(msg => `${msg.role === 'user' ? '사용자' : 'AI'}: ${msg.content}`)
			.join('\n');
		
		instructions += `\n\n[이전 대화 내용]\n${conversationHistory}\n\n위 내용은 사용자와 이전에 나눈 대화입니다. 이 맥락을 기억하고 자연스럽게 대화를 이어가세요.`;
		
		console.log('📚 이전 대화 컨텍스트 추가:', previousMessages.length, '개 메시지');
		debugStore.addLog({
			type: 'info',
			message: '이전 대화 컨텍스트 추가',
			data: { messageCount: previousMessages.length }
		});
	}
	
	// Ephemeral client secret 가져오기 (프롬프트 포함)
	const response = await fetch('/api/realtime', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ instructions })
	});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Failed to get client secret');
		}

		const { clientSecret } = await response.json();
		
		debugStore.addLog({
			type: 'success',
			message: 'Client secret 생성 완료',
			data: { 
				styleId: selectedStyleId || '기본',
				promptLength: instructions.length 
			}
		});

		// WebRTC 연결 설정
		const pc = new RTCPeerConnection({
			iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
		});

		// 데이터 채널 생성 (이벤트 및 제어 메시지용)
		const dataChannel = pc.createDataChannel('events', {
			ordered: true
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

	// Web Speech API로 사용자 음성 인식 (텍스트 변환용)
	let recognition = null;
	if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
		const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
		recognition = new SpeechRecognition();
		recognition.continuous = true;
		recognition.interimResults = true;
		recognition.lang = 'ko-KR';

		let currentTranscript = '';
		let isFinalizing = false;

		recognition.onresult = (event) => {
			let interimTranscript = '';
			let finalTranscript = '';

			for (let i = event.resultIndex; i < event.results.length; i++) {
				const transcript = event.results[i][0].transcript;
				if (event.results[i].isFinal) {
					finalTranscript += transcript;
				} else {
					interimTranscript += transcript;
				}
			}

			// 최종 결과가 있으면 DB에 저장
			if (finalTranscript && !isFinalizing) {
				isFinalizing = true;
				currentTranscript += finalTranscript;
				
				console.log('🎤 사용자 음성 인식 완료:', currentTranscript);
				
				// 메시지 추가
				realtimeStore.addMessage({
					id: `msg-${Date.now()}-${Math.random()}`,
					role: 'user',
					content: currentTranscript.trim(),
					timestamp: new Date().toISOString()
				});

				// DB에 저장
				saveMessageToDB('user', currentTranscript.trim());

				// 리셋
				currentTranscript = '';
				setTimeout(() => { isFinalizing = false; }, 1000);
			}

			// 중간 결과 표시 (선택 사항) - undefined 방지
			if (interimTranscript && interimTranscript.trim()) {
				const displayText = (currentTranscript || '') + (interimTranscript || '');
				realtimeStore.updateStatus({
					currentUserInput: displayText
				});
			}
		};

		recognition.onerror = (event) => {
			console.error('음성 인식 오류:', event.error);
			if (event.error !== 'no-speech') {
				debugStore.addLog({
					type: 'error',
					message: `음성 인식 오류: ${event.error}`
				});
			}
		};

		recognition.onend = () => {
			// 연결이 유지되는 동안 자동으로 재시작
			if (state.isConnected) {
				try {
					recognition.start();
				} catch (e) {
					// 이미 시작된 경우 무시
				}
			}
		};

		// 음성 인식 시작
		try {
			recognition.start();
			console.log('✅ 음성 인식 시작됨');
			debugStore.addLog({
				type: 'success',
				message: '사용자 음성 텍스트 변환 시작'
			});
		} catch (error) {
			console.error('음성 인식 시작 실패:', error);
		}
	} else {
		console.warn('⚠️ 브라우저가 음성 인식을 지원하지 않습니다.');
		debugStore.addLog({
			type: 'warning',
			message: '브라우저가 음성 인식을 지원하지 않습니다.'
		});
	}

		// 원격 오디오 처리
		pc.ontrack = (event) => {
			const [remoteStream] = event.streams;
			const remoteAudioElement = new Audio();
			remoteAudioElement.srcObject = remoteStream;
			remoteAudioElement.autoplay = true;
			remoteAudioElement.play().catch(console.error);
			
			debugStore.addLog({
				type: 'success',
				message: 'WebRTC 오디오 스트림 수신 시작'
			});
		};

	// 데이터 채널 이벤트 처리
	dataChannel.onopen = () => {
		console.log('✅ WebRTC 데이터 채널 연결 성공');
		debugStore.addLog({
			type: 'success',
			message: 'WebRTC 데이터 채널 연결 성공'
		});
		
		// 세션 설정 확인 (프롬프트가 이미 client_secret 생성 시 포함됨)
		console.group('🎨 대화 스타일 프롬프트 적용');
		console.log('선택된 스타일 ID:', selectedStyleId || '(기본 - null)');
		if (selectedStyleId && CONVERSATION_STYLES[selectedStyleId]) {
			console.log('스타일 이름:', CONVERSATION_STYLES[selectedStyleId].label);
			console.log('스타일 이모지:', CONVERSATION_STYLES[selectedStyleId].emoji);
		}
		console.log('적용된 프롬프트 (처음 300자):', instructions.substring(0, 300) + '...');
		console.log('프롬프트 전체 길이:', instructions.length, '자');
		console.groupEnd();
		
		debugStore.addLog({
			type: 'info',
			message: '프롬프트 적용 완료',
			data: {
				styleId: selectedStyleId || '기본',
				styleName: selectedStyleId && CONVERSATION_STYLES[selectedStyleId] ? CONVERSATION_STYLES[selectedStyleId].label : '기본',
				promptLength: instructions.length
			}
		});
		
		// 연결 완료 상태 업데이트
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
	};

		dataChannel.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				
				debugStore.addLog({
					type: 'info',
					message: `WebRTC 데이터 채널 메시지 수신: ${data.type}`,
					data: data
				});
				
				// 에러 메시지 처리
				if (data.type === 'error' || data.type === 'session.error') {
					const errorMessage = data.error?.message || data.message || JSON.stringify(data);
					console.error('❌ WebRTC 에러 메시지 수신:', errorMessage);
					
					debugStore.addLog({
						type: 'error',
						message: `WebRTC 에러: ${errorMessage}`,
						data: data
					});
					
					state.status = 'error';
					state.isConnected = false;
					
					if (onStatusUpdate) {
						onStatusUpdate({
							status: 'error',
							isConnected: false,
							error: errorMessage
						});
					}
					
					if (onError) {
						onError(errorMessage);
					}
					return;
				}
				
				// 세션 관련 메시지 로깅
				if (data.type === 'session.updated' || data.type === 'session.created') {
					console.group('📥 WebRTC 응답 (세션 업데이트 완료)');
					console.log('이벤트 타입:', data.type);
					
					if (data.session?.instructions) {
						const receivedInstructions = data.session.instructions;
						console.log('✅ 서버에서 확인된 프롬프트 (처음 200자):', receivedInstructions.substring(0, 200) + '...');
						console.log('✅ 프롬프트 길이:', receivedInstructions.length, '자');
						
						if (receivedInstructions === instructions) {
							console.log('✅ 프롬프트가 정확히 적용되었습니다!');
							debugStore.addLog({
								type: 'success',
								message: '프롬프트가 정확히 적용되었습니다!',
								data: {
									promptLength: receivedInstructions.length
								}
							});
						}
					}
					console.groupEnd();
				}
				
				// 디버깅: 중요한 이벤트만 로깅 (너무 많은 로그 방지)
				if (!['response.output_audio.delta'].includes(data.type)) {
					console.log('📥 Realtime 이벤트:', data.type, data);
				}
				
				// 모든 이벤트 처리
				handleRealtimeEvent(state, data, onStatusUpdate);
				if (onEvent) {
					onEvent(data);
				}
			} catch (error) {
				console.error('❌ 데이터 채널 메시지 파싱 오류:', error);
				console.error('원본 메시지:', event.data);
				debugStore.addLog({
					type: 'error',
					message: '데이터 채널 메시지 파싱 오류',
					data: { error: error.message, rawData: event.data }
				});
			}
		};

		dataChannel.onerror = (error) => {
			console.error('❌ 데이터 채널 오류:', error);
			debugStore.addLog({
				type: 'error',
				message: '데이터 채널 오류 발생',
				data: { error: error.message || '알 수 없는 오류' }
			});
		};

		dataChannel.onclose = (event) => {
			console.warn('⚠️ 데이터 채널 연결 종료', {
				code: event.code,
				reason: event.reason,
				wasClean: event.wasClean
			});
			debugStore.addLog({
				type: 'warning',
				message: '데이터 채널 연결 종료',
				data: { 
					code: event.code, 
					reason: event.reason || '알 수 없는 이유',
					wasClean: event.wasClean 
				}
			});
			
			// 상태 업데이트
			state.status = 'disconnected';
			state.isConnected = false;
			if (onStatusUpdate) {
				onStatusUpdate({
					status: 'disconnected',
					isConnected: false,
					isListening: false,
					isSpeaking: false
				});
			}
		};

		// SDP offer 생성
		const offer = await pc.createOffer({
			offerToReceiveAudio: true,
			offerToReceiveVideo: false
		});
		await pc.setLocalDescription(offer);

		debugStore.addLog({
			type: 'info',
			message: 'WebRTC SDP offer 생성 완료'
		});

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
		const errorText = await sdpResponse.text();
		console.error('WebRTC 연결 실패:', errorText);
		debugStore.addLog({
			type: 'error',
			message: 'WebRTC 연결 실패',
			data: { error: errorText }
		});
		throw new Error('Failed to establish WebRTC connection');
	}

	const answerSdp = await sdpResponse.text();
	const answer = { type: 'answer', sdp: answerSdp };
	await pc.setRemoteDescription(answer);
		
		debugStore.addLog({
			type: 'success',
			message: 'WebRTC 연결 성공'
		});

		// WebRTC 연결 상태 모니터링
		pc.oniceconnectionstatechange = () => {
			console.log('ICE 연결 상태:', pc.iceConnectionState);
			debugStore.addLog({
				type: 'info',
				message: `ICE 연결 상태: ${pc.iceConnectionState}`
			});
			
			if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
				// 연결 완료
			} else if (pc.iceConnectionState === 'failed') {
				console.error('❌ ICE 연결 실패');
				debugStore.addLog({
					type: 'error',
					message: 'ICE 연결 실패 - 네트워크 문제일 수 있습니다'
				});
				state.status = 'disconnected';
				state.isConnected = false;
				if (onStatusUpdate) {
					onStatusUpdate({
						status: 'disconnected',
						isConnected: false,
						isListening: false,
						isSpeaking: false
					});
				}
			} else if (pc.iceConnectionState === 'disconnected') {
				console.warn('⚠️ ICE 연결 끊김');
				debugStore.addLog({
					type: 'warning',
					message: 'ICE 연결 끊김 - 재연결 시도 중...'
				});
				// disconnected 상태는 일시적일 수 있으므로 즉시 종료하지 않음
			} else if (pc.iceConnectionState === 'closed') {
				console.log('ℹ️ ICE 연결 종료됨');
				state.status = 'disconnected';
				state.isConnected = false;
				if (onStatusUpdate) {
					onStatusUpdate({
						status: 'disconnected',
						isConnected: false,
						isListening: false,
						isSpeaking: false
					});
				}
			}
		};

		pc.onconnectionstatechange = () => {
			console.log('WebRTC 연결 상태:', pc.connectionState);
			debugStore.addLog({
				type: 'info',
				message: `WebRTC 연결 상태: ${pc.connectionState}`
			});
			
			// 연결 상태에 따른 처리
			if (pc.connectionState === 'failed') {
				console.error('❌ WebRTC 연결 실패');
				debugStore.addLog({
					type: 'error',
					message: 'WebRTC 연결 실패'
				});
				state.status = 'disconnected';
				state.isConnected = false;
				if (onStatusUpdate) {
					onStatusUpdate({
						status: 'disconnected',
						isConnected: false,
						isListening: false,
						isSpeaking: false
					});
				}
			} else if (pc.connectionState === 'disconnected') {
				console.warn('⚠️ WebRTC 연결 끊김');
				debugStore.addLog({
					type: 'warning',
					message: 'WebRTC 연결 끊김'
				});
			} else if (pc.connectionState === 'closed') {
				console.log('ℹ️ WebRTC 연결 종료됨');
				state.status = 'disconnected';
				state.isConnected = false;
				if (onStatusUpdate) {
					onStatusUpdate({
						status: 'disconnected',
						isConnected: false,
						isListening: false,
						isSpeaking: false
					});
				}
			}
		};

	state.session = { pc, dataChannel, micStream, audioCtx, recognition };
	
	// 세션을 스토어에 저장 (연결 완료 후)
	realtimeStore.setSession(state.session);
	} catch (error) {
		console.error('Realtime 연결 실패:', error);
		const message = error.message || 'Realtime 연결에 실패했습니다.';
		debugStore.addLog({
			type: 'error',
			message: 'Realtime 연결 실패',
			data: { error: message, stack: error.stack }
		});
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
			console.log('📝 AI 텍스트 응답 델타:', event.delta);
			state.transcriptBuffer += event.delta;
			state.conversationText += event.delta;
			state.currentAssistantResponse += event.delta;
			// 실시간으로 마지막 메시지 업데이트
			realtimeStore.updateStatus({
				currentAssistantResponse: state.currentAssistantResponse
			});
			// 메시지가 있으면 업데이트, 없으면 새로 추가
			const currentMessages = get(realtimeStore).messages || [];
			if (currentMessages.length > 0 && currentMessages[currentMessages.length - 1].role === 'assistant') {
				realtimeStore.updateLastMessage(state.currentAssistantResponse);
			} else {
				console.log('✅ 새 AI 메시지 추가:', state.currentAssistantResponse);
				realtimeStore.addMessage({
					id: `msg-${Date.now()}-${Math.random()}`,
					role: 'assistant',
					content: state.currentAssistantResponse,
					timestamp: new Date().toISOString()
				});
			}
			updates = {
				conversationText: state.conversationText,
				status: state.status
			};
			break;

		case 'response.output_text.done':
			state.conversationText += '\n';
			state.transcriptBuffer = '';
			// AI 응답 완료 - 메시지 최종 저장
			if (state.currentAssistantResponse.trim()) {
				const currentMessages = get(realtimeStore).messages || [];
				if (currentMessages.length > 0 && currentMessages[currentMessages.length - 1].role === 'assistant') {
					realtimeStore.updateLastMessage(state.currentAssistantResponse.trim());
				}
				// DB에 AI 응답 저장
				saveMessageToDB('assistant', state.currentAssistantResponse.trim());
				state.currentAssistantResponse = '';
				realtimeStore.updateStatus({ currentAssistantResponse: '' });
			}
			updates = {
				conversationText: state.conversationText,
				status: state.status
			};
			break;

		case 'response.output_audio_transcript.delta':
			// 음성 응답의 텍스트 변환 (실시간)
			if (event.delta && typeof event.delta === 'string') {
				state.transcriptBuffer += event.delta;
				state.conversationText += event.delta;
				state.currentAssistantResponse += event.delta;
				
				// 실시간으로 마지막 메시지 업데이트
				realtimeStore.updateStatus({
					currentAssistantResponse: state.currentAssistantResponse
				});
				
				// 메시지가 있으면 업데이트, 없으면 새로 추가
				const currentMessages2 = get(realtimeStore).messages || [];
				if (currentMessages2.length > 0 && currentMessages2[currentMessages2.length - 1].role === 'assistant') {
					realtimeStore.updateLastMessage(state.currentAssistantResponse);
				} else {
					realtimeStore.addMessage({
						id: `msg-${Date.now()}-${Math.random()}`,
						role: 'assistant',
						content: state.currentAssistantResponse,
						timestamp: new Date().toISOString()
					});
				}
			}
			break;

		case 'response.output_audio_transcript.done':
			// 음성 응답의 텍스트 변환 완료
			console.log('✅ 음성 응답 텍스트 변환 완료:', state.currentAssistantResponse);
			if (state.currentAssistantResponse.trim()) {
				const currentMessages3 = get(realtimeStore).messages || [];
				if (currentMessages3.length > 0 && currentMessages3[currentMessages3.length - 1].role === 'assistant') {
					realtimeStore.updateLastMessage(state.currentAssistantResponse.trim());
				}
				// DB에 AI 응답 저장
				saveMessageToDB('assistant', state.currentAssistantResponse.trim());
				state.currentAssistantResponse = '';
				realtimeStore.updateStatus({ currentAssistantResponse: '' });
			}
			state.conversationText += '\n';
			state.transcriptBuffer = '';
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
			// 사용자 음성 입력 완료 - 메시지 추가
			// OpenAI Realtime API에서 transcript는 event.item.input_audio_transcription.transcript에 있음
			console.log('🎤 음성 입력 완료 이벤트:', event);
			const userText = event.item?.input_audio_transcription?.transcript || 
			                  event.transcript || 
			                  event.item?.transcript || 
			                  '';
			console.log('📝 추출된 사용자 텍스트:', userText);
			if (userText.trim()) {
				state.currentUserInput = userText.trim();
				realtimeStore.addMessage({
					id: `msg-${Date.now()}-${Math.random()}`,
					role: 'user',
					content: userText.trim(),
					timestamp: new Date().toISOString()
				});
				console.log('✅ 사용자 메시지 추가됨:', userText.trim());
				// DB에 사용자 메시지 저장
				saveMessageToDB('user', userText.trim());
				state.currentUserInput = '';
			} else {
				console.warn('⚠️ 사용자 텍스트가 비어있습니다.');
			}
			updates = { 
				status: 'speaking',
				isListening: false,
				isSpeaking: true
			};
			break;

		case 'conversation.item.input_audio_transcription.delta':
			// 사용자 음성 입력 텍스트 변환 중 (실시간)
			if (event.delta) {
				console.log('🎤 사용자 음성 텍스트 변환 델타:', event.delta);
				state.currentUserInput += event.delta;
				realtimeStore.updateStatus({
					currentUserInput: state.currentUserInput
				});
			}
			break;

		case 'conversation.item.input_audio_transcription.done':
			// 사용자 음성 입력 텍스트 변환 완료
			console.log('🎤 사용자 음성 텍스트 변환 완료:', state.currentUserInput);
			if (state.currentUserInput.trim()) {
				realtimeStore.addMessage({
					id: `msg-${Date.now()}-${Math.random()}`,
					role: 'user',
					content: state.currentUserInput.trim(),
					timestamp: new Date().toISOString()
				});
				console.log('✅ 사용자 메시지 추가됨:', state.currentUserInput.trim());
				// DB에 사용자 메시지 저장
				saveMessageToDB('user', state.currentUserInput.trim());
				state.currentUserInput = '';
				realtimeStore.updateStatus({ currentUserInput: '' });
			}
			break;

		case 'conversation.item.input_text.done':
			// 텍스트 입력 완료 - 이미 UI에 표시되었으므로 상태만 업데이트
			console.log('✅ 텍스트 입력 완료 이벤트:', event);
			state.status = 'speaking';
			updates = { 
				status: 'speaking',
				isListening: false,
				isSpeaking: true
			};
			break;
		
		case 'conversation.item.added':
			// 대화 아이템 추가됨
			console.log('✅ 대화 아이템 추가됨:', event);
			// 텍스트 입력인 경우 메시지가 이미 UI에 추가되었으므로 여기서는 처리하지 않음
			break;
		
		case 'conversation.item.done':
			// 대화 아이템 완료
			console.log('✅ 대화 아이템 완료:', event);
			// 응답 생성 대기 상태로 변경
			state.status = 'speaking';
			updates = { 
				status: 'speaking',
				isListening: false,
				isSpeaking: true
			};
			break;
		
		case 'response.created':
			// 응답 생성 시작
			console.log('✅ 응답 생성 시작:', event);
			break;
		
		case 'response.output_item.added':
			// 응답 아이템 추가됨
			console.log('✅ 응답 아이템 추가됨:', event);
			break;

		case 'session.created':
		case 'session.updated':
			state.status = 'connected';
			state.isConnected = true;
			console.log('✅ 세션 업데이트됨:', event.session?.output_modalities);
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
 * 텍스트 메시지 전송
 * @param {object} session - Realtime 세션 객체
 * @param {string} text - 전송할 텍스트
 */
export async function sendTextMessage(session, text) {
	if (!session || !session.dataChannel || session.dataChannel.readyState !== 'open') {
		throw new Error('데이터 채널이 연결되지 않았습니다.');
	}

	// 음성 모드에서 텍스트 입력 시에도 DB에 저장
	saveMessageToDB('user', text);

	const message = {
		type: 'conversation.item.create',
		item: {
			type: 'message',
			role: 'user',
			content: [
				{
					type: 'input_text',
					text: text
				}
			]
		}
	};

	console.log('📤 텍스트 메시지 전송:', message);
	session.dataChannel.send(JSON.stringify(message));
	
	// 텍스트 입력 후 응답 생성 요청 (약간의 지연 후)
	// 텍스트 입력 시에는 텍스트 응답도 받기 위해 별도 세션 업데이트 필요
	// 하지만 세션 레벨에서는 ['text'] 또는 ['audio']만 지원되므로,
	// response.create에서 텍스트 출력을 명시적으로 요청
	setTimeout(() => {
		// 먼저 세션을 텍스트 모드로 업데이트 시도
		const sessionUpdate = {
			type: 'session.update',
			session: {
				output_modalities: ['text', 'audio']
			}
		};
		console.log('📤 세션 업데이트 (텍스트+오디오):', sessionUpdate);
		
		// 세션 업데이트가 실패할 수 있으므로, response.create도 함께 시도
		const responseRequest = {
			type: 'response.create'
		};
		
		try {
			// 세션 업데이트 시도 (실패할 수 있음)
			session.dataChannel.send(JSON.stringify(sessionUpdate));
		} catch (error) {
			console.warn('세션 업데이트 실패 (무시 가능):', error);
		}
		
		// 응답 생성 요청
		setTimeout(() => {
			console.log('📤 응답 생성 요청:', responseRequest);
			session.dataChannel.send(JSON.stringify(responseRequest));
		}, 100);
	}, 200);
	
	debugStore.addLog({
		type: 'info',
		message: '텍스트 메시지 전송',
		data: { text: text.substring(0, 50) + (text.length > 50 ? '...' : '') }
	});
}

/**
 * Realtime 세션 종료
 * @param {object} state - Realtime 상태 객체
 */
export async function disconnectRealtime(state, onStatusUpdate = null) {
	if (!state.session) return;
	
	const { dataChannel, pc, micStream, audioCtx, recognition } = state.session;
	
	// 음성 인식 종료
	if (recognition) {
		try {
			recognition.stop();
			console.log('✅ 음성 인식 종료됨');
		} catch (error) {
			console.error('음성 인식 종료 오류:', error);
		}
	}
	
	// 데이터 채널 종료
	if (dataChannel) {
		dataChannel.close();
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
	if (audioCtx && audioCtx.state !== 'closed') {
		try {
			await audioCtx.close();
		} catch (error) {
			console.error('오디오 컨텍스트 종료 오류:', error);
		}
	}
	
	debugStore.addLog({
		type: 'info',
		message: 'WebRTC 연결 종료'
	});
	
		// 상태 초기화
		state.session = null;
		state.isConnected = false;
		state.status = 'disconnected';
		state.transcriptBuffer = '';
		state.currentUserInput = '';
		state.currentAssistantResponse = '';
	
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

