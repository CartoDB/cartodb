import CartoNode from 'carto-node';
import toObject from 'new-dashboard/utils/to-object';
import Filters, { defaultParams as filtersDefaultParams } from 'new-dashboard/core/filters';

const client = new CartoNode.AuthenticatedClient();

const datasets = {
  namespaced: true,
  state: {
    isFetching: false,
    isFiltered: false,
    isErrored: false,
    error: {},
    filterType: 'mine',
    order: 'updated_at',
    list: {},
    metadata: {},
    page: 1,
    numPages: 1
  },
  mutations: {
    setRequestError (state, error) {
      state.isFetching = false;
      state.isErrored = true;
      state.error = error;
    },

    setDatasets (state, datasets) {
      state.list = toObject(datasets.visualizations, 'id');
      state.metadata = {
        total_entries: datasets.total_entries,
        total_likes: datasets.total_likes,
        total_shared: datasets.total_shared,
        total_user_entries: datasets.total_user_entries
      };

      state.isFetching = false;
    },

    setFetchingState (state) {
      state.isFetching = true;
      state.isErrored = false;
      state.error = {};
    },

    setURLOptions (state, options) {
      state.page = options.page ? parseInt(options.page) : 1;
      state.filterType = options.filter || 'mine';
    },

    setPagination (state, page) {
      state.page = page;
      state.numPages = Math.ceil(state.metadata.total_entries / filtersDefaultParams.per_page) || 1;
    }
  },
  actions: {
    fetchDatasets (context) {
      context.commit('setFetchingState');

      const params = {
        ...Filters[context.state.filterType],
        types: 'table',
        page: context.state.page,
        order: context.state.order
      };

      client.getVisualization('',
        params,
        function (err, _, data) {
          if (err) {
            context.commit('setRequestError', err);
            return;
          }
          context.commit('setDatasets', data);
          context.commit('setPagination', context.state.page);
        });
    },

    setURLOptions (context, options) {
      context.commit('setURLOptions', options);
      context.dispatch('fetchDatasets');
    }
  }
};

export default datasets;
