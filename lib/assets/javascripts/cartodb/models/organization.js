/**
 * this model contains information about the organization for
 * the current user and the users who are inside the organizacion.
 *
 * Attributes:
 *
 * - users: collection with user instances whithin the organization (see cdb.admin.Organization.Users
 *
 *
 */

cdb.admin.Organization = cdb.core.Model.extend({

  url: '/api/v1/org/',

  initialize: function(attrs, opts) {
    this.owner = new cdb.admin.User(this.get('owner'));
    this.users = new cdb.admin.Organization.Users(
      null, {
        organizationId: this.id,
        currentUserId: opts && opts.currentUserId
      }
    );

    this.display_email = ((typeof attrs) != 'undefined' && attrs != null && (typeof attrs.admin_email) != 'undefined') && attrs.admin_email != null && (attrs.admin_email == '' ? this.owner.email : attrs.admin_email);

    this.users.reset(this.get('users'));
    // make sure all the users have a reference to this organization
    var self = this;
    this.users.each(function (u) {
      u.organization = self;
    });
  },

  fetch: function() {
    throw new Error("organization should not be fetch, should be static");
  },

  containsUser: function(user) {
    return !!this.users.find(function(u) {
      return u.id === user.id;
    })
  },

  viewUrl: function() {
    return new cdb.common.OrganizationUrl({
      base_url: this.get('base_url')
    })
  }

});

// helper to manage organization users
cdb.admin.Organization.Users = Backbone.Collection.extend({

  model: cdb.admin.User,

  url: function() {
    if (!this.organizationId) {
      throw new Error('Organization id is needed for fetching organization users');
    }
    var u = '/api/v1/organization/' + this.organizationId + '/users';
    u += "?" + this._createUrlParameters();
    return u;
  },

  initialize: function(users, opts) {
    this.elder('initialize');
    this.organizationId = opts.organizationId;
    this.currentUserId = opts.currentUserId;
    this.params = {
      per_page: 50,
      page: 1,
      order: 'username',
      q: ''
    }

    // Let's add abort behaviour
    this.sync = Backbone.syncAbort;
  },

  comparator: function(mdl) {
    return mdl.get('username');
  },

  _createUrlParameters: function() {
    return _.compact(_(this.params).map(
      function(v, k) {
        return k + "=" + encodeURIComponent(v)
      }
    )).join('&');
  },

  parse: function(r) {
    var self = this;

    var users = _.map(r.users, function(user) {
      if (user.id !== self.currentUserId) {
        return user;
      } else {
        r.total_user_entries--;
        r.total_entries--;
      }
    });

    this.total_user_entries = r.total_user_entries;
    this.total_entries = r.total_entries;

    return _.compact(users);
  },

  fetch: function(opts) {
    this.trigger('loading');
    this.elder('fetch');
  },

  // Helper functions

  setParameters: function(data) {
    var self = this;
    _.each(data, function(val, key) {
      self.params[key] = val;
    });
    return this;
  },

  getParameter: function(key) {
    return this.params[key]
  },

  getTotalUsers: function() {
    return this.total_user_entries
  },

  getSearch: function() {
    return this.getParameter('q')
  }

});
