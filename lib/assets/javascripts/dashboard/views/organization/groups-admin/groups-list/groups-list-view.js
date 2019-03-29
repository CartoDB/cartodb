const CoreView = require('backbone/core-view');
const GroupView = require('dashboard/views/organization/groups-admin/group-view/group-view');
const ViewFactory = require('builder/components/view-factory');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'groups',
  'newGroupUrl'
];

module.exports = CoreView.extend({
  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._renderGroupsView();
    return this;
  },

  _renderGroupsView: function () {
    const view = ViewFactory.createListView(this._createGroupViews(), {
      tagName: 'ul',
      className: 'OrganizationList'
    });
    this.addView(view);
    this.$el.append(view.render().el);
  },

  _createGroupViews: function () {
    return this._groups.map(model => {
      return () => new GroupView({
        model,
        url: this._newGroupUrl(model)
      });
    });
  }

});
