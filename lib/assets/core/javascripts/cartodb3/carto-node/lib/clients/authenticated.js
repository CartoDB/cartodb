const PublicClient = require('./public.js');

class AuthenticatedClient extends PublicClient {
  getConfig (callback) {
    return this.get(['me'], callback);
  }
}

module.exports = exports = AuthenticatedClient;
