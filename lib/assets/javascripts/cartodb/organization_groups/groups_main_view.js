var _ = require('underscore');
var cdb = require('cartodb.js');
var GroupHeaderView = require('./group_header_view');
var GroupsIndexView = require('./groups_index_view');
var CreateGroupView = require('./create_group_view');
var EditGroupView = require('./edit_group_view');

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
    this.options.router.model.bind('change:view', this.render, this);
    this.add_related_model(this.options.router.model);
  },

  _renderContent: function() {
    var views = [];
    var opts = _.omit(this.options, 'el');
    var routerModel = this.options.router.model;

    var viewName = routerModel.get('view');
    switch (viewName) {
      case 'groupsIndex':
        views = [
          new GroupsIndexView(opts)
        ];
        break;
      case 'createGroup':
        views = [
          this._createGroupHeader(),
          new CreateGroupView(opts)
        ];
        break;
      case 'editGroup':
        var groupId = this.options.router.model.get('groupId');
        var group = this.options.groups.fetchGroup(groupId);
        views = [
          this._createGroupHeader(group),
          new EditGroupView(_.extend(opts, {
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
    if (!group && !this._groupNullObj) {
      this._groupNullObj = new cdb.core.Model({
        display_name: 'Create new group'
      });
    }
    return new GroupHeaderView({
      router: this.options.router,
      group: group || this._groupNullObj
    });
  },

  _onClick: function() {
    cdb.god.trigger('closeDialogs');
  }
});
