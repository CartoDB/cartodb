const CoreView = require('backbone/core-view');
const GroupUserView = require('dashboard/views/organization/groups-admin/group-user/group-user-view');

const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'users'
];

/**
 * View of group users.
 */
module.exports = CoreView.extend({
  tagName: 'ul',
  className: 'OrganizationList',

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    // init binds
    this.listenTo(this._users, 'reset add remove', this.render);
  },

  render: function () {
    this.clearSubViews();
    this._renderUsers();
    return this;
  },

  _renderUsers: function () {
    this._users.each(this._createUserView, this);
  },

  _createUserView: function (user) {
    const view = new GroupUserView({
      model: user
    });

    this.addView(view);
    this.$el.append(view.render().el);
  }

});
