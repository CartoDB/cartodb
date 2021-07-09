import 'whatwg-fetch';

import { setUrlParameters } from 'new-dashboard/utils/catalog/url-parameters';
import { getBaseURL } from 'new-dashboard/utils/catalog/base-url';
import { getMetricsBaseURL } from '../../utils/catalog/base-url';

const entitiesEndpoint = 'data/observatory/metadata/entities';
const datasetsEndpoint = 'data/observatory/metadata/datasets';
const geographiesEndpoint = 'data/observatory/metadata/geographies';
const notebookEndpoint = 'data/observatory/templates/notebooks/explore';
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

  const baseURL = getBaseURL(context.rootState);
  const url = `${baseURL}/${entitiesEndpoint}?${filtersToPayload(context.state.filter)}`;

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

  const baseURL = getBaseURL(context.rootState);
  const endpoint = type === 'dataset' ? datasetsEndpoint : geographiesEndpoint;
  const url = `${baseURL}/${endpoint}/${id}?geom_in_summary=false&only_products=true`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    context.commit('setDataset', { ...data });
  } catch (error) {
    console.error(`ERROR: ${error}`);
  }
}

export async function fetchKeyVariables (context, { id, type }) {
  const baseURL = getBaseURL(context.rootState);
  const endpoint = type === 'dataset' ? datasetsEndpoint : geographiesEndpoint;
  const url = `${baseURL}/${endpoint}/${id}/key_variables`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    context.commit('setKeyVariables', data);
  } catch (error) {
    console.error(`ERROR: ${error}`);
  }
}

export async function fetchVariables (context, { id, type }) {
  const baseURL = getBaseURL(context.rootState);
  const endpoint = type === 'dataset' ? datasetsEndpoint : geographiesEndpoint;
  const url = `${baseURL}/${endpoint}/${id}/variables?minimal=true`;

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

export async function requestExtendedLicense (context, id) {
  requestAccess(context, { subscriptionId: id, requestedPlatformProperty: 'full_access_status_bq' });
}

export async function requestAccess (context, { subscriptionId, requestedPlatformProperty }) {
  if (!context.rootState.user) {
    return;
  }

  try {
    const baseURL = getBaseURL(context.rootState);
    const apiKey = context.rootState.user.api_key;
    const accessParams = `${requestedPlatformProperty}=requested`;
    const url = `${baseURL}/${subscriptionsEndpoint}/${subscriptionId}?api_key=${apiKey}&${accessParams}`;
    const response = await fetch(url, { method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'content-type': 'application/json'
      }
    });
    const subscription = await response.json();
    context.state.currentSubscription = subscription;
  } catch (error) {
    context.state.requestError = error.message;
  }
}

