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

  return new Promise((resolve, reject) => {
    context.rootState.client.get([PATH], opts, function (err, _, data) {
      if (err) {
        context.commit('setRequestError', err);
        return reject(err);
      }
      context.commit('setDatasets', data.rows);
      context.commit('setPagination', context.state.page);
      resolve();
    });
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
  /* Using V3 hubspot API
  https://api.hsforms.com/submissions/v3/integration/submit/:portalId/:formGuid */
  const hubspot_id = '474999';
  const form_id = '507ead6f-06d9-434a-95e1-a9616c576796';
  const CONFIG_PATH = [`submissions/v3/integration/submit/${hubspot_id}/${form_id}`];

  const data = getFormData(user, dataset);

  const opts = {
    data,
    baseUrl: 'https://api.hsforms.com'
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

function getFormData (user, dataset) {
  return JSON.stringify({
    'fields': [
      {
        'name': 'email',
        'value': user.email
      },
      {
        'name': 'lastname',
        'value': user.last_name || 'no_last_name'
      },
      {
        'name': 'firstname',
        'value': user.name || 'no_firstname'
      },
      {
        'name': 'jobtitle',
        'value': user.job_role || 'no_jobtitle'
      },
      {
        'name': 'company',
        'value': user.company || user.organization ? user.organization.display_name || user.organization.name : 'no_company'
      },
      {
        'name': 'phone',
        'value': user.phone || 'no_phone'
      },
      {
        'name': 'country_data',
        'value': dataset.country
      },
      {
        'name': 'data_category',
        'value': dataset.category
      },
      {
        'name': 'datastream_name',
        'value': dataset.name
      },
      {
        'name': 'data_purpose',
        'value': 'no_data_purpose'
      }
    ],
    'context': {
      'pageUri': 'www.carto.com/dashboard/catalog',
      'pageName': 'Catalog page in Dashboard'
    }
  });
}
