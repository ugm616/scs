import { generateUUID, generateRoomId, parseHash, setHash, encodeBase64, decodeBase64, textToBytes, bytesToText } from './utils.js';
import { deriveAesGcmKey, sealJson, openJson } from './crypto.js';
import { buildLocalSignalBlob, applyRemoteSignalBlob, drawQr } from './signaling.js';
import { bindConnectionWatch, gracefulClose } from './fallback.js';

const ui = {
  roomHeader: document.getElementById('room-number'),
  chat: document.getElementById('chat-container'),
  input: document.getElementById('message-input'),
  send: document.getElementById('send-button'),
  details: document.getElementById('signal-details'),
  roomId: document.getElementById('room-id'),
  keyId: document.getElementById('key-id'),
  regenRoom: document.getElementById('regen-room'),
  regenKey: document.getElementById('regen-key'),
  copyLink: document.getElementById('copy-link'),
  stunList: document.getElementById('stun-list'),
  btnOffer: document.getElementById('btn-offer'),
  btnAnswer: document.getElementById('btn-answer'),
  localSig: document.getElementById('local-signal'),
  remoteSig: document.getElementById('remote-signal'),
  copyLocal: document.getElementById('copy-local'),
  applyRemote: document.getElementById('apply-remote'),
  clearSigs: document.getElementById('clear-sigs'),
  qrCanvas: document.getElementById('qr-canvas'),
  showQrOffer: document.getElementById('show-qr-offer'),
  hideQr: document.getElementById('hide-qr'),
};

let state = {
  roomId: '',
  keyB64: '',
  keyBytes: null,
  me: generateUUID().slice(0, 8),
  seq: 0,
  pc: null,
  dc: null,
  msgKey: null,
};

init();

async function init() {
  // Initialize room + key
  let { r, k } = parseHash();
  if (!r) r = generateRoomId(6);
  if (!k) k = encodeBase64(crypto.getRandomValues(new Uint8Array(32)));
  setHash({ r, k });
  state.roomId = r;
  state.keyB64 = k;
  state.keyBytes = decodeBase64(k);
  ui.roomHeader.textContent = r;
  ui.roomId.value = r;
  ui.keyId.value = k;

  // Derive a separate key for messages
  state.msgKey = await deriveAesGcmKey(state.keyBytes, 'msg-v1', new TextEncoder().encode(r));

  bindUi();
  resetPeer();
}

function bindUi() {
  ui.regenRoom.onclick = () => {
    state.roomId = generateRoomId(6);
    ui.roomHeader.textContent = state.roomId;
    ui.roomId.value = state.roomId;
    setHash({ r: state.roomId, k: state.keyB64 });
    // Rederive message key
    deriveAesGcmKey(state.keyBytes, 'msg-v1', new TextEncoder().encode(state.roomId)).then(k => state.msgKey = k);
    // Reset connection
    resetPeer();
  };

  ui.regenKey.onclick = () => {
    state.keyB64 = encodeBase64(crypto.getRandomValues(new Uint8Array(32)));
    state.keyBytes = decodeBase64(state.keyB64);
    ui.keyId.value = state.keyB64;
    setHash({ r: state.roomId, k: state.keyB64 });
    deriveAesGcmKey(state.keyBytes, 'msg-v1', new TextEncoder().encode(state.roomId)).then(k => state.msgKey = k);
    resetPeer();
  };

  ui.copyLink.onclick = async () => {
    const url = location.origin + location.pathname + `#r=${state.roomId}&k=${state.keyB64}`;
    await navigator.clipboard.writeText(url);
  };

  ui.btnOffer.onclick = async () => {
    await ensurePeer(true);
    const blob = await buildLocalSignalBlob(state.pc, 'offerer', state.keyBytes, state.roomId);
    ui.localSig.value = blob;
    ui.showQrOffer.disabled = false;
  };

  ui.btnAnswer.onclick = async () => {
    await ensurePeer(false);
    const blobRemote = ui.remoteSig.value.trim();
    if (!blobRemote) return;
    const res = await applyRemoteSignalBlob(state.pc, blobRemote, state.keyBytes, state.roomId);
    if (res.madeAnswer) {
      const blob = await buildLocalSignalBlob(state.pc, 'answerer', state.keyBytes, state.roomId);
      ui.localSig.value = blob;
      ui.showQrOffer.disabled = false;
    }
  };

  ui.applyRemote.onclick = async () => {
    const blob = ui.remoteSig.value.trim();
    if (!blob) return;
    await applyRemoteSignalBlob(state.pc, blob, state.keyBytes, state.roomId);
  };

  ui.copyLocal.onclick = async () => {
    if (ui.localSig.value) await navigator.clipboard.writeText(ui.localSig.value);
  };

  ui.clearSigs.onclick = () => {
    ui.localSig.value = '';
    ui.remoteSig.value = '';
    ui.qrCanvas.style.display = 'none';
  };

  ui.showQrOffer.onclick = () => {
    if (!ui.localSig.value) return;
    drawQr(ui.qrCanvas, ui.localSig.value);
  };
  ui.hideQr.onclick = () => {
    ui.qrCanvas.style.display = 'none';
  };

  ui.input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  ui.send.onclick = sendMessage;
}

