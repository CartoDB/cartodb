var cdb = require('cartodb.js');
var moment = require('moment');
var navigateThroughRouter = require('../../common/view_helpers/navigate_through_router');
var Utils = require('cdb.Utils');
cdb.admin = require('cdb.admin');

/**
 * Represents a map card on dashboard.
 */
module.exports = cdb.core.View.extend({

  className: 'MapsList-item',
  tagName: 'li',

  initialize: function() {
    this.router = this.options.router;
    this.user = this.options.user;
    this.template = cdb.templates.getTemplate('dashboard/views/dashboards_item');
  },

  render: function() {
    this.clearSubViews();
    var url = this.model.dashboardURL();

    this.$el.html(
      this.template({
        url: url,
        name: this.model.get('name'),
        description: this.model.get('description'),
        timeDiff: moment(this.model.get('updated_at')).fromNow(),
      })
    );

    return this;
  }

});
