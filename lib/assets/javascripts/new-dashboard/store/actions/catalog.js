export function fetchCategories (context) {
  context.commit('setFetchingState');

  /* Using SQL API with observatory account
  https://{username}.carto.com/api/v2/sql?q={SQL statement} */
  const CONFIG_PATH = [`api/v2/sql?q=`];
  const q = `SELECT
    DISTINCT category
    FROM carto_do_catalog_master_datasets
    WHERE include_in_public_web = true`;
  const PATH = CONFIG_PATH + q;
  const opts = {
    baseUrl: 'https://observatory.carto.com',
    doNoSetDefaultContentType: true
  };

  return new Promise((resolve, reject) => {
    context.rootState.client.get([PATH], opts, function (err, _, data) {
      if (err) {
        context.commit('setRequestError', err);
        return reject(err);
      }
      context.commit('setCategories', data.rows);
      resolve();
    });
  });
}

export function fetchCountries (context, category) {
  context.commit('setFetchingState');

  /* Using SQL API with observatory account
  https://{username}.carto.com/api/v2/sql?q={SQL statement} */
  const CONFIG_PATH = [`api/v2/sql?q=`];
  const q = `SELECT
    country
    FROM carto_do_catalog_master_datasets
    WHERE category='${category}'
    and include_in_public_web = true
    GROUP BY country
    ORDER BY country ASC`;
  const PATH = CONFIG_PATH + q;
  const opts = {
    baseUrl: 'https://observatory.carto.com',
    doNoSetDefaultContentType: true
  };

  return new Promise((resolve, reject) => {
    context.rootState.client.get([PATH], opts, function (err, _, data) {
      if (err) {
        context.commit('setRequestError', err);
        return reject(err);
      }
      context.commit('setCountries', data.rows);
      resolve();
    });
  });
}

export function fetchDatasets (context, params) {
  context.commit('setFetchingState');

  /* Using SQL API with observatory account
  https://{username}.carto.com/api/v2/sql?q={SQL statement} */
  const CONFIG_PATH = [`api/v2/sql?q=`];
  const q = `SELECT dataset AS name,
    category,
    description,
    country,
    ARRAY_AGG(DISTINCT spatial_aggregations) AS spatial_aggregations,
    ARRAY_AGG(DISTINCT temporal_aggregations) AS frequency,
    ARRAY_AGG(DISTINCT provider) AS source,
    ARRAY_AGG(DISTINCT variable_name) AS variable_name,
    MIN(cartodb_id) AS id
    FROM carto_do_catalog_master_datasets
    WHERE category='${params.category}'
    and country='${params.country}'
    and include_in_public_web = true
    GROUP BY(dataset, category, country, description)`;
  const PATH = CONFIG_PATH + q;
  const opts = {
    baseUrl: 'https://observatory.carto.com',
    doNoSetDefaultContentType: true
  };

  context.rootState.client.get([PATH], opts, function (err, _, data) {
    if (err) {
      context.commit('setRequestError', err);
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

export function clearList (context) {
  context.commit('setDatasets', []);
  context.commit('setPagination', 1);
}

export function requestDataset (context, { user, dataset }) {
  const hubspot_id = '474999';
  const form_id = '507ead6f-06d9-434a-95e1-a9616c576796';
  const CONFIG_PATH = [`uploads/form/v2/${hubspot_id}/${form_id}`];

  const data = new FormData();
  data.append('email', user.email);
  data.append('firstname', user.name);
  data.append('lastname', user.last_name);
  data.append('jobtitle', user.job_role);
  data.append('company', user.company);
  data.append('phone', user.phone);
  data.append('country_data', dataset.country);
  data.append('category', dataset.category);
  data.append('datastream_name', dataset.name);
  data.append('hs_context', JSON.stringify({ 'pageUrl': 'https://www.carto.com/dashboard/catalog' }));

  const opts = {
    data,
    baseUrl: 'https://forms.hubspot.com',
    doNoSetDefaultContentType: true,
    processData: false
  };

  return new Promise((resolve, reject) => {
    context.rootState.client.post([CONFIG_PATH], opts, function (err, _, data) {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}
