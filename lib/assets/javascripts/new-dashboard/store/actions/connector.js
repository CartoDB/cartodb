import 'whatwg-fetch';

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
