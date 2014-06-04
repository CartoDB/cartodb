
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

    if (this.get('organization')) {
      this.organization = new cdb.admin.Organization(this.get('organization'));
      //TODOMU: remove this
      this.organization.users.add([
        {
          username: 'test1'
        },
        {
          username: 'test2'
        },
        {
          username: 'test3'
        }
      ])
    }

  },

  _fetchLayers: function() {
    this.layers.fetch({add: true});
  }
});

