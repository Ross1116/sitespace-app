type NetworkListener = (pendingCount: number) => void;

let pendingRequestCount = 0;
const listeners = new Set<NetworkListener>();

function notifyListeners() {
  for (const listener of listeners) {
    listener(pendingRequestCount);
  }
}

export function incrementNetworkActivity() {
  pendingRequestCount += 1;
  notifyListeners();
}

export function decrementNetworkActivity() {
  pendingRequestCount = Math.max(0, pendingRequestCount - 1);
  notifyListeners();
}

export function getPendingNetworkActivityCount() {
  return pendingRequestCount;
}

export function subscribeToNetworkActivity(listener: NetworkListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
