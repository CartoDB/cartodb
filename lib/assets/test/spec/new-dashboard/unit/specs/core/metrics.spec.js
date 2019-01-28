import * as Metrics from 'new-dashboard/core/metrics';
import store from 'new-dashboard/store';

describe('Internal Metrics Tracker', () => {
  describe('sendMetric', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    it('should return call fetch with proper parameters', () => {
      const eventName = 'fake_event';
      const eventProperties = { page: 'dashboard' };
      const baseURL = 'https://user.carto.com';
      store.state.config.base_url = baseURL;

      Metrics.sendMetric(eventName, eventProperties);

      const requestURL = `${baseURL}/api/v3/metrics`;
      const requestProperties = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: eventName,
          properties: eventProperties
        })
      };

      expect(global.fetch).toHaveBeenCalledWith(
        requestURL,
        requestProperties
      );
    });
  });
});
