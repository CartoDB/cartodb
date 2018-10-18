var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var GroupView = require('./group_view');
var ViewFactory = require('../../common/view_factory');

module.exports = cdb.core.View.extend({

  initialize: function () {
    _.each(['groups'], function (name) {
      if (_.isUndefined(this.options[name])) throw new Error(name + ' is required');
    }, this);
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._renderGroupsView();
    return this;
  },

  _renderGroupsView: function () {
    var view = ViewFactory.createByList(this._createGroupViews(), {
      tagName: 'ul',
      className: 'OrganizationList'
    });
    this.addView(view);
    this.$el.append(view.render().el);
  },

  _createGroupViews: function () {
    return this.options.groups.map(function (m) {
      return new GroupView({
        model: m,
        url: this.options.newGroupUrl(m)
      });
    }, this);
  }

});
