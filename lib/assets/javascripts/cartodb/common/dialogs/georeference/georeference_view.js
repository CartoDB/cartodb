var $ = require('jquery');
var _ = require('underscore');
var BaseDialog = require('../../views/base_dialog/view.js');
var GeoreferenceModel = require('./georeference_model');
var TabItemView = require('./tab_item_view');

/**
 * Dialog to georeference a table.
 * This view only acts as a high-level view, that managed the general view logic for the modal.
 * What is supposed to happen is delegated to the model and in turn the selected georeference option.
 */
module.exports = BaseDialog.extend({

  events: BaseDialog.extendEvents({
    'click .js-back:not(.is-disabled)': '_onGoBack'
  }),

  initialize: function() {
    if (!this.options.user) throw new Error('user is required');
    this.options.clean_on_hide = true;
    this.options.enter_to_confirm = true;
    this.elder('initialize');

    this.model = new GeoreferenceModel({
      table: this.options.table,
      user: this.options.user
    });
    this._initViews();
    this._initBinds();
  },

  /**
   * @override BaseDialog.prototype.render
   */
  render: function() {
    BaseDialog.prototype.render.apply(this, arguments);
    this.$('.content').addClass('Dialog-contentWrapper');
    return this;
  },

  render_content: function() {
    var table = this.model.get('table');
    var $el = $(
      this.getTemplate('common/dialogs/georeference/georeference')({
        hasNoGeoferencedData: !table.isGeoreferenced() && table.data().length > 0
      })
    );
    this._renderTabs($el.find('.js-tabs'));
    this._renderTabContent($el);

    return $el;
  },

  ok: function() {
    this.model.continue();
  },

  _initViews: function() {
    this._tabViews = this.model.get('options').map(this._createDefaultTabView, this);
  },

  _createDefaultTabView: function(model) {
    var view = new TabItemView({
      model: model
    });
    this.addView(view);
    return view;
  },

  _renderTabs: function($target) {
    $target.append.apply($target, _.map(this._tabViews, this._getRenderedElement));
  },

  _getRenderedElement: function(view) {
    return view.render().el;
  },

  _renderTabContent: function($target) {
    if (this._tabContentView) {
      this._tabContentView.clean();
    }
    this._tabContentView = this.model.createView();
    $target.find('.js-tab-content').html(this._tabContentView.render().el);
  },

  _initBinds: function() {
    var options = this.model.get('options');
    options.bind('change:selected', this._onChangeSelectedTab, this);
    options.bind('change:canGoBack', this._onChangeCanGoBack, this);
    options.bind('change:canContinue', this._onChangeCanContinue, this);
    options.bind('change:continueLabel', this._onChangeContinueLabel, this);
    options.bind('change:geocodeData', this._onChangeGeocodeData, this);
    this.add_related_model(options);
  },

  _onChangeSelectedTab: function(tabModel, isSelected) {
    if (isSelected) {
      this.model.changedSelectedTab(tabModel);
      this._onChangeCanContinue(tabModel, false);
      this._renderTabContent(this.$el);
      this._onChangeContinueLabel(tabModel);
    }
  },

  _onChangeCanContinue: function(tabModel, canContinue) {
    this.$('.ok').toggleClass('is-disabled', !canContinue);
  },

  _onChangeCanGoBack: function(tabModel, canGoBack) {
    this.$('.js-back').toggle(canGoBack);
  },

  _onGoBack: function() {
    this.model.goBack();
  },

  _onChangeGeocodeData: function(tabModel, data) {
    this.trigger('geocodingChosen', data);
    this.hide();
  },

  _onChangeContinueLabel: function(tabModel) {
    this.$('.ok span').text(tabModel.get('continueLabel') || 'Continue');
  }

});
