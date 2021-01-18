import 'whatwg-fetch';

async function __createNewConnection (context, payload) {
  // TODO: getBaseUrl and build url
  // const baseURL = getBaseURL(context.rootState);
  // const apiKey = context.rootState.user.api_key;
  // const url = `${baseURL}/${subscriptionsEndpoint}?api_key=${apiKey}`;

  const url = 'https://connreg.carto-staging.com/api/v4/connections?api_key=5d0c2ec7adc5a6868e38d7ed66aa070c796d91bd';
  const response = await fetch(url, { method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify(payload) });

  if (!response.ok) {
    const message = await response.json();
    throw new Error(message.errors);
  }
  const data = await response.json();
  return data;
}

export async function fetchConnectionsList (context) {
  if (!context.rootState.user) {
    return;
  }

  context.commit('setLoadingConnections');

  // TODO: getBaseUrl and build url
  // const baseURL = getBaseURL(context.rootState);
  // const apiKey = context.rootState.user.api_key;
  // const url = `${baseURL}/${subscriptionsEndpoint}?api_key=${apiKey}`;

  const url = 'https://connreg.carto-staging.com/api/v4/connections?api_key=5d0c2ec7adc5a6868e38d7ed66aa070c796d91bd';
  try {
    const response = await fetch(url);
    const data = await response.json();
    context.commit('setConnections', data || []);
  } catch (error) {
    console.error(`ERROR: ${error}`);
  }
}

export async function fetchConnectionById (context, id) {
  if (!context.rootState.user) {
    return;
  }

  // TODO: getBaseUrl and build url
  // const baseURL = getBaseURL(context.rootState);
  // const apiKey = context.rootState.user.api_key;
  // const url = `${baseURL}/${subscriptionsEndpoint}?api_key=${apiKey}`;

  const url = `https://connreg.carto-staging.com/api/v4/connections/${id}?api_key=5d0c2ec7adc5a6868e38d7ed66aa070c796d91bd`;
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error(`ERROR: ${error}`);
  }
}

export async function deleteConnection (context, id) {
  if (!context.rootState.user) {
    return;
  }

  // context.commit('setLoadingConnections');

  // TODO: getBaseUrl and build url
  // const baseURL = getBaseURL(context.rootState);
  // const apiKey = context.rootState.user.api_key;
  // const url = `${baseURL}/${subscriptionsEndpoint}?api_key=${apiKey}`;

  const url = `https://connreg.carto-staging.com/api/v4/connections/${id}?api_key=5d0c2ec7adc5a6868e38d7ed66aa070c796d91bd`;
  try {
    await fetch(url, { method: 'DELETE' });
    context.dispatch('fetchConnectionsList');
  } catch (error) {
    console.error(`ERROR: ${error}`);
  }
}

export async function checkOauthConnection (context, connector) {
  if (!context.rootState.user) {
    return;
  }

  // TODO: getBaseUrl and build url
  // const baseURL = getBaseURL(context.rootState);
  // const apiKey = context.rootState.user.api_key;
  // const url = `${baseURL}/${subscriptionsEndpoint}?api_key=${apiKey}`;

  const url = `https://connreg.carto-staging.com/api/v4/connections/check_oauth/${connector}?api_key=5d0c2ec7adc5a6868e38d7ed66aa070c796d91bd`;
  const response = await fetch(url);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.errors);
  }
  context.commit('setLoadingConnections');
  context.dispatch('fetchConnectionsList');
  return data;
}

export async function fetchOAuthFileList (context, connector) {
  if (!context.rootState.user) {
    return;
  }

  // TODO: getBaseUrl and build url
  // const baseURL = getBaseURL(context.rootState);
  // const apiKey = context.rootState.user.api_key;
  // const url = `${baseURL}/${subscriptionsEndpoint}?api_key=${apiKey}`;

  const url = `https://connreg.carto-staging.com/api/v1/imports/service/${connector}/list_files?api_key=5d0c2ec7adc5a6868e38d7ed66aa070c796d91bd`;
  const response = await fetch(url);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.errors);
  }
  return data;
}

export async function createNewOauthConnection (context, connector) {
  if (!context.rootState.user) {
    return;
  }

  const data = await __createNewConnection(context, {
    connector: connector,
    type: 'oauth-service'
  });
  context.dispatch('fetchConnectionsList');
  return data && data.auth_url;
}

