var cdb = require('cartodb.js');
var template = require('./dashboard-menu-view.tpl');
var moment = require('moment');

var DashboardMenuView = cdb.core.View.extend({
  className: 'CDB-Dashboard-menu',

  events: {
    'click .js-toggle-view': '_toogleView'
  },

  render: function () {
    var shortTitle = this.model.get('title');
    if (shortTitle && shortTitle.length > 120) {
      shortTitle = shortTitle.slice(0, 110) + '...' + ' %23 map';
    }

    this.$el.html(
      template({
        showLogo: this.model.get('showLogo'),
        title: this.model.get('title'),
        description: this.model.get('description'),
        updatedAt: moment(this.model.get('updatedAt')).fromNow(),
        userName: this.model.get('userName'),
        url: window.location.href,
        urlWithoutParams: window.location.protocol + '//' + window.location.host + window.location.pathname,
        inIframe: (window.location !== window.parent.location),
        shortTitle: shortTitle,
        userAvatarURL: this.model.get('userAvatarURL'),
        userProfileURL: this.model.get('userProfileURL')
      })
    );

    return this;
  },

  _toogleView: function () {
    this.$el.toggleClass('is-active');
  }
});

module.exports = DashboardMenuView;
