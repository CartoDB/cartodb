var _ = require('underscore');
var cdb = require('cartodb.js');
var GroupsIndexView = require('./groups_index_view');
var CreateGroupView = require('./create_group_view');

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
    this.$('.js-content').html(this._renderContent());
    return this;
  },
  
  _initBinds: function() {
    this.options.router.model.bind('change:view', this.render, this);
    this.add_related_model(this.options.router.model);
  },

  _renderContent: function() {
    var view;
    var opts = _.omit(this.options, 'el');

    switch (this.options.router.model.get('view')) {
      case 'groupsIndex':
        view = new GroupsIndexView(opts);
        break;
      case 'createGroup':
        view = new CreateGroupView(opts);
        break;
    }

    return view.render().$el;
  },

  _onClick: function() {
    cdb.god.trigger('closeDialogs');
  }
});
