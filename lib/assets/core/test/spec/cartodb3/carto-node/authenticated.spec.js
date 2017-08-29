const nock = require('nock');

const Carto = require('../../../../../javascripts/cartodb3/carto-node/index');
const authenticatedClient = new Carto.AuthenticatedClient();

const BASE_URL = 'https://matallo.carto.com/api/v3';

describe('AuthenticatedClient', () => {
  afterEach(() => nock.cleanAll());

  describe('.getConfig', () => {
    it('should get user config', done => {
      const expectedResponse = {};

      nock(BASE_URL)
        .get('/me')
        .reply(200, expectedResponse);

      authenticatedClient.getConfig((err, response, data) => {
        expect(data).toBe(expectedResponse);

        done();
      });
    });

    it('should return error if the request fails', done => {
      const expectedResponse = 'Failed to fetch';

      nock(BASE_URL)
        .get('/me')
        .replyWithError(expectedResponse);

      authenticatedClient.getConfig((err, response, data) => {
        expect(err).toThrowError(expectedResponse)

        done();
      });
    });
  });
});
