var cdb = require('cartodb.js-v3');
var moment = require('moment-v3');
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
    this.template = cdb.templates.getTemplate('dashboard/views/deep_insights_item');
  },

  render: function() {
    this.clearSubViews();
    var url = this.model.deepInsightsUrl(this.user);

    this.$el.html(
      this.template({
        url: url,
        title: this.model.get('title'),
        description: this.model.get('description'),
        timeDiff: moment(this.model.get('updated_at')).fromNow(),
      })
    );

    return this;
  }

});
