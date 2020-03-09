import toObject from 'new-dashboard/utils/to-object';
import * as VisualizationActions from '../../actions/visualizations';

const search = {
  namespaced: true,
  state: {
    searchTerm: '',
    tag: '',
    resultsPerPage: 6,
    maps: {
      isFetching: false,
      isErrored: false,
      results: {},
      error: {},
      page: 1,
      numPages: 1,
      numResults: 0
    },
    datasets: {
      isFetching: false,
      isErrored: false,
      results: {},
      error: {},
      page: 1,
      numPages: 1,
      numResults: 0
    },
    tags: {
      isFetching: false,
      isErrored: false,
      results: [],
      error: {},
      page: 1,
      numPages: 1,
      numResults: 0
    }
  },
  getters: {
    requestParameters (state) {
      const parameters = {
        per_page: state.resultsPerPage,
        shared: 'yes',
        exclude_shared: false
      };

      if (state.searchTerm) {
        parameters.q = state.searchTerm;
      }

      if (state.tag) {
        parameters.tags = state.tag;
      }

      return parameters;
    }
  },
  mutations: {
    updatePage (state, { section, page }) {
      state[section].page = page;
    },
    updateSearchTerm (state, { query, tag }) {
      state.searchTerm = query;
      state.tag = tag;
    },
    setFetchingState (state, section) {
      state[section].isFetching = true;
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
    },
    setTags (state, tags) {
      state.tags.results = tags.result;
      state.tags.numResults = tags.total;
      state.tags.numPages = Math.ceil(tags.total / state.resultsPerPage);

      state.tags.isFetching = false;
    },
    updateNumberLikes () {
      // NOOP. This method avoids action not finding mutation.
    },
    updateVisualization (state, { visualizationId, visualizationAttributes }) {
      const visualization = state.maps.results[visualizationId] || state.datasets.results[visualizationId];

      if (visualization) {
        Object.assign(visualization, visualizationAttributes);
      }
    },
    resetState (state) {
      state.searchTerm = '';
      state.tag = '';

      state.maps = {
        isFetching: false,
        isErrored: false,
        results: {},
        error: {},
        page: 1,
        numPages: 1,
        numResults: 0
      };

      state.datasets = {
        isFetching: false,
        isErrored: false,
        results: {},
        error: {},
        page: 1,
        numPages: 1,
        numResults: 0
      };

      state.tags = {
        isFetching: false,
        isErrored: false,
        results: [],
        error: {},
        page: 1,
        numPages: 1,
        numResults: 0
      };
    }
  },
  actions: {
    deleteLike: VisualizationActions.deleteLike,
    like: VisualizationActions.like,
    doSearch (context, searchParameters) {
      context.commit('updateSearchTerm', searchParameters);
      context.commit('setFetchingState', 'maps');
      context.commit('setFetchingState', 'datasets');

      context.dispatch('fetchMaps', context.getters.requestParameters);
      context.dispatch('fetchDatasets', context.getters.requestParameters);

      if (searchParameters.query) {
        context.dispatch('fetchTags', context.getters.requestParameters);
        context.commit('setFetchingState', 'tags');
      }
    },
    changeSectionPage (context, pageOptions) {
      context.commit('setFetchingState', pageOptions.section);

      const sectionCapitalized = pageOptions.section[0].toUpperCase() + pageOptions.section.substr(1);
      context.commit('updatePage', pageOptions);

      context.dispatch(`fetch${sectionCapitalized}`, context.getters.requestParameters);
    },
    fetchMaps (context, parameters) {
      context.rootState.client.getVisualization('',
        { ...parameters,
          types: 'derived,kuviz',
          page: context.state.maps.page },
        function (error, _, data) {
          if (error) {
            return context.commit('setRequestError', { requestType: 'maps', error });
          }

          context.commit('setMaps', data);
        }
      );
    },
    fetchDatasets (context, parameters) {
      context.rootState.client.getVisualization('',
        { ...parameters,
          type: 'table',
          page: context.state.datasets.page,
          with_dependent_visualizations: 10
        },
        function (error, _, data) {
          if (error) {
            return context.commit('setRequestError', { requestType: 'datasets', error });
          }

          context.commit('setDatasets', data);
        }
      );
    },
    fetchTags (context, parameters) {
      context.rootState.client.getTags(
        { ...parameters,
          types: 'table,derived,kuviz',
          page: context.state.tags.page,
          include_shared: true
        },
        function (error, _, data) {
          if (error) {
            return context.commit('setRequestError', { requestType: 'tags', error });
          }

          context.commit('setTags', data);
        }
      );
    },
    resetState (context) {
      context.commit('resetState');
    }
  }
};

export default search;
