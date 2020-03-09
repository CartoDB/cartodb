import getCARTOData from 'new-dashboard/store/utils/getCARTOData';

function customStorageToVisualization (csVisualizationList, filter) {
  const cartoData = getCARTOData();

  const visualizationList = csVisualizationList.reduce((acum, elem) => {
    let filtered = false;
    for (const key in filter) {
      if (elem[key] !== filter[key]) {
        filtered = true;
        break;
      }
    }
    if (!filtered) {
      acum.push({
        id: elem.id,
        name: elem.name,
        display_name: null,
        map_id: elem.id,
        active_layer_id: null,
        type: 'keplergl',
        tags: [],
        description: elem.description,
        privacy: elem.isPrivate ? 'PRIVATE' : 'LINK',
        created_at: elem.lastModified,
        updated_at: elem.lastModified,
        locked: false,
        source: null,
        title: null,
        license: null,
        attributions: null,
        kind: null,
        external_source: {},
        // eslint-disable-next-line no-undef
        url: `${__KEPLERGL_BASE_URL__}/demo/map/carto?mapId=${elem.id}&owner=${cartoData.user_data.username}&privateMap=${elem.isPrivate}`, // TODO: Set Kepler.gl URL depending on a env var
        version: 1,
        prev_id: null,
        next_id: null,
        parent_id: null,
        transition_options: {},
        active_child: null,
        children: [],
        synchronization: null,
        uses_builder_features: false,
        liked: false,
        permission: {
          owner: cartoData.user_data,
          acl: []
        },
        stats: {},
        auth_tokens: [],
        table: {},
        thumbnailDataUrl: elem.thumbnail
      });
    }
    return acum;
  }, []);

  return visualizationList;
}

export function fetchVisualizations (context, parameters) {
  if (context.state.customStorageInitialized) {
    context.commit('setFetchingState');
    context.rootState.customStorage.getVisualizations()
      .then(data => {
        // Format and filter results
        const filter = {};
        if (parameters.privacy) {
          filter.isPrivate = parameters.privacy === 'private';
        }
        let visData = customStorageToVisualization(data, filter);

        // Apply order
        const { order, order_direction } = parameters;
        if (order && order_direction) {
          visData = visData.sort((a, b) => b[order] - a[order]);
          if (order_direction === 'desc') {
            visData = visData.reverse();
          }
        }

        context.commit('setExternalMaps', visData);
        context.commit('setPagination', context.state.page);
      })
      .catch(err => {
        context.commit('setRequestError', err);
      });
  }
}

export function deleteVisualization (context, parameters) {
  if (context.state.customStorageInitialized) {
    context.rootState.customStorage.deleteVisualization(parameters.visId)
      .then(() => {
        fetchVisualizations(context, null);
      })
      .catch((err) => {
        context.commit('setRequestError', err);
      });
  }
}

export function filter (context, filter) {
  context.commit('setPagination', 1);
  context.commit('setFilterType', filter);
  context.dispatch('fetch');
}

export function order (context, orderOptions) {
  context.commit('setPagination', 1);
  context.commit('setOrder', orderOptions);
  context.dispatch('fetch');
}

export function resetFilters (DEFAULT_VALUES) {
  return function (context) {
    context.commit('setPagination', 1);
    context.commit('setFilterType', 'mine');
    context.commit('setResultsPerPage', 12);
    context.commit('setOrder', { order: DEFAULT_VALUES.order, direction: DEFAULT_VALUES.orderDirection });
  };
}

export function setResultsPerPage (context, perPage) {
  context.commit('setResultsPerPage', perPage);
}

export function setURLOptions (context, options) {
  context.commit('setPagination', parseInt(options.page || 1));
  context.commit('setFilterType', options.filter);
  context.commit('setOrder', { order: options.order, direction: options.order_direction });
  context.dispatch('fetch');
}
