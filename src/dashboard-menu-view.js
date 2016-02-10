var cdb = require('cartodb.js');
var template = require('./dashboard-menu-view.tpl');
var moment = require('moment');

var DashboardMenuView = cdb.core.View.extend({
  className: 'CDB-Dashboard-menu',

  events: {
    'click .js-toggle-view': '_toogleView',
    'click .js-stop-propagation': '_stopPropagation'
  },

  render: function () {
    this.$el.html(
      template({
        title: this.model.get('title'),
        description: this.model.get('description'),
        updatedAt: moment(this.model.get('updatedAt')).fromNow(),
        userName: this.model.get('userName'),
        userAvatarURL: this.model.get('userAvatarURL')
      })
    );

    return this;
  },

  _toogleView: function () {
    this.$el.toggleClass('is-active');
  },
  _stopPropagation: function (event) {
    event.stopPropagation();
  }

});

module.exports = DashboardMenuView;
