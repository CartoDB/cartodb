import toObject from 'new-dashboard/utils/to-object';

export function setFetchingState (state) {
  state.isFetching = true;
  state.isErrored = false;
  state.error = {};
}

export function setRequestError (state, error) {
  state.isFetching = false;
  state.isErrored = true;
  state.error = error;
}

export function setVisualizations (state, visualizationsData) {
  state.list = toObject(visualizationsData.visualizations, 'id');
  state.metadata = {
    total_entries: visualizationsData.total_entries
  };

  state.isFetching = false;
}
