import 'whatwg-fetch';
import { getBaseURL } from 'new-dashboard/utils/base-url';

/*
  DEV CREDENTIALS:
  https://connreg.carto-staging.com/api/v4
  c96add2d9d67ec784ebec742e2ea4cecdedfdf53
*/

async function __createNewConnection (context, payload) {
  const baseURL = getBaseURL(context.rootState);
  const apiKey = context.rootState.user.api_key;
  const url = `${baseURL}/connections?api_key=${apiKey}`;

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

  const baseURL = getBaseURL(context.rootState);
  const apiKey = context.rootState.user.api_key;
  const url = `${baseURL}/connections?api_key=${apiKey}`;

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

  const baseURL = getBaseURL(context.rootState);
  const apiKey = context.rootState.user.api_key;
  const url = `${baseURL}/connections/${id}?api_key=${apiKey}`;

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

  const baseURL = getBaseURL(context.rootState);
  const apiKey = context.rootState.user.api_key;
  const url = `${baseURL}/connections/${id}?api_key=${apiKey}`;

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

  const baseURL = getBaseURL(context.rootState);
  const apiKey = context.rootState.user.api_key;
  const url = `${baseURL}/connections/check_oauth/${connector}?api_key=${apiKey}`;

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

  const baseURL = getBaseURL(context.rootState, 'v1');
  const apiKey = context.rootState.user.api_key;
  const url = `${baseURL}/imports/service/${connector}/list_files?api_key=${apiKey}`;

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

  const baseURL = getBaseURL(context.rootState);
  const apiKey = context.rootState.user.api_key;
  const url = `${baseURL}/connections/${id}?api_key=${apiKey}`;

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

  const baseURL = getBaseURL(context.rootState, 'v1');
  const apiKey = context.rootState.user.api_key;
  const url = `${baseURL}/connectors/${connector}/dryrun?api_key=${apiKey}`;
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

  const baseURL = getBaseURL(context.rootState);
  const apiKey = context.rootState.user.api_key;
  const url = `${baseURL}/connections?api_key=${apiKey}`;

  const response = await fetch(url, { method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({ name, connector: 'bigquery', parameters: { billing_project, default_project, service_account: JSON.stringify(payload) } }) });

  if (!response.ok) {
    let data;
    try {
      data = await response.json();
    } catch (e) {
      // Do nothing
    }
    throw new Error(JSON.stringify({
      status: response.status,
      message: data ? data.errors : null
    }));
  }
  const data = await response.json();
  return data;
}

export async function createNewBQConnectionThroughOAuth (context) {
  if (!context.rootState.user) {
    return;
  }

  const baseURL = getBaseURL(context.rootState);
  const apiKey = context.rootState.user.api_key;
  const url = `${baseURL}/connections?api_key=${apiKey}`;

  const response = await fetch(url, { method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({ connector: 'bigquery' })
  });

  if (!response.ok) {
    let data;
    try {
      data = await response.json();
    } catch (e) {
      // Do nothing
    }
    throw new Error(JSON.stringify({
      status: response.status,
      message: data ? data.errors : null
    }));
  }
  const data = await response.json();
  return data;
}

export async function checkBQConnectionThroughOAuth (context) {
  if (!context.rootState.user) {
    return;
  }

  const baseURL = getBaseURL(context.rootState);
  const apiKey = context.rootState.user.api_key;
  const url = `${baseURL}/connections/check_oauth/bigquery?api_key=${apiKey}`;

  const response = await fetch(url);

  if (!response.ok) {
    let data;
    try {
      data = await response.json();
    } catch (e) {
      // Do nothing
    }
    throw new Error(JSON.stringify({
      status: response.status,
      message: data ? data.errors : null
    }));
  }
  const data = await response.json();
  return data;
}

export async function editBQConnection (context, { bqConnectionId, name, billing_project, default_project, ...payload }) {
  if (!context.rootState.user) {
    return;
  }

  const baseURL = getBaseURL(context.rootState);
  const apiKey = context.rootState.user.api_key;
  const url = `${baseURL}/connections/${bqConnectionId}?api_key=${apiKey}`;

  const response = await fetch(url, { method: 'PUT',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({ name, connector: 'bigquery', parameters: { billing_project, default_project, service_account: JSON.stringify(payload) } }) });

  if (!response.ok) {
    let data;
    try {
      data = await response.json();
    } catch (e) {
      // Do nothing
    }
    throw new Error(JSON.stringify({
      status: response.status,
      message: data ? data.errors : null
    }));
  }
  return { id: bqConnectionId };
}

export async function updateBQConnectionBillingProject (context, { id: bqConnectionId, billing_project }) {
  if (!context.rootState.user) {
    return;
  }

  const baseURL = getBaseURL(context.rootState);
  const apiKey = context.rootState.user.api_key;
  const url = `${baseURL}/connections/${bqConnectionId}?api_key=${apiKey}`;

  const response = await fetch(url, { method: 'PUT',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({ parameters: { billing_project } }) });

  if (!response.ok) {
    let data;
    try {
      data = await response.json();
    } catch (e) {
      // Do nothing
    }
    throw new Error(JSON.stringify({
      status: response.status,
      message: data ? data.errors : null
    }));
  }
  return { id: bqConnectionId };
}

export async function checkServiceAccount (context, payload) {
  const baseURL = getBaseURL(context.rootState, 'v1');
  const apiKey = context.rootState.user.api_key;
  const url = `${baseURL}/connectors/bigquery/projects?api_key=${apiKey}`;

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

export async function fetchBQProjectsList (context, connectionId) {
  if (!context.rootState.user) {
    return;
  }
  context.commit('setLoadingProjects');

  const baseURL = getBaseURL(context.rootState);
  const apiKey = context.rootState.user.api_key;
  const url = `${baseURL}/connections/${connectionId}/projects?api_key=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    context.commit('setProjects', []);
    throw new Error(JSON.stringify({
      status: response.status,
      message: (await response.json()).errors
    }));
  }
  const data = await response.json();
  context.commit('setProjects', data || []);
  return data;
}

export async function fetchBQDatasetsList (context, { connectionId, projectId }) {
  if (!context.rootState.user) {
    return;
  }
  context.commit('setLoadingDatasets');

  const baseURL = getBaseURL(context.rootState);
  const apiKey = context.rootState.user.api_key;
  const url = `${baseURL}/bigquery/datasets?api_key=${apiKey}&connection_id=${connectionId}&project_id=${projectId}`;
  const response = await fetch(url);
  if (!response.ok) {
    context.commit('setBQDatasets', []);
    throw new Error(JSON.stringify({
      status: response.status,
      message: (await response.json()).errors
    }));
  }
  const data = await response.json();
  context.commit('setBQDatasets', data || []);
}
