import toObject from 'new-dashboard/utils/to-object';

export function setFetchingState (state) {
  state.isFetching = true;
}

export function setIPs (state, ips) {
  state.list = ips;
  state.isFetching = false;
  state.isErrored = false;
  state.error = {};
}

export function setCertificates (state, certificates) {
  state.list = toObject(certificates, 'id');
  state.isFetching = false;
  state.isErrored = false;
  state.error = {};
}

export function setRequestError (state, error) {
  state.error = error;
}
