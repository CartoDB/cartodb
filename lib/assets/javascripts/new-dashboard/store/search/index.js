import CartoNode from 'carto-node';
import toObject from 'new-dashboard/utils/to-object';

const client = new CartoNode.AuthenticatedClient();

const search = {
  namespaced: true,
  state: {
    searchTerm: '',
    resultsPerPage: 6,
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
  },
  getters: {},
  mutations: {
    updateSearchTerm (state, searchTerm) {
      state.searchTerm = searchTerm;
    },
    setFetchingState (state) {
      state.maps.isFetching = true;
      state.datasets.isFetching = true;
    },
    setRequestError (state, { requestType, error }) {
      state[requestType].error = error;
    },
    setMaps (state, maps) {
      state.maps.results = toObject(maps.visualizations, 'id');
      state.maps.numResults = maps.total_entries;
      state.maps.numPages = Math.ceil(maps.total_entries / state.resultsPerPage);

      state.maps.isFetching = false;
    },
    setDatasets (state, datasets) {
      state.datasets.results = toObject(datasets.visualizations, 'id');
      state.datasets.numResults = datasets.total_entries;
      state.datasets.numPages = Math.ceil(datasets.total_entries / state.resultsPerPage);

      state.datasets.isFetching = false;
    }
  },
  actions: {
    doSearch (context, searchTerm) {
      context.commit('updateSearchTerm', searchTerm);
      context.dispatch('fetchResults');
    },
    fetchResults (context) {
      context.commit('setFetchingState');

      const parameters = {
        q: context.state.searchTerm,
        per_page: context.state.resultsPerPage
      };

      // TODO: split into 2 functions
      // Fetch Maps
      client.getVisualization('',
        { ...parameters, type: 'derived' },
        function (error, _, data) {
          if (error) {
            return context.commit('setRequestError', { requestType: 'maps', error });
          }

          context.commit('setMaps', data);
        }
      );

      // Fetch Datasets
      client.getVisualization('',
        { ...parameters, type: 'table' },
        function (error, _, data) {
          if (error) {
            return context.commit('setRequestError', { type: 'datasets', error });
          }

          context.commit('setDatasets', data);
        }
      );
    }
  }
};

export default search;
