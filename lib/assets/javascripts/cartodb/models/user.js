
/**
 * the user has some base layers saved
 */
cdb.admin.UserLayers = cdb.admin.Layers.extend({
  url: function() {
    return '/api/v1/users/' +  this.user.id + '/layers';
  }
});

cdb.admin.User = cdb.core.Model.extend({

  urlRoot: '/api/v1/users',

  initialize: function() {
    if (this.get("get_layers")) {
      this.layers = new cdb.admin.UserLayers();
      this.layers.user = this;
      this._fetchLayers();
    }
  },

  _fetchLayers: function() {
    this.layers.fetch({add: true});
  }
});

