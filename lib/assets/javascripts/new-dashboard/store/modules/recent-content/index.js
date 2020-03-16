import { defaultParams as filtersDefaultParams } from 'new-dashboard/core/configuration/filters';
import toObject from 'new-dashboard/utils/to-object';

import * as VisualizationActions from '../../actions/visualizations';
import * as ExternalVisualizationActions from '../../actions/external-visualizations';
import * as VisualizationMutations from '../../mutations/visualizations';

const RECENT_CONTENT_MAX_SIZE = 3;

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
      state.list = toObject(recentContent, 'id');
      state.metadata = { total_entries: recentContent.length };
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

      const visualizations = VisualizationActions.whenFetchVisualizations(context, params);
      const externalVisualizations = ExternalVisualizationActions.whenFetchVisualizations(context);

      Promise.all([visualizations, externalVisualizations])
        .then(
          ([data, externalData]) => {
            const content = [...data.visualizations, ...externalData];
            const { order, order_direction } = params;
            let orderedContent = [];
            if (order && order_direction) {
              orderedContent = content.sort((a, b) => new Date(b[order]) - new Date(a[order]));
            }
            const recentContentLenght = orderedContent.length > RECENT_CONTENT_MAX_SIZE ? RECENT_CONTENT_MAX_SIZE : orderedContent.length;
            context.commit('setRecentContent', orderedContent.slice(0, recentContentLenght));
          })
        .catch(err => {
          context.commit('setRequestError', err);
        });
    }
  }
};

export default recentContent;
