let activeStream: MediaStream | null = null;

export function getActiveStream() {
  return activeStream;
}

export function setActiveStream(stream: MediaStream | null) {
  activeStream = stream;
}

