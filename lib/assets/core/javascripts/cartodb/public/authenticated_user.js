
/**
 *  Model for authenticated user endpoint
 *
 */

cdb.open.AuthenticatedUser = cdb.core.Model.extend({

  defaults: {
    username: '',
    avatar_url: ''
  },

  url: function() {
    var host = this.get('host') ? this.get('host') : this._getCurrentHost();
    return "//" + host + "/api/v1/get_authenticated_users";
  },

  _getCurrentHost: function() {
    return window.location.host;
  }
});
