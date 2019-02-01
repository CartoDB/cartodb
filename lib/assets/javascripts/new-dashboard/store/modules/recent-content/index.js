import { defaultParams as filtersDefaultParams } from 'new-dashboard/core/configuration/filters';
import toObject from 'new-dashboard/utils/to-object';

import * as VisualizationActions from '../../actions/visualizations';
import * as VisualizationMutations from '../../mutations/visualizations';

const recentContent = {
  namespaced: true,
  state: {
    isFetching: false,
    list: [],
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
    updateLike: VisualizationMutations.updateLike,
    updateNumberLikes: VisualizationMutations.updateNumberLikes,

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

    fetchContent (context) {
      context.commit('setFetchingState');

      const params = {
        ...filtersDefaultParams,
        order: 'updated_at',
        order_direction: 'desc',
        types: 'table,derived',
        per_page: 3,
        page: 1
      };

      context.rootState.client.getVisualization('',
        params,
        function (err, _, data) {
          if (err) {
            return;
          }

          context.commit('setRecentContent', data);
        }
      );
    }
  }
};

export default recentContent;
