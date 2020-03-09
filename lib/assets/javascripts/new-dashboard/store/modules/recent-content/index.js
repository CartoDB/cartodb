import { defaultParams as filtersDefaultParams } from 'new-dashboard/core/configuration/filters';
import toObject from 'new-dashboard/utils/to-object';

import * as VisualizationActions from '../../actions/visualizations';
import * as VisualizationMutations from '../../mutations/visualizations';

const recentContent = {
  namespaced: true,
  state: {
    isFetching: false,
    isErrored: false,
    error: {},
    list: {},
    metadata: {
      total_entries: 0
    }
  },
  getters: {
    hasRecentContent (state) {
      return state.metadata.total_entries > 0;
    }
  },
  mutations: {
    setFetchingState: VisualizationMutations.setFetchingState,
    setRequestError: VisualizationMutations.setRequestError,
    updateNumberLikes: VisualizationMutations.updateNumberLikes,
    updateVisualization: VisualizationMutations.updateVisualization,

    setRecentContent (state, recentContent) {
      state.list = toObject(recentContent.visualizations, 'id');
      state.metadata = { total_entries: recentContent.total_entries };
      state.isFetching = false;
    }
  },
  actions: {
    like: VisualizationActions.like,
    deleteLike: VisualizationActions.deleteLike,
    updateVisualization: VisualizationActions.updateVisualization,

    fetch (context) {
      context.commit('setFetchingState');

      const params = {
        ...filtersDefaultParams,
        order: 'updated_at',
        order_direction: 'desc',
        types: 'table,derived,kuviz',
        per_page: 3,
        page: 1
      };

      context.rootState.client.getVisualization('',
        params,
        function (err, _, data) {
          if (err) {
            context.commit('setRequestError', err);
            return;
          }

          context.commit('setRecentContent', data);
        }
      );
    }
  }
};

export default recentContent;
