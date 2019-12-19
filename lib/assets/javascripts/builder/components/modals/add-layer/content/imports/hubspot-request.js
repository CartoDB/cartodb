var $ = require('jquery');

/* Util to request connector via hubspot */

module.exports = {
  requestConnectorHubspot: function (data, callback, error) {
    /* Using V3 hubspot API
    https://api.hsforms.com/submissions/v3/integration/submit/:portalId/:formGuid */
    var hubspot_id = '474999';
    var form_id = '1644a76c-4876-45ae-aa85-2420cd3fb3ff';
    var url = `https://api.hsforms.com/submissions/v3/integration/submit/${hubspot_id}/${form_id}`;

    return $.ajax({
      type: 'POST',
      url: url,
      data: JSON.stringify(data),
      dataType: 'json',
      contentType: 'application/json',
      success: callback,
      error: error
    });
  },

  getFormData: function (userModel, connectorName, requestType) {
    return {
      'fields': [
        {
          'name': 'email',
          'value': userModel.get('email')
        },
        {
          'name': 'firstname',
          'value': userModel.get('name') || 'no_firstname'
        },
        {
          'name': 'lastname',
          'value': userModel.get('last_name') || 'no_last_name'
        },
        {
          'name': 'jobtitle',
          'value': userModel.get('job_role') || 'no_jobtitle'
        },
        {
          'name': 'company',
          'value': userModel.get('company') || 'no_company'
        },
        {
          'name': 'phone',
          'value': userModel.get('phone') || 'no_phone'
        },
        {
          'name': 'connector_request_type',
          'value': requestType || 'request'
        },
        {
          'name': 'connector_request_name',
          'value': connectorName
        }
      ],
      'context': {
        'pageUri': window.location.href,
        'pageName': window.location.href.includes('builder') ? 'Layer | CARTO' : document.title
      }
    };
  }
};
