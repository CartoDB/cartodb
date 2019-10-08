export function fetchCatalog (context, params) {
  context.commit('setFetchingState');

  /* Using SQL API with observatory account
  https://{username}.carto.com/api/v1/sql?q={SQL statement} */
  const CONFIG_PATH = [`api/v1/sql?q=`];
  const q = `SELECT
    DISTINCT category
    FROM carto_do_catalog_master_datasets
    WHERE include_in_public_web = true`;
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
    context.commit('setCategories', data.rows);
  });
}

export function fetchCountries (context, category) {
  context.commit('setFetchingState');

  /* Using SQL API with observatory account
  https://{username}.carto.com/api/v1/sql?q={SQL statement} */
  const CONFIG_PATH = [`api/v1/sql?q=`];
  const q = `SELECT
    country
    FROM carto_do_catalog_master_datasets
    WHERE category='${category}'
    GROUP BY country
    ORDER BY country ASC`;
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
    context.commit('setCountries', data.rows);
  });
}

export function fetchDatasets (context, params) {
  context.commit('setFetchingState');

  /* Using SQL API with observatory account
  https://{username}.carto.com/api/v1/sql?q={SQL statement} */
  const CONFIG_PATH = [`api/v1/sql?q=`];
  const q = `SELECT dataset AS name,
    category,
    ARRAY_AGG(DISTINCT spatial_aggregations) AS spatial_aggregations,
    ARRAY_AGG(DISTINCT temporal_aggregations) AS frequency,
    ARRAY_AGG(DISTINCT provider) AS source
    FROM carto_do_catalog_master_datasets
    WHERE category='${params.category}'
    and country='${params.country}'
    and include_in_public_web = true
    GROUP BY(dataset, category)`;
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
