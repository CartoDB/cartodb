import store from 'new-dashboard/store';
import MetricsTypes from 'builder/components/metrics/metrics-types';

export { MetricsTypes };
export function sendMetric (eventName, eventProperties) {
  const baseURL = store.state.config.base_url;
  const requestURL = `${baseURL}/api/v3/metrics`;
  const requestData = getJSONMetricsData(eventName, eventProperties);

  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestData)
  };

  return fetch(requestURL, requestOptions);
}

function getJSONMetricsData (name, properties) {
  return {
    name,
    properties: {
      ...properties,
      user_id: store.state.user.id
    }
  };
}
