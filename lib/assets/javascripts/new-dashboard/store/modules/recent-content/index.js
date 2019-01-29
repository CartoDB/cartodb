import { defaultParams as filtersDefaultParams } from 'new-dashboard/core/filters';
import toObject from 'new-dashboard/utils/to-object';

import * as VisualizationActions from '../../actions/visualizations';
import * as VisualizationMutations from '../../mutations/visualizations';

const recentContent = {
  namespaced: true,
  state: {
    list: []
  },
  getters: {},
  mutations: {
    setRecentContent (state, { visualizations }) {
      state.list = toObject(visualizations, 'id');
    },
    updateLike: VisualizationMutations.updateLike,
    updateNumberLikes: VisualizationMutations.updateNumberLikes
  },
  actions: {
    fetchContent (context) {
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
    },

    like: VisualizationActions.like,
    deleteLike: VisualizationActions.deleteLike,
    updateVisualization: VisualizationActions.updateVisualization
  }
};

export default recentContent;
