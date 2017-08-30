const nock = require('nock');
const Carto = require('../../../../../../javascripts/cartodb3/carto-node/index.js');

const BASE_URL = 'https://matallo.carto.com';

window.StaticConfig = {
  baseUrl: BASE_URL
};

describe('AuthenticatedClient', () => {
  let authenticatedClient;

  beforeEach(() => {
    authenticatedClient = new Carto.AuthenticatedClient();
  });

  afterEach(() => nock.cleanAll());

  describe('.getConfig', () => {
    it('should get user config', done => {
      const expectedResponse = {
        config: {}
      };

      nock(BASE_URL)
        .get('/api/v3/me')
        .reply(200, expectedResponse);

      authenticatedClient.getConfig((err, response, data) => {
        expect(err).toBeNull();
        expect(data).not.toBeNull();
        expect(data).toEqual(expectedResponse);

        done();
      });
    });

    it('should return error if the request fails', done => {
      const expectedResponse = 'Error getting the config';

      nock(BASE_URL)
        .get('/api/v3/me')
        .replyWithError(expectedResponse);

      authenticatedClient.getConfig((err, response, data) => {
        expect(data).toBeNull();
        expect(err).not.toBeNull();
        expect(err.message).toEqual(expectedResponse);

        done();
      });
    });
  });
});
