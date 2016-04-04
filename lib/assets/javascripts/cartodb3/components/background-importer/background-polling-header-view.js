var cdb = require('cartodb.js-v3');
var $ = require('jquery');
var BackgroundPollingHeaderTitleView = require('./background-polling-header-title-view');
var Template = require('background-polling-header.tpl');

/**
 *  Background polling header view
 *
 *  It will contain:
 *  - Badge
 *  - Title
 *
 */

module.exports = cdb.core.View.extend({

  className: 'BackgroundPolling-header',

  initialize: function () {
    this._initBinds();
  },

  render: function () {
    this.$el.html(Template);
    this._initViews();
    this._updateBadges();
    return this;
  },

  _initBinds: function () {
    this.model.bind('change importAdded importRemoved geocodingAdded geocodingRemoved', this._updateBadges, this);
  },

  _initViews: function () {
    var headerTitle = new BackgroundPollingHeaderTitleView({
      model: this.model
    });
    this.$el.append(headerTitle.render().el);
    this.addView(headerTitle);
  },

  _updateBadges: function () {
    var failed = this.model.getTotalFailedItems();

    if (this.$('.BackgroundPolling-headerBadgeCount').length === 0 && failed > 0) {
      var $span = $('<span>').addClass('BackgroundPolling-headerBadgeCount Badge Badge--negative').text(failed);
      this.$('.BackgroundPolling-headerBadge')
        .append($span)
        .addClass('has-failures');
    } else if (this.$('.BackgroundPolling-headerBadgeCount').length > 0 && failed > 0) {
      this.$('.BackgroundPolling-headerBadgeCount').text(failed);
    } else if (failed === 0) {
      this.$('.BackgroundPolling-headerBadgeCount').remove();
      this.$('.BackgroundPolling-headerBadge').removeClass('has-failures');
    }

    // Show geocoding icon if only geocoding
    var geocodingsCount = this.model.getTotalGeocodings();
    var isGeocoding = geocodingsCount > 0 && geocodingsCount === this.model.getTotalPollings();
    this.$('.js-icon').toggleClass('CDB-IconFont-marker', isGeocoding);
    this.$('.js-icon').toggleClass('CDB-IconFont-cloud', !isGeocoding);
  }

});
