const CoreView = require('backbone/core-view');
const Utils = require('builder/helpers/utils');
const pluralize = require('dashboard/helpers/pluralize');
const template = require('./organization-user.tpl');

module.exports = CoreView.extend({

  className: 'OrganizationList-user',

  tagName: 'li',

  render: function () {
    this.$el.html(
      template({
        totalPer: this.options.totalPer,
        userPer: this.options.userPer,
        usedPer: this.options.usedPer,
        isOwner: this.options.isOwner,
        isAdmin: this.options.isAdmin,
        isViewer: this.options.isViewer,
        editable: this.options.editable,
        url: this.options.url,
        sizeOnBytes: Utils.readablizeBytes(this.model.get('db_size_in_bytes')),
        quotaInBytes: Utils.readablizeBytes(this.model.get('quota_in_bytes')),
        avatarUrl: this.model.get('avatar_url'),
        username: this.model.get('username'),
        user_email: this.model.get('email'),
        table_count: pluralize.prefixWithCount('Dataset', 'Datasets', this.model.get('table_count')),
        maps_count: pluralize.prefixWithCount('Map', 'Maps', this.model.get('all_visualization_count'))
      })
    );

    return this;
  }
});
