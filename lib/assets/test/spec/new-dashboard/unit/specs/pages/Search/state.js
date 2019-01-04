import visualizationData from '../../fixtures/visualizations';
import datasetsData from '../../fixtures/datasets';

export const store = {
  state: {
    search: {
      searchTerm: '',
      tag: '',
      resultsPerPage: 1,
      maps: {
        isFetching: false,
        isErrored: false,
        results: [],
        error: {},
        page: 1,
        numPages: 1,
        numResults: 0
      },
      datasets: {
        isFetching: false,
        isErrored: false,
        results: [],
        error: {},
        page: 1,
        numPages: 1,
        numResults: 0
      }
    }
  }
};

export const fetchingStore = {
  state: {
    search: {
      ...store.state.search,
      maps: {
        ...store.state.search.maps,
        isFetching: true
      },
      datasets: {
        ...store.state.search.datasets,
        isFetching: true
      }
    }
  }
};

export const resultsStore = {
  state: {
    search: {
      ...store.state.search,
      maps: {
        ...store.state.search.maps,
        results: visualizationData.visualizations,
        numPages: 2,
        numResults: 2
      },
      datasets: {
        ...store.state.search.datasets,
        results: datasetsData.visualizations,
        numPages: 2,
        numResults: 2
      }
    }
  }
};