export function requestAccessHubspot (context, { dataset, platform, type }) {
  /* Using V3 hubspot API
  https://api.hsforms.com/submissions/v3/integration/submit/:portalId/:formGuid */
  const hubspot_id = '474999';
  const form_id = '507ead6f-06d9-434a-95e1-a9616c576796';
  const CONFIG_PATH = [`submissions/v3/integration/submit/${hubspot_id}/${form_id}`];
  const user = context.rootState.user;

  const data = prepareAccessDataToHubspot(user, dataset, platform, type);

  const opts = {
    data,
    baseUrl: 'https://api.hsforms.com'
  };

  return new Promise((resolve, reject) => {
    context.rootState.client.post([CONFIG_PATH], opts, err => {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

export async function fetchSubscriptionsList (context, merge = false) {
  if (!context.rootState.user) {
    return;
  }
  const baseURL = getBaseURL(context.rootState);
  const apiKey = context.rootState.user.api_key;
  const url = `${baseURL}/${subscriptionsEndpoint}?api_key=${apiKey}`;

  try {
    const response = await fetch(url);
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
  const baseURL = getBaseURL(context.rootState);
  const idGroups = chunkArray(subscriptions_ids, 100).map(ids => ids.map(id => `id=${id}`).join('&'));
  const urls = idGroups.map(ids => `${baseURL}/${entitiesEndpoint}?filter_catalog=false&${ids}`);

  try {
    const response = await Promise.all(urls.map(u => fetch(u)));
    const data = await Promise.all(response.map(v => v.json()));
    const results = data.map(d => d.results).flat(1);
    const mergedData = context.state.subscriptionsList.map(s => {
      return {
        ...s,
        ...results.find(r => r.id === s.id)
      };
    });
    context.commit('setSubscriptionsList', mergedData);
  } catch (error) {
    console.error(`ERROR: ${error}`);
  }
}

export async function performSubscribe (context, { id, type }) {
  if (!context.rootState.user) {
    return;
  }
  const baseURL = getBaseURL(context.rootState);
  const apiKey = context.rootState.user.api_key;
  const url = `${baseURL}/${subscriptionsEndpoint}?id=${id}&type=${type}&api_key=${apiKey}`;

  try {
    const response = await fetch(url, { method: 'POST' });
    return response.status === 200 || response.status === 204;
  } catch (error) {
    return false;
  }
}

export async function performUnsubscribe (context, { id, type }) {
  if (!context.rootState.user) {
    return;
  }
  const baseURL = getBaseURL(context.rootState);
  const apiKey = context.rootState.user.api_key;
  const url = `${baseURL}/${subscriptionsEndpoint}?id=${id}&type=${type}&api_key=${apiKey}`;

  try {
    const response = await fetch(url, { method: 'DELETE' });
    return response.status === 200 || response.status === 204;
  } catch (error) {
    return false;
  }
}

export async function performSubscriptionSync (context, id) {
  if (!context.rootState.user) {
    return;
  }
  const baseURL = getBaseURL(context.rootState);
  const apiKey = context.rootState.user.api_key;
  const url = `${baseURL}/${subscriptionsEndpoint}/${id}/sync/?api_key=${apiKey}`;

  try {
    const response = await fetch(url, { method: 'POST' });
    return response.status === 200 || response.status === 204;
  } catch (error) {
    return false;
  }
}

export async function performSubscriptionUnsync (context, id) {
  if (!context.rootState.user) {
    return;
  }
  const baseURL = getBaseURL(context.rootState);
  const apiKey = context.rootState.user.api_key;
  const url = `${baseURL}/${subscriptionsEndpoint}/${id}/sync/?api_key=${apiKey}`;

  try {
    const response = await fetch(url, { method: 'DELETE' });
    return response.status === 200 || response.status === 204;
  } catch (error) {
    return false;
  }
}

export async function connectSubscriptionSample (context, id) {
  if (!context.rootState.user) {
    return;
  }
  const baseURL = getBaseURL(context.rootState);
  const apiKey = context.rootState.user.api_key;
  const url = `${baseURL}/${subscriptionsEndpoint}/${id}/sample/?api_key=${apiKey}`;

  try {
    const response = await fetch(url, { method: 'POST' });
    return response.status === 200 || response.status === 204;
  } catch (error) {
    return false;
  }
}

export async function downloadNotebook (context, { id, type }) {
  if (!context.rootState.user) {
    return;
  }
  const params = [
    `id=${id}`,
    `type=${type}`,
    `api_key=${context.rootState.user.api_key}`,
    `username=${context.rootState.user.username}`
  ];
  const baseURL = getBaseURL(context.rootState);
  const url = `${baseURL}/${notebookEndpoint}?${params.join('&')}`;

  const link = document.createElement('a');
  link.href = url;
  link.click();
}

export function requestDataset (context, { user, dataset, requestStatus }) {
  /* Using V3 hubspot API
  https://api.hsforms.com/submissions/v3/integration/submit/:portalId/:formGuid */
  const hubspot_id = '474999';
  const form_id = '507ead6f-06d9-434a-95e1-a9616c576796';
  const CONFIG_PATH = [`submissions/v3/integration/submit/${hubspot_id}/${form_id}`];

  const data = getFormData(user, dataset, requestStatus);

  const opts = {
    data,
    baseUrl: 'https://api.hsforms.com'
  };

  return new Promise((resolve, reject) => {
    context.rootState.client.post([CONFIG_PATH], opts, err => {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

export async function sendMetrics (context, { name, datasetId, platform, licenseType }) {
  const baseURL = getMetricsBaseURL(context.rootState);
  const apiKey = context.rootState.user.api_key;
  const url = `${baseURL}?api_key=${apiKey}`;
  const payload = {
    name,
    properties: {
      user_id: context.rootState.user.id,
      dataset_id: datasetId,
      db_type: platform,
      license_type: licenseType
    }
  };
  try {
    await fetch(url, { method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.error(e);
  }
}

export async function sendAccessAttemptMetrics (context, { datasetId, platform, licenseType }) {
  sendMetrics(context, { name: 'do_full_access_attempt', datasetId, platform, licenseType });
}

export async function sendRequestExtendedMetrics (context, { datasetId, licenseType }) {
  sendMetrics(context, { name: 'do_full_access_request', datasetId, platform: 'bq', licenseType });
}

export async function sendRequestAccessMetrics (context, { datasetId, platform, licenseType }) {
  sendMetrics(context, { name: 'do_full_access_request', datasetId, platform, licenseType });
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
  params.push('filter_catalog=true');

  return params.join('&');
}

function prepareAccessDataToHubspot (user, dataset, platform, type) {
  return JSON.stringify({
    fields: [
      ...prepareUserToHubspotFields(user),
      ...prepareDatasetToHubspot(dataset),
      {
        name: 'data_request_type',
        value: type
      },
      {
        name: 'data_cloud_access',
        value: platform
      }
    ],
    context: {
      pageUri: 'www.carto.com/dashboard/datasets/subscriptions',
      pageName: 'Subscriptions page in Dashboard'
    }
  });
}

function getFormData (user, dataset, requestStatus) {
  return JSON.stringify({
    fields: [
      ...prepareUserToHubspotFields(user),
      ...prepareDatasetToHubspot(dataset),
      {
        name: 'datastream_request_status',
        value: requestStatus || 'active'
      }
    ],
    skipValidation: true,
    context: {
      pageUri: 'www.carto.com/dashboard/spatial-data-catalog',
      pageName: 'Spatial Data Catalog page in Dashboard'
    }
  });
}

function prepareUserToHubspotFields (user) {
  return [
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
        user.company ||
        (user.organization
          ? user.organization.display_name || user.organization.name
          : 'no_company')
    },
    {
      name: 'phone',
      value: user.phone || 'no_phone'
    }
  ];
}

function prepareDatasetToHubspot (dataset) {
  return [
    {
      name: 'country_data',
      value: dataset.country_name || ''
    },
    {
      name: 'data_category',
      value: dataset.category_name || 'Geography'
    },
    {
      name: 'datastream_name',
      value: dataset.data_source_name || ''
    },
    {
      name: 'provider',
      value: dataset.provider_name || ''
    },
    {
      name: 'datastream_license',
      value: dataset.license_name || ''
    },
    {
      name: 'data_purpose',
      value: 'no_data_purpose'
    }
  ];
}

function chunkArray (array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    const chunk = array.slice(i, i + size);
    result.push(chunk);
  }
  return result;
}
