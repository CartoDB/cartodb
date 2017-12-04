const CartoNode = require('../../../../../../javascripts/carto-node/index');
const BASE_URL = 'https://matallo.carto.com';

window.StaticConfig = {
  baseUrl: BASE_URL
};

describe('AuthenticatedClient', () => {
  let authenticatedClient;

  beforeEach(() => {
    jasmine.Ajax.install();

    authenticatedClient = new CartoNode.AuthenticatedClient();
  });

  afterEach(() => {
    jasmine.Ajax.uninstall();
  });

  describe('.getConfig', () => {
    it('should get user config', done => {
      const expectedResponse = {
        config: {}
      };

      jasmine.Ajax.stubRequest(new RegExp(/api\/v3\/me/))
        .andReturn({
          status: 200,
          contentType: 'application/json; charset=utf-8',
          responseText: JSON.stringify(expectedResponse)
        });

      authenticatedClient.getConfig((err, response, data) => {
        expect(err).toBeNull();
        expect(data).not.toBeNull();
        expect(data).toEqual(expectedResponse);

        done();
      });
    });

    it('should return error if the request fails', done => {
      jasmine.Ajax.stubRequest(new RegExp(/api\/v3\/me/))
        .andError();

      authenticatedClient.getConfig((err, response, data) => {
        expect(data).toBeNull();
        expect(err).not.toBeNull();
        expect(err.message).toEqual('Failed to fetch');

        done();
      });
    });
  });
});
