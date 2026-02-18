const socket = io();
const joinCallBtn = document.getElementById('joinCallBtn');
const endCallBtn = document.getElementById('endCallBtn');
const displayNameInput = document.getElementById('displayName');
const roomIdInput = document.getElementById('roomId');
const statusBox = document.getElementById('statusBox');
const remoteAudio = document.getElementById('remoteAudio');
const localAudio = document.getElementById('localAudio');

let peerConnection;
let localStream;
let joinedRoomId;
let isCaller = false;

const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

function setStatus(message) {
  statusBox.textContent = message;
}

async function ensureLocalAudioStream() {
  if (!localStream) {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    localAudio.srcObject = localStream;
  }

  return localStream;
}

function setupPeerConnection() {
  peerConnection = new RTCPeerConnection(rtcConfig);

  peerConnection.ontrack = (event) => {
    [remoteAudio.srcObject] = event.streams;
    setStatus('Connected. You are now on a free internet call.');
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate && joinedRoomId) {
      socket.emit('webrtc-ice-candidate', {
        roomId: joinedRoomId,
        candidate: event.candidate
      });
    }
  };

  peerConnection.onconnectionstatechange = () => {
    if (peerConnection.connectionState === 'failed') {
      setStatus('Connection failed. Try rejoining the call.');
    }
  };
}

async function startCallAsCaller() {
  const stream = await ensureLocalAudioStream();
  setupPeerConnection();

  stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  socket.emit('webrtc-offer', {
    roomId: joinedRoomId,
    offer
  });

  setStatus('Calling… waiting for the other person to answer.');
}

async function answerIncomingCall(offer) {
  const stream = await ensureLocalAudioStream();
  setupPeerConnection();
  stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  socket.emit('webrtc-answer', {
    roomId: joinedRoomId,
    answer
  });

  setStatus('Answering call… connecting audio.');
}

function resetCallState() {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  remoteAudio.srcObject = null;
  isCaller = false;
  endCallBtn.disabled = true;
}

joinCallBtn.addEventListener('click', async () => {
  const displayName = displayNameInput.value.trim() || 'Guest';
  const roomId = roomIdInput.value.trim();

  if (!roomId) {
    setStatus('Please enter a Call ID / Number.');
    return;
  }

  joinedRoomId = roomId;
  socket.emit('join-room', { roomId, displayName });
  joinCallBtn.disabled = true;
  endCallBtn.disabled = false;
  setStatus('Joining call…');
});

endCallBtn.addEventListener('click', () => {
  if (joinedRoomId) {
    socket.emit('call-ended', { roomId: joinedRoomId });
  }

  joinedRoomId = null;
  joinCallBtn.disabled = false;
  resetCallState();
  setStatus('Call ended.');
});

socket.on('room-joined', async ({ peerCount }) => {
  setStatus(`Joined call room. Participants: ${peerCount}`);

  if (peerCount === 1) {
    isCaller = true;
    setStatus('Waiting for someone to join your call ID…');
  } else if (peerCount === 2 && isCaller) {
    await startCallAsCaller();
  }
});

socket.on('peer-joined', async () => {
  if (isCaller) {
    await startCallAsCaller();
  }
});

socket.on('webrtc-offer', async (offer) => {
  await answerIncomingCall(offer);
});

socket.on('webrtc-answer', async (answer) => {
  if (!peerConnection) {
    return;
  }

  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  setStatus('Call answered. Establishing secure media path…');
});

socket.on('webrtc-ice-candidate', async (candidate) => {
  if (!peerConnection) {
    return;
  }

  try {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (error) {
    setStatus('Network candidate failed. You can retry joining.');
  }
});

socket.on('peer-left', () => {
  resetCallState();
  joinCallBtn.disabled = false;
  setStatus('The other person left the call.');
});

socket.on('call-ended', () => {
  resetCallState();
  joinCallBtn.disabled = false;
  setStatus('The call was ended by the other person.');
});

socket.on('room-full', () => {
  joinedRoomId = null;
  joinCallBtn.disabled = false;
  endCallBtn.disabled = true;
  setStatus('This Call ID is already in use by two people.');
});
