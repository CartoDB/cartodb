import 'whatwg-fetch';

import { setUrlParameters } from 'new-dashboard/utils/catalog/url-parameters';

// const baseUrl = ' https://public.carto.com/api/v4/';
const baseUrl = 'https://jarroyo.carto-staging.com/api/v4/';
const entitiesEndpoint = 'data/observatory/metadata/entities';
const datasetsEndpoint = 'data/observatory/metadata/datasets';
const geographiesEndpoint = 'data/observatory/metadata/geographies';
const subscriptionsEndpoint = 'do/subscriptions';

export function initFilter (context, query) {
  const filter = {
    searchText: '',
    limit: process.env.VUE_APP_PAGE_SIZE || 10,
    page: 0,
    categories: {}
  };

  const filterCategories = [
    'country',
    'category',
    'license',
    'provider',
    'placetype'
  ];

  filterCategories.forEach(filterCategory => {
    if (filterCategory in query) {
      filter.categories[filterCategory] = query[filterCategory]
        .split(',')
        .map(item => ({ id: item }));
    }
  });

  if ('search' in query) {
    filter.searchText = query.search;
  }

  if ('page' in query) {
    filter.page = parseInt(query.page) - 1;
  }

  context.state.filter = filter;
}

export async function fetchDatasetsList (context) {
  setUrlParameters(context.state);

  context.commit('resetDatasetsList');
  context.commit('setFetchingState');

  let url = baseUrl + entitiesEndpoint + filtersToPayload(context.state.filter);

  try {
    const response = await fetch(url);
    const data = await response.json();

    // Entities list
    context.commit('setDatasetsList', data.results);

    // Entities list count
    context.commit('setDatasetsListCount', data.total_results);

    // Filters
    for (let key in data.filters) {
      context.commit('setAvailableFilters', {
        id: key,
        options: data.filters[key]
      });
    }
  } catch (error) {
    console.error(`ERROR: ${error}`);
  }
}

export async function fetchDataset (context, { id, type }) {
  context.commit('resetDataset');
  context.commit('setFetchingState');

  let url = baseUrl;
  if (type === 'dataset') {
    url += datasetsEndpoint + '/' + id;
  } else {
    url += geographiesEndpoint + '/' + id;
  }

  try {
    let response = await fetch(url);
    const data = await response.json();
    context.commit('setDataset', { ...data });
  } catch (error) {
    console.error(`ERROR: ${error}`);
  }
}

export async function fetchKeyVariables (context, { id, type }) {
  let url = baseUrl;
  if (type === 'dataset') {
    url += datasetsEndpoint + '/' + id + '/key_variables';
  } else {
    url += geographiesEndpoint + '/' + id + '/variables?minimal=true';
  }

  try {
    const response = await fetch(url);
    const data = await response.json();
    context.commit('setKeyVariables', data);
  } catch (error) {
    console.error(`ERROR: ${error}`);
  }
}

export async function fetchVariables (context, { id, type }) {
  let url = baseUrl;
  if (type === 'dataset') {
    url += datasetsEndpoint + '/' + id + '/variables?minimal=true';
  } else {
    url += geographiesEndpoint + '/' + id + '/variables?minimal=true';
  }

  try {
    const response = await fetch(url);
    const data = await response.json();
    context.commit('setVariables', data);
  } catch (error) {
    console.error(`ERROR: ${error}`);
  }
}

export function setSearchText (context, searchText) {
  context.commit('setSearchText', searchText);
}

export function setPage (context, page) {
  context.commit('setPage', page);
}

export function clearTagFilters (context) {
  context.commit('resetTagFilters');
}

export async function fetchSubscriptionsList (context, merge = false) {
  let url = `${context.rootState.user.base_url}/api/v4/${subscriptionsEndpoint}?api_key=${context.rootState.user.api_key}`;
  try {
    let response = await fetch(url);
    const data = await response.json();
    if (merge) {
      const mergedData = context.state.subscriptionsList.map(s => {
        return {
          ...s,
          ...data.subscriptions.find(r => r.id === s.id)
        };
      });
      context.commit('setSubscriptionsList', mergedData || []);
    } else {
      context.commit('setSubscriptionsList', data.subscriptions || []);
    }
  } catch (error) {
    console.error(`ERROR: ${error}`);
  }
}

