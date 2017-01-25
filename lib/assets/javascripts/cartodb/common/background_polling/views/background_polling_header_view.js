var cdb = require('cartodb.js-v3');
var BackgroundPollingHeaderTitleView = require('./background_polling_header_title_view');

/**
 *  Background polling header view
 *
 *  It will contain:
 *  - Badge
 *  - Title
 *
 */

module.exports = cdb.core.View.extend({

  className: "BackgroundPolling-header",

  initialize: function() {
    this.template = cdb.templates.getTemplate('common/background_polling/views/background_polling_header');
    this._initBinds();
  },

  render: function() {
    this.$el.html(this.template());
    this._initViews();
    this._updateBadges();
    return this;
  },

  _initBinds: function() {
    this.model.bind('change importAdded importRemoved geocodingAdded geocodingRemoved', this._updateBadges, this);
  },

  _initViews: function() {
    var headerTitle = new BackgroundPollingHeaderTitleView({
      model: this.model
    });
    this.$el.append(headerTitle.render().el);
    this.addView(headerTitle);
  },

  _updateBadges: function() {
    var failed = this.model.getTotalFailedItems();

    if (this.$('.BackgroundPolling-headerBadgeCount').length === 0 && failed > 0) {
      var $span = $('<span>').addClass("BackgroundPolling-headerBadgeCount Badge Badge--negative CDB-Text CDB-Size-small").text(failed);
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
