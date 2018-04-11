const $ = require('jquery');
const CoreView = require('backbone/core-view');
const BackgroundPollingHeaderTitleView = require('dashboard/views/dashboard/background-polling/background-polling-header-title/background-polling-header-title-view');
const template = require('./background-polling-header.tpl');

/**
 *  Background polling header view
 *
 *  It will contain:
 *  - Badge
 *  - Title
 *
 */

module.exports = CoreView.extend({
  className: 'BackgroundPolling-header',

  initialize: function () {
    this._initBinds();
  },

  render: function () {
    this.$el.html(template());
    this._initViews();
    this._updateBadges();
    return this;
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change importAdded importRemoved geocodingAdded geocodingRemoved', this._updateBadges);
  },

  _initViews: function () {
    const headerTitle = new BackgroundPollingHeaderTitleView({
      model: this.model
    });
    this.$el.append(headerTitle.render().el);
    this.addView(headerTitle);
  },

  _updateBadges: function () {
    const failed = this.model.getTotalFailedItems();

    if (this.$('.BackgroundPolling-headerBadgeCount').length === 0 && failed > 0) {
      const $span = $('<span>').addClass('BackgroundPolling-headerBadgeCount Badge Badge--negative CDB-Text CDB-Size-small').text(failed);
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
    const geocodingsCount = this.model.getTotalGeocodings();
    const isGeocoding = geocodingsCount > 0 && geocodingsCount === this.model.getTotalPollings();
    this.$('.js-icon').toggleClass('CDB-IconFont-marker', isGeocoding);
    this.$('.js-icon').toggleClass('CDB-IconFont-cloud', !isGeocoding);
  }

});
