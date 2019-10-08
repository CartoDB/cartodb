// export function fetch (fetchFunctionName) {
export function fetchCatalog (context, params) {
  context.commit('setFetchingState');

  /* Using SQL API with observatory account
  https://{username}.carto.com/api/v1/sql?q={SQL statement} */
  const CONFIG_PATH = [`api/v1/sql?q=`];
  const q = `SELECT
    dataset AS name,
    spatial_aggregations,
    delivery_frequency AS frequency,
    provider AS source
    FROM carto_do_catalog_master_datasets
    LIMIT 20`;
  const PATH = CONFIG_PATH + q;
  const opts = {
    baseUrl: 'https://observatory.carto.com'
  };

  context.rootState.client.get([PATH], opts, function (err, _, data) {
    if (err) {
      const error = data.responseJSON && data.responseJSON.errors ||
        { message: data.responseText || data.statusText };
      context.commit('setRequestError', error.message);
      return;
    }
    context.commit('setDatasets', data.rows);
    context.commit('setPagination', context.state.page);
  });
}

export function setURLOptions (context, options) {
  context.commit('setPagination', parseInt(options.page || 1));
  context.commit('setOrder', { order: options.order, direction: options.order_direction });
}

export function order (context, orderOptions) {
  context.commit('setPagination', 1);
  context.commit('setOrder', orderOptions);
  context.commit('orderDatasets');
}
