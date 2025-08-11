// Connection resilience helpers

export function bindConnectionWatch(pc, opts) {
  const { onChange } = opts;

  function report() {
    onChange?.({
      ice: pc.iceConnectionState,
      conn: pc.connectionState,
      gather: pc.iceGatheringState,
      sig: pc.signalingState,
    });
  }

  pc.addEventListener('iceconnectionstatechange', report);
  pc.addEventListener('connectionstatechange', report);
  pc.addEventListener('signalingstatechange', report);
  pc.addEventListener('icegatheringstatechange', report);

  report();
}

export function gracefulClose(pc) {
  try { pc.close(); } catch {}
}
