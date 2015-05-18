var cdb = require('cartodb.js');
var BaseDialog = require('../../views/base_dialog/view');
var FooterView = require('./sync/footer_view');
var ViewFactory = require('../../view_factory');
var randomQuote = require('../../view_helpers/random_quote');

/**
 * Add layer dialog, typically used from editor
 */
module.exports = BaseDialog.extend({

  _INTERVALS: [['Never', 0], ['Every hour', (60*60)], ['Every day', (60*60*24)], ['Every week', (60*60*24*7)], ['Every month', (60*60*24*30)]],

  initialize: function() {
    this.elder('initialize');

    if (!this.options.table) {
      throw new TypeError('table is required');
    }


    this.table = this.options.table;
    this._setupModel();


    this._template = cdb.templates.getTemplate('common/dialogs/map/sync_view_template');
    this._initBinds();

    // Does it come from a datasource service (Dropbox, GDrive, ...)?
    if (this.table.synchronization.get('service_name') || this.table.synchronization.get('service_item_id')) {
      this.url = this.table.synchronization.get('service_item_id');
    }

    this.service = this.table.synchronization.get('service_name');

    // If service exists, let's capitalize it!
    if (this.service && _.isString(this.service)) {
      this.service = this.service.charAt(0).toUpperCase() + this.service.slice(1);
    }

  },

  // implements cdb.ui.common.Dialog.prototype.render
  render: function() {
    this.clearSubViews();
    BaseDialog.prototype.render.call(this);
    this._initViews();
    return this;
  },

  // implements cdb.ui.common.Dialog.prototype.render
  render_content: function() {
    return this._template({
      service: this.service,
      url: this.url
    });
  },

  _initBinds: function() {
    this.model.bind('change:option', this._onOptionChange, this);
    //this.model.bind('change:contentPane', this._onChangeContentView, this);
    //this.add_related_model(cdb.god);
  },

  _onOptionChange: function(m) {
    // Setup dialog tabs
    this.$('.dialog-tab > a').removeClass('selected');
    var option = this.model.get('option');
    this.$('.dialog-tab.' + option + ' > a').addClass('selected');

    // Setup dialog panes
    this.$('.dialog-tab').removeClass('active');
    this.$('.dialog-tab.' + option).addClass('active');
  },

  _optionClicked: function(e) {
    if (e) e.preventDefault();

    // Get new option and set it in the model
    // (Taking it from the link)
    var href = $(e.target).attr('href');
    var option = href && href.replace('#/', '');

    if (option && this.model.get('option') != option) {
      this.model.set('option', option);
    }
  },

  _initViews: function() {
    //this._contentPane = new cdb.ui.common.TabPane({
    //el: this.$('.js-content-container')
    //});
    //this.addView(this._contentPane);
    //this._contentPane.active(this.model.get('contentPane'));

  },

  _setupModel: function() {
    // Create a model to know the options clicked
    this.model = new cdb.core.Model({
      option: 'interval',
      interval: this.table.synchronization.get('interval')
    });

  },

  _addTab: function(name, view) {
    this._contentPane.addTab(name, view.render());
    this.addView(view);
  }

});
