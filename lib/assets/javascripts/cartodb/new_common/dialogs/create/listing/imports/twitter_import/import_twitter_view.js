var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');
var Utils = require('cdb.Utils');
var ImportDefaultView = require('../../../../../dialogs/create/listing/imports/import_default_view');
var UploadModel = require('../../../../../upload_model');
var DatePicker = require('../../../../../custom_datepicker');
var TwitterCategories = require('../../../../../dialogs/create/listing/imports/twitter_import/twitter_categories/twitter_categories_view');

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
    this.currentUserUrl = this.options.currentUserUrl;
    this.model = new UploadModel({
      type: this.options.type,
      service_name: this.options.service
    }, {
      user: this.user
    });

    this.template = cdb.templates.getTemplate('new_common/views/create/listing/import_types/import_twitter');

    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    this.$el.html(this.template());
    this._initViews();
    return this;
  },

  _initViews: function() {
    var self = this;

    // Categories
    var categories = new TwitterCategories();
    // categories.bind('changeCategory',   this._onCategoriesChange, this);
    // categories.bind('submitCategory',   this._onSubmit, this);
    // categories.bind('limitCategory',    this._onCategoryLimit, this);
    // categories.bind('noLimitCategory',  this._onCategoryNoLimit, this);
    // categories.bind('addCategory',      this._onAddRemoveCategory, this);
    // categories.bind('removeCategory',   this._onAddRemoveCategory, this);
    this.$('.ImportTwitterPanel-cagetories').append(categories.render().el);
    this.addView(categories);

    // Date picker
    var datepicker = this.datepicker = new DatePicker();
    datepicker.bind('changeDate', this._onDateChange, this);
    this.$('.DatePicker').append(datepicker.render().el);
    this.addView(datepicker);
    // *Set datepicker values from the beginning*
    this._onDateChange(datepicker.getDates());
  },

  _initBinds: function() {
    // this.model.bind('change:state', this._checkState, this);
    this.model.bind('change', this._triggerChange, this);
  },

  _onDateChange: function(mdl, v) {
    var d = this.model.get('value');
    d.dates = mdl;

    // Set same value for value and service_item_id
    this.model.set({
      value: d,
      service_item_id:  d
    })
  }

})