var $ = require('jquery');
var _ = require('underscore');
var UsersGroup = require('./users-group-collection');

// This module fetch the user for every group present
// in the ACL permission collection. The vizjson doesn't
// provide and we need it for the sharing stats in the header.

module.exports = {
  track: function (opts) {
    this.acl = opts.acl;
    this.configModel = opts.configModel;
    this.userModel = opts.userModel;

    this.acl.on('reset', this.fetchUsers, this);
    this.fetchUsers();
  },

  fetchUsers: function () {
    var self = this;
    var promises = [];

    promises = _.map(this.acl.where({type: 'group'}), function (group) {
      var entity = group.get('entity');
      var deferred = new $.Deferred();

      if (!entity.users || entity.users.length === 0) {
        entity.users = new UsersGroup([], {
          group: entity,
          configModel: self.configModel,
          organization: self.userModel.getOrganization()
        });

        entity.users.fetch({
          success: function () {
            deferred.resolve();
          }
        });
      } else {
        deferred.resolve();
      }

      return deferred.promise();
    }, this);

    $.when.apply($, promises).done(function () {
      self.acl.trigger('fetch');
    });
  }
};