export async function fetchSubscriptionsDetailsList (context, subscriptions_ids) {
  const url = baseUrl + entitiesEndpoint + `?id=${subscriptions_ids.join('&id=')}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    const mergedData = context.state.subscriptionsList.map(s => {
      return {
        ...s,
        ...data.results.find(r => r.id === s.id)
      };
    });
    context.commit('setSubscriptionsList', mergedData);
  } catch (error) {
    console.error(`ERROR: ${error}`);
  }
}

export async function fetchSubscribe (context, { id, type }) {
  const url = `${context.rootState.user.base_url}/api/v4/${subscriptionsEndpoint}?id=${id}&type=${type}&api_key=${context.rootState.user.api_key}`;
  try {
    const response = await fetch(url, { method: 'POST' });
    return response.status === 200 || response.status === 204;
  } catch (error) {
    return false;
  }
}

export async function fetchUnSubscribe (context, { id, type }) {
  const url = `${context.rootState.user.base_url}/api/v4/${subscriptionsEndpoint}?id=${id}&type=${type}&api_key=${context.rootState.user.api_key}`;
  try {
    const response = await fetch(url, { method: 'DELETE' });
    return response.status === 200 || response.status === 204;
  } catch (error) {
    return false;
  }
}

export async function fetchSubscriptionSync (context, id) {
  const url = `${context.rootState.user.base_url}/api/v4/${subscriptionsEndpoint}/${id}/sync/?api_key=${context.rootState.user.api_key}`;
  try {
    const response = await fetch(url, { method: 'POST' });
    return response.status === 200 || response.status === 204;
  } catch (error) {
    return false;
  }
}

export async function fetchSubscriptionUnSync (context, id) {
  const url = `${context.rootState.user.base_url}/api/v4/${subscriptionsEndpoint}/${id}/sync/?api_key=${context.rootState.user.api_key}`;
  try {
    const response = await fetch(url, { method: 'DELETE' });
    return response.status === 200 || response.status === 204;
  } catch (error) {
    return false;
  }
}

export async function downloadNotebook (context, { id, type }) {
  const params = [
    `id=${id}`,
    `type=${type}`,
    `api_key=${context.rootState.user.api_key}`,
    `username=${context.rootState.user.username}`
  ];
  const url = baseUrl + `data/observatory/templates/notebooks/explore?${params.join('&')}`;
  const link = document.createElement('a');
  link.href = url;
  link.click();
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
    context.rootState.client.post([CONFIG_PATH], opts, err => {
      if (err) {
        return reject(err);
      }
      context.commit('addInterestedSubscriptions', dataset.id);
      resolve();
    });
  });
}

function filtersToPayload (filter) {
  let params = [];

  const { searchText, limit, page, categories } = filter;
  const offset = page * limit;

  for (let key in categories) {
    if (categories[key].length) {
      params = params.concat(categories[key].map(item => `${key}=${item.id}`));
    }
  }

  if (searchText) {
    params.push(`searchtext=${encodeURIComponent(searchText)}`);
  }

  params.push(`limit=${limit}`);
  params.push(`offset=${offset}`);

  return `?${params.join('&')}`;
}

function getFormData (user, dataset) {
  return JSON.stringify({
    fields: [
      {
        name: 'email',
        value: user.email
      },
      {
        name: 'lastname',
        value: user.last_name || 'no_last_name'
      },
      {
        name: 'firstname',
        value: user.name || 'no_firstname'
      },
      {
        name: 'jobtitle',
        value: user.job_role || 'no_jobtitle'
      },
      {
        name: 'company',
        value:
          user.company || user.organization
            ? user.organization.display_name || user.organization.name
            : 'no_company'
      },
      {
        name: 'phone',
        value: user.phone || 'no_phone'
      },
      {
        name: 'country_data',
        value: dataset.country_name
      },
      {
        name: 'data_category',
        value: dataset.category_name
      },
      {
        name: 'datastream_name',
        value: dataset.data_source_name
      },
      {
        name: 'provider',
        value: dataset.provider_name
      },
      {
        name: 'datastream_license',
        value: dataset.license_name
      },
      {
        name: 'data_purpose',
        value: 'no_data_purpose'
      }
    ],
    context: {
      pageUri: 'www.carto.com/dashboard/spatial-data-catalog',
      pageName: 'Spatial Data Catalog page in Dashboard'
    }
  });
}
