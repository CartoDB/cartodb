import toObject from 'new-dashboard/utils/to-object';

export function setApps (state, apps) {
  state.list = toObject(apps, 'id');
  state.isFetching = false;
  state.isErrored = false;
  state.error = [];
}

export function addApp (state, app) {
  state.list = { ...state.list, [app.id]: app };
}

export function updateOAuthApp (state, app) {
  const isOAuthAppPresent = state.list.hasOwnProperty(app.id);

  if (isOAuthAppPresent) {
    Object.assign(state.list[app.id], app);
  }
}

export function setRequestError (state, error) {
  state.isFetching = false;
  state.isErrored = true;
  state.error = error;
  state.list = {};
}

export function setFetchingState (state) {
  state.isFetching = true;
  state.isErrored = false;
  state.error = [];
  state.list = {};
}