export async function createNewConnection (context, { name, connector, ...parameters }) {
  if (!context.rootState.user) {
    return;
  }

  const data = await __createNewConnection(context, { name, connector, parameters });
  context.dispatch('fetchConnectionsList');
  return data && data.id;
}

export async function editExistingConnection (context, { id, name, connector, ...parameters }) {
  if (!context.rootState.user) {
    return;
  }

  // context.commit('setLoadingConnections');

  // TODO: getBaseUrl and build url
  // const baseURL = getBaseURL(context.rootState);
  // const apiKey = context.rootState.user.api_key;
  // const url = `${baseURL}/${subscriptionsEndpoint}?api_key=${apiKey}`;

  const url = `https://connreg.carto-staging.com/api/v4/connections/${id}?api_key=5d0c2ec7adc5a6868e38d7ed66aa070c796d91bd`;
  const response = await fetch(url, { method: 'PUT',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({ name, parameters }) });

  if (!response.ok) {
    const message = await response.json();
    throw new Error(message.errors);
  }

  context.dispatch('fetchConnectionsList');
  return id;
}

export async function connectionDryrun (context, { connector, id, sql_query, import_as }) {
  if (!context.rootState.user) {
    return;
  }

  // context.commit('setLoadingConnections');

  // TODO: getBaseUrl and build url
  // const baseURL = getBaseURL(context.rootState);
  // const apiKey = context.rootState.user.api_key;
  // const url = `${baseURL}/${subscriptionsEndpoint}?api_key=${apiKey}`;

  const url = `https://connreg.carto-staging.com/api/v1/connectors/${connector}/dryrun?api_key=5d0c2ec7adc5a6868e38d7ed66aa070c796d91bd`;
  const response = await fetch(url, { method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({ connection_id: id, sql_query, import_as }) });

  if (!response.ok) {
    const message = await response.json();
    throw new Error(message.errors);
  }
  const data = await response.json();
  context.dispatch('fetchConnectionsList');
  return data && data.id;
}

export function requestConnector (context, { user, connector }) {
  /* Using V3 hubspot API
  https://api.hsforms.com/submissions/v3/integration/submit/:portalId/:formGuid */
  const hubspot_id = '474999';
  const form_id = '1644a76c-4876-45ae-aa85-2420cd3fb3ff';
  const CONFIG_PATH = [`submissions/v3/integration/submit/${hubspot_id}/${form_id}`];
  const data = getFormData(user, connector);

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

function getFormData (user, connector) {
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
          user.company ||
          (user.organization
            ? user.organization.display_name || user.organization.name
            : 'no_company')
      },
      {
        name: 'phone',
        value: user.phone || 'no_phone'
      },
      {
        name: 'connector_request_type',
        value: 'request'
      },
      {
        name: 'connector_request_name',
        value: connector
      }
    ],
    context: {
      pageUri: window.location.href,
      pageName: document.title
    }
  });
}

// -------------------------  BIGQUERY -------------------------

export async function createNewBQConnection (context, { name, billing_project, default_project, ...payload }) {
  if (!context.rootState.user) {
    return;
  }

  // TODO: getBaseUrl and build url
  // const baseURL = getBaseURL(context.rootState);
  // const apiKey = context.rootState.user.api_key;
  // const url = `${baseURL}/${subscriptionsEndpoint}?api_key=${apiKey}`;

  const url = 'https://connreg.carto-staging.com/api/v4/connections?api_key=5d0c2ec7adc5a6868e38d7ed66aa070c796d91bd';
  const response = await fetch(url, { method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({ name, connector: 'bigquery', parameters: { billing_project, default_project, service_account: JSON.stringify(payload) } }) });

  if (!response.ok) {
    const message = await response.json();
    throw new Error(message.errors);
  }
  const data = await response.json();
  return data;
}

export async function checkServiceAccount (context, payload) {
  // TODO: getBaseUrl and build url
  // const baseURL = getBaseURL(context.rootState);
  // const apiKey = context.rootState.user.api_key;
  // const url = `${baseURL}/${subscriptionsEndpoint}?api_key=${apiKey}`;

  const url = 'https://connreg.carto-staging.com/api/v1/connectors/bigquery/projects?api_key=5d0c2ec7adc5a6868e38d7ed66aa070c796d91bd';
  const response = await fetch(url, { method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({ service_account: payload }) });

  if (!response.ok) {
    const message = await response.json();
    throw new Error(message.errors);
  }
  const data = await response.json();
  return data;
}
