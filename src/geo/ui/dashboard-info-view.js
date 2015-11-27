var View = require('cdb/core/view');
var template = require('./dashboard-info-view.tpl');
var moment = require('moment');

var DashboardInfoView = View.extend({

  className: 'Dashboard-info is-active',

  events: {
    'click .js-toggle-view-link': "_toggleView"
  },

  render: function() {
    this.$el.html(
      template({
        title: this.model.get('title'),
        description: this.model.get('description'),
        updatedAt: moment('2015-11-23T19:17:29+00:00').fromNow(),
        userName: this.model.get('userName'),
        userAvatarURL: this.model.get('userAvatarURL')
      })
    );

    return this;
  },

  _toggleView: function() {
    this.$el.toggleClass('is-active');
  }
});

module.exports = DashboardInfoView;