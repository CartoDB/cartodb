import * as Metrics from 'new-dashboard/core/metrics';
import store from 'new-dashboard/store';

describe('Internal Metrics Tracker', () => {
  describe('sendMetric', () => {
    let previousState;

    beforeEach(() => {
      global.fetch = jest.fn();
      previousState = {
        ...store.state,
        config: { ...store.state.config },
        user: { ...store.state.user }
      };
    });

    afterEach(() => {
      store.replaceState(previousState);
    });

    it('should return call fetch with proper parameters', () => {
      const eventName = 'fake_event';
      const eventProperties = { page: 'dashboard', user_id: 'fake_id' };
      const baseURL = 'https://user.carto.com';
      store.state.config.base_url = baseURL;
      store.state.user = { id: 'fake_id' };

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
