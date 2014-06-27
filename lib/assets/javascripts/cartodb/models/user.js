
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

  defaults: {
    avatar_url: '',
    username:   ''
  },

  initialize: function() {
    if (this.get("get_layers")) {
      this.layers = new cdb.admin.UserLayers();
      this.layers.user = this;
      this._fetchLayers();
    }

    if (this.get('organization')) {
      this.organization = new cdb.admin.Organization(this.get('organization'));
    }

  },

  isInsideOrg: function() {
    if (this.organization) {
      return this.organization.users.length > 0 || this.isOrgAdmin();
    }
    return false;
  },

  isOrgAdmin: function() {
    if (this.organization) {
      return this.organization.owner.get('id') === this.get('id')
    }
    return false;
  },

  renderData: function(currentUser) {
    var name = this.get('username');
    if (currentUser && currentUser.id === this.id) {
      name = _t('You');
    }
    return {
      username: name,
      avatar_url: this.get('avatar_url')
    }

  },

  _fetchLayers: function() {
    this.layers.fetch({ add: true });
  }

});

