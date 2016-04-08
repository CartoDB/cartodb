var cdb = require('cartodb-deep-insights.js');
var _ = require('underscore');
var moment = require('moment');
var ImportView = require('../import-view');
var UploadModel = require('../../../../../../data/upload-model');
var DatesRangePickerView = require('../../../../../date-picker/date-picker-range-view');
var TwitterCategoriesView = require('./twitter-categories/twitter-categories-view');
var CreditsUsageView = require('./credits-usage-view.js');
var template = require('./import-twitter.tpl');

/**
 *  Import twitter panel
 *
 *  - It accepts up to 3 categories
 *  - Date range can't be longer than 30 days
 *
 */

module.exports = ImportView.extend({
  options: {
    acceptSync: false,
    type: 'service',
    service: 'twitter_search'
  },

  className: 'ImportPanel ImportTwitterPanel',

  initialize: function (opts) {
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.configModel) throw new Error('configModel is required');

    this._userModel = opts.userModel;
    this._configModel = opts.configModel;
    this.model = new UploadModel({
      type: this.options.type,
      service_name: this.options.service
    }, {
      userModel: this._userModel,
      configModel: this._configModel
    });

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(
      template({
        currentGMT: moment().format('Z')
      })
    );
    this._initViews();
    return this;
  },

  _initViews: function () {
    // Categories
    var categories = this.categories = new TwitterCategoriesView();
    categories.bind('changeCategory', this._setModel, this);
    this.$('.ImportTwitterPanel-cagetories').append(categories.render().el);
    this.addView(categories);

    // Date picker
    var datepicker = this.datepicker = new DatesRangePickerView({
      className: 'DatePicker DatePicker--withBorder'
    });
    datepicker.bind('changeDate', this._setModel, this);
    this.$('.js-picker').append(datepicker.render().el);
    this.addView(datepicker);

    // Use slider
    var creditsUsage = this.creditsUsage = new CreditsUsageView({
      el: this.$('.CreditsUsage'),
      userModel: this._userModel
    });
    creditsUsage.bind('maxCreditsChange', this._setModel, this);
    creditsUsage.render();
    this.addView(creditsUsage);

    this._setModel();
  },

  _initBinds: function () {
    this.model.bind('change', this._triggerChange, this);
  },

  _getCategories: function () {
    var categories = this.categories.getCategories();
    return _.filter(categories, function (c) {
      return c.category && c.terms.length > 0;
    });
  },

  _getDates: function () {
    return this.datepicker.getDates();
  },

  _getMaxCredits: function () {
    return this.creditsUsage.getMaxCredits();
  },

  _setModel: function () {
    var categories = this._getCategories();
    var dates = this._getDates();
    var maxCredits = this._getMaxCredits();
    var d = {
      categories: categories,
      dates: dates
    };

    this.model.set({
      value: d,
      service_item_id: d,
      user_defined_limits: {
        twitter_credits_limit: maxCredits
      }
    });
  }

});
