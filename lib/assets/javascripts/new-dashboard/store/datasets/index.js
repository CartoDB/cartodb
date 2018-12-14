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
    orderDirection: 'desc',
    list: {},
    metadata: {},
    page: 1,
    numPages: 1,
    resultsPerPage: 1
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
        total_locked: datasets.total_locked,
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
      state.order = options.order || 'updated_at';
      state.orderDirection = options.order_direction || 'desc';
    },

    setDatasetAttributes (state, {datasetId, datasetAttributes}) {
      Object.assign(state.list[datasetId], datasetAttributes);
    },

    setPagination (state, page = 1) {
      state.page = page;
      state.numPages = Math.ceil(state.metadata.total_entries / filtersDefaultParams.per_page) || 1;
    },

    setFilterType (state, filterType = 'mine') {
      state.filterType = filterType;
    },

    setOrder (state, orderOpts) {
      state.order = orderOpts.order || 'updated_at';
      state.orderDirection = orderOpts.direction || 'desc';
    },

    setResultsPerPage (state, resultsPerPage) {
      state.resultsPerPage = resultsPerPage;
    },

    updateLike (state, {datasetId, liked}) {
      state.list[datasetId].liked = liked;
    },

    updateNumberLikes (state, {datasetId, likes}) {
      state.list[datasetId].likes = likes;
    }
  },
  actions: {
    fetchDatasets (context) {
      context.commit('setFetchingState');

      const params = {
        ...Filters[context.state.filterType],
        types: 'table',
        page: context.state.page,
        order: context.state.order,
        order_direction: context.state.orderDirection,
        per_page: context.state.resultsPerPage
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

    filterDatasets (context, filter) {
      context.commit('setPagination', 1);
      context.commit('setFilterType', filter);
      context.dispatch('fetchDatasets');
    },

    orderMaps (context, orderOptions) {
      context.commit('setPagination', 1);
      context.commit('setOrder', orderOptions);
      context.dispatch('fetchDatasets');
    },

    like (context, dataset) {
      const currentLikeStatus = dataset.liked;
      context.commit('updateLike', { datasetId: dataset.id, liked: true });
      client.like(dataset.id,
        function (err, _, data) {
          if (err) {
            context.commit('updateLike', { datasetId: dataset.id, liked: currentLikeStatus });
            return;
          }
          context.commit('updateNumberLikes', { datasetId: dataset.id, likes: data.likes });
        }
      );
    },

    deleteLike (context, dataset) {
      const currentLikeStatus = dataset.liked;
      context.commit('updateLike', { datasetId: dataset.id, liked: false });
      client.deleteLike(dataset.id,
        function (err, _, data) {
          if (err) {
            context.commit('updateLike', { datasetId: dataset.id, liked: currentLikeStatus });
            return;
          }
          context.commit('updateNumberLikes', { datasetId: dataset.id, likes: data.likes });
        }
      );
    },

    updateDataset (context, datasetOptions) {
      context.commit('setDatasetAttributes', datasetOptions);
    },

    setResultsPerPage (context, perPage) {
      context.commit('setResultsPerPage', perPage);
    },

    setURLOptions (context, options) {
      context.commit('setURLOptions', options);
      context.dispatch('fetchDatasets');
    },

    resetFilters (context, doFetch = true) {
      context.commit('setPagination', 1);
      context.commit('setFilterType', 'mine');
      context.commit('setResultsPerPage', 12);

      if (doFetch) {
        context.dispatch('fetchDatasets');
      }
    }
  }
};

export default datasets;