function appendMessage(who, text, ts = Date.now()) {
  const div = document.createElement('div');
  div.className = 'msg' + (who === 'me' ? ' me' : '');
  const meta = document.createElement('div');
  meta.className = 'meta';
  const time = new Date(ts).toLocaleTimeString();
  meta.textContent = (who === 'me' ? 'You' : 'Peer') + ' • ' + time;
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = text;
  div.appendChild(meta);
  div.appendChild(bubble);
  ui.chat.appendChild(div);
  div.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

function resetPeer() {
  if (state.pc) {
    try { state.dc?.close(); } catch {}
    gracefulClose(state.pc);
  }
  state.pc = null;
  state.dc = null;
  ui.send.disabled = true;
}

async function ensurePeer(isOfferer) {
  if (state.pc) return;
  const iceServers = parseStunList(ui.stunList.value);
  const pc = new RTCPeerConnection({ iceServers, bundlePolicy: 'balanced', rtcpMuxPolicy: 'require' });

  bindConnectionWatch(pc, {
    onChange: (s) => {
      if (s.conn === 'connected') {
        ui.details.open = false;
        ui.send.disabled = false;
      }
    },
  });

  let dc;
  if (isOfferer) {
    dc = pc.createDataChannel('chat', { ordered: true });
    attachDataChannel(dc);
  } else {
    pc.ondatachannel = (ev) => {
      dc = ev.channel;
      attachDataChannel(dc);
    };
  }

  // ICE
  pc.onicecandidateerror = (e) => console.warn('ICE error', e);

  // Create local description early to start ICE
  if (isOfferer) {
    const offer = await pc.createOffer({ offerToReceiveAudio: false, offerToReceiveVideo: false });
    await pc.setLocalDescription(offer);
  }

  state.pc = pc;
  state.dc = dc;
}

function parseStunList(str) {
  const items = (str || '').split(',').map(s => s.trim()).filter(Boolean);
  if (items.length === 0) return []; // pure serverless by default
  return [{ urls: items }];
}

function attachDataChannel(dc) {
  dc.binaryType = 'arraybuffer';
  dc.onopen = () => {
    ui.send.disabled = false;
    appendMessage('sys', 'Connected');
  };
  dc.onclose = () => {
    ui.send.disabled = true;
    appendMessage('sys', 'Disconnected');
  };
  dc.onmessage = async (ev) => {
    try {
      const pkg = JSON.parse(typeof ev.data === 'string' ? ev.data : new TextDecoder().decode(ev.data));
      if (pkg.v !== 1) return;
      // Decrypt
      const msg = await openJson(state.msgKey, pkg, state.roomId);
      if (!msg || typeof msg.m !== 'string') return;
      appendMessage('peer', msg.m, msg.t);
    } catch (e) {
      console.warn('recv error', e);
    }
  };
}

async function sendMessage() {
  const text = ui.input.value.trim();
  if (!text || !state.dc || state.dc.readyState !== 'open') return;
  const msg = { v: 1, s: state.me, n: state.seq++, t: Date.now(), m: text };
  const sealed = await sealJson(state.msgKey, msg, state.roomId);
  state.dc.send(JSON.stringify(sealed));
  appendMessage('me', text, msg.t);
  ui.input.value = '';
}
