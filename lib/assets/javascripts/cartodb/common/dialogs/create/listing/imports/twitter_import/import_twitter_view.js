var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');
var _ = require('underscore');
var ImportDefaultView = require('../../../../../dialogs/create/listing/imports/import_default_view');
var UploadModel = require('../../../../../background_polling/models/upload_model');
var DatesRangePicker = require('../../../../../views/date_pickers/dates_range_picker');
var TwitterCategories = require('../../../../../dialogs/create/listing/imports/twitter_import/twitter_categories/twitter_categories_view');
var CreditsUsageView = require('./credits_usage_view.js');

/**
 *  Import twitter panel
 *
 *  - It accepts up to 3 categories
 *  - Date range can't be longer than 30 days
 *
 */

module.exports = ImportDefaultView.extend({

  options: {
    acceptSync: false,
    type: 'service',
    service: 'twitter_search'
  },

  className: 'ImportPanel ImportTwitterPanel',

  initialize: function() {
    this.user = this.options.user;
    this.model = new UploadModel({
      type: this.options.type,
      service_name: this.options.service
    }, {
      user: this.user
    });

    this.template = cdb.templates.getTemplate('common/views/create/listing/import_types/import_twitter');

    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    this.$el.html(this.template());
    this._initViews();
    return this;
  },

  _initViews: function() {
    // Categories
    var categories = this.categories = new TwitterCategories();
    categories.bind('changeCategory', this._setModel, this);
    this.$('.ImportTwitterPanel-cagetories').append(categories.render().el);
    this.addView(categories);

    // Date picker
    this.datePickerModel = new cdb.core.Model({ dates_range: {} });
    this.datepickerView = new DatesRangePicker({
      model: this.datePickerModel,
      property: 'dates_range'
    });
    this.$('.js-picker').append(this.datepickerView.render().el);
    this.addView(this.datepickerView);

    // Use slider
    this.creditsUsageModel = new cdb.core.Model({ twitter_credits: 0 });
    this.creditsUsageView = new CreditsUsageView({
      el: this.$('.CreditsUsage'),
      user: this.user,
      model: this.creditsUsageModel,
      property: 'twitter_credits'
    });
    this.creditsUsageView.bind('maxCreditsChange', this._setModel, this);
    this.creditsUsageView.render();
    this.addView(this.creditsUsageView);

    this._setModel();
  },

  _initBinds: function() {
    this.model.bind('change', this._triggerChange, this);
  },

  _getCategories: function() {
    var categories = this.categories.getCategories();
    return _.filter(categories, function(c) {
      return c.category && c.terms.length > 0
    });
  },

  _getDates: function() {
    return this.datepicker.getDates();
  },

  _getMaxCredits: function() {
    return this.creditsUsage.getMaxCredits();
  },

  _setModel: function() {
    var categories = this._getCategories();
    var dates = this.datePickerModel.get('dates_range');
    var maxCredits = this.creditsUsageModel.get('twitter_credits');
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