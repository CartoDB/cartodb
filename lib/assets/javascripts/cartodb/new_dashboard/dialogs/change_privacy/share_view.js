var cdb = require('cartodb.js');

/**
 * Share listing
 */
module.exports = cdb.core.View.extend({

  events: {
    'click .js-save' : '_onClickSave',
    'click .js-back' : '_onClickBack'
  },

  initialize: function(args) {
    this.vis = args.vis; // of model cdb.admin.Visualization
    this.organization = args.organization;
    this.template = cdb.templates.getTemplate('new_dashboard/dialogs/change_privacy/share_view_template');
  },

  render: function() {
    var org = this.organization;
    var orgUsersCount = org.users.length;

    this.$el.html(
      this.template({
        orgUsersCount: orgUsersCount,
        colleagueOrColleaguesStr: 'colleagues'
      })
    );
    
    return this;
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
