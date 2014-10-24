
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
    return "//" + window.location.host  + "/api/v1/get_authenticated_users"
  }

});