const PublicClient = require('./public.js');

class AuthenticatedClient extends PublicClient {
  getConfig (callback) {
    return this.get(['me'], callback);
  }

  getVisualization (viz, callback) {
    // TODO
  }
}

module.exports = exports = AuthenticatedClient;
