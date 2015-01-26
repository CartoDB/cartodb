var cdb = require('cartodb.js');
var PermissionView = require('./permission_view');
var pluralizeString = require('new_common/view_helpers/pluralize_string');

/**
 * Share view, to manage organization users' permissions to the parent subject.
 */
module.exports = cdb.core.View.extend({
  
  className: 'Dialog-body Dialog-body--expanded',

  events: {
    'click .js-save' : '_onClickSave',
    'click .js-back' : '_onClickBack'
  },

  initialize: function(args) {
    this._permissions = args.permissions;
    
    this._template = cdb.templates.getTemplate('new_dashboard/dialogs/change_privacy/share_view_template');
  },

  render: function() {
    this.clearSubViews();
    
    var usersCount = this._permissions.usersCount();

    this.$el.html(
      this._template({
        usersCount: usersCount,
        colleagueOrColleaguesStr: pluralizeString('colleage', usersCount)
      })
    );
    
    this._renderPermissionViews();
    
    return this;
  },

  _renderPermissionViews: function() {
    this._permissions.each(function(m) {
      var v = new PermissionView({
        model: m
      });
      this.$('.js-permissions').append(v.render().el);
      this.addView(v);
    }, this);
  },

  _onClickBack: function(ev) {
    this.killEvent(ev);
    this.trigger('click:back');
  },

  _onClickSave: function() {
    this.killEvent(ev);
    this.trigger('click:save');
  }
});
