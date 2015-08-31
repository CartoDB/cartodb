var _ = require('underscore');
var cdb = require('cartodb.js');
var GroupHeaderView = require('./group_header_view');
var GroupsIndexView = require('./groups_index_view');
var CreateGroupView = require('./create_group_view');
var ShowGroupView = require('./show_group_view');
var EditGroupView = require('./edit_group_view');
var navigateThroughRouter = require('../common/view_helpers/navigate_through_router');

/**
 * Controller view, managing view state of the groups entry point
 */
module.exports = cdb.core.View.extend({

  events: {
    'click': '_onClick'
  },

  initialize: function() {
    _.each(['user', 'groups', 'router'], function(name) {
      if (!this.options[name]) throw new Error(name + ' is required');
    }, this);

    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    var $content = this.$('.js-content');
    var els = this._renderContent();
    $content.html('').append(els);
    return this;
  },

  _initBinds: function() {
    this.options.router.model.bind('change:viewName', this.render, this);
    this.add_related_model(this.options.router.model);
  },

  _renderContent: function() {
    var views = [];
    var opts = _.omit(this.options, 'el');
    var routerModel = this.options.router.model;
    var groupId = routerModel.get('groupId');
    var group = this.options.groups.newGroupById(groupId);

    var viewName = routerModel.get('viewName');
    switch (viewName) {
      case 'groupsIndex':
        views = [
          new GroupsIndexView(opts)
        ];
        break;
      case 'createGroup':
        views = [
          this._createGroupHeader(group),
          new CreateGroupView(_.extend(opts, {
            group: group
          }))
        ];
        break;
      case 'editGroup':
        views = [
          this._createGroupHeader(group),
          new EditGroupView(_.extend(opts, {
            group: group
          }))
        ];
        break;
      case 'showGroup':
        views = [
          this._createGroupHeader(group),
          new ShowGroupView(_.extend(opts, {
            group: group
          }))
        ];
        break;
      default:
        cdb.log.debug('no view for ' + viewName);
        return '';
    }

    return _.map(views, function(view) {
      this.addView(view);
      return view.render().el;
    }, this);
  },

  _createGroupHeader: function(group) {
    return new GroupHeaderView({
      router: this.options.router,
      group: group
    });
  },

  _onClick: function(e) {
    if (this._isEventTriggeredOutsideOf(e, '.Dialog')) {
      // Clicks outside of any dialog "body" will fire a closeDialogs event
      cdb.god.trigger('closeDialogs');
    }

    if (!this._isEventTriggeredOutsideOf(e, 'a')) {
      navigateThroughRouter.apply(this, arguments);
    }
  },

  _isEventTriggeredOutsideOf: function(ev, selector) {
    return $(ev.target).closest(selector).length === 0;
  }
});
