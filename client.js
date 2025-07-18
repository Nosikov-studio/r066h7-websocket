const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const startBtn = document.getElementById('startBtn');
const yourIdInput = document.getElementById('yourId');
const partnerIdInput = document.getElementById('partnerId');

const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

let localStream;
let peerConnection;
let ws;
let yourId;
let partnerId;

function log(...args) {
  console.log('[WebRTC]', ...args);
}

startBtn.onclick = async () => {
  yourId = yourIdInput.value.trim();
  partnerId = partnerIdInput.value.trim();
  if (!yourId || !partnerId) {
    alert('Введите ваши ID и ID партнера');
    return;
  }
  await start();
};

async function start() {
  // Устанавливаем соединение к серверу сигнализации
 // ws = new WebSocket('ws://localhost:8080');
   // ws = new WebSocket('ws://85.28.47.165:8080');
    ws = new WebSocket('wss://truruky.ru/ws');
  ws.onopen = () => {
    // Регистрируемся у сервера
    ws.send(JSON.stringify({ type: 'register', from: yourId }));
    log('WebSocket connected and registered as', yourId);
  };

  ws.onerror = console.error;

  ws.onmessage = async (message) => {
    const data = JSON.parse(message.data);
    log('Signaling message received:', data);

    switch (data.type) {
      case 'offer':
        await handleOffer(data.payload, data.from);
        break;
      case 'answer':
        await handleAnswer(data.payload);
        break;
      case 'candidate':
        await handleCandidate(data.payload);
        break;
      default:
        log('Unknown message type', data.type);
    }
  };

  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localVideo.srcObject = localStream;

  createPeerConnection();

  // Если вы инициатор — создаём оффер
  if (yourId < partnerId) { // Логика для того, кто начнет первым (для простоты — тот, чей id лексикографически меньше)
    createAndSendOffer();
  }
}

function createPeerConnection() {
  peerConnection = new RTCPeerConnection(configuration);

  // Добавляем локальные треки в RTCPeerConnection
  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  // Получаем удалённые треки и показываем их
  peerConnection.ontrack = (event) => {
    log('Remote track received');
    if (remoteVideo.srcObject !== event.streams[0]) {
      remoteVideo.srcObject = event.streams[0];
    }
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      sendSignal('candidate', event.candidate);
    }
  };

  peerConnection.oniceconnectionstatechange = () => {
    log('ICE state:', peerConnection.iceConnectionState);
  };
}

async function createAndSendOffer() {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  sendSignal('offer', offer);
}

async function handleOffer(offer, from) {
  if (!peerConnection) createPeerConnection();
  partnerId = from;
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  sendSignal('answer', answer);
}

async function handleAnswer(answer) {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
}

async function handleCandidate(candidate) {
  try {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (e) {
    console.error('Error adding received ICE candidate', e);
  }
}

// function sendSignal(type, payload) {
//   const message = {
//     type,
//     from: yourId,
//     to: partnerId,
//     payload,
//   };
//   ws.send(JSON.stringify(message));
//   log('Sent signaling message:', message);
// }
function sendSignal(type, payload) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.error('WebSocket не открыт для отправки:', ws ? ws.readyState : ws);
    return;
  }
  const message = {
    type,
    from: yourId,
    to: partnerId,
    payload,
  };
  ws.send(JSON.stringify(message));
  log('Sent signaling message:', message);
}