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

  initialize: function() {
    if (!this.options.user) throw new Error('user is required');
    this.options.clean_on_hide = true;
    this.options.enter_to_confirm = true;
    this.elder('initialize');

    this.model = new GeoreferenceModel({
      table: this.options.table
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
    var $el = $(
      this.getTemplate('common/dialogs/georeference/georeference')({
        templatesURL: this.options.user.viewUrl().dashboard().maps() + '?open-create-map-tutorials'
      })
    );
    this._renderTabs($el.find('.js-tabs'));
    this._renderTabContent($el);

    return $el;
  },

  _renderTabs: function($target) {
    $target.append.apply($target, _.map(this._tabViews, this._getRenderedElement));
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

  _getRenderedElement: function(view) {
    return view.render().el;
  },

  _renderTabContent: function($target) {
    if (this._tabContentView) {
      this._tabContentView.clean();
    }
    this._tabContentView = this.model.selectedTabModel().createView();
    $target.find('.js-tab-content').html(this._tabContentView.render().el);
  },

  _initBinds: function() {
    var options = this.model.get('options');
    options.bind('change:selected', this._onChangeSelectedTab, this);
    options.bind('change:canContinue', this._onChangeCanContinue, this);
    this.add_related_model(options);

    this.model.bind('change:geocodeData', this._onChangeGeocodeData, this);
  },

  _onChangeSelectedTab: function(tabModel, isSelected) {
    if (isSelected) {
      this.model.changedSelectedTab(tabModel);
      this._onChangeCanContinue(tabModel, false);
      this._renderTabContent(this.$el);
    }
  },

  _onChangeCanContinue: function(tabModel, canContinue) {
    this.$('.ok').toggleClass('is-disabled', !canContinue);
  },

  _onChangeGeocodeData: function(tabModel, geocodeData) {
    // To adhere to existing workflow, trigger same events as old modal upon clicking continue
    this.trigger('geocodingChosen', geocodeData);
    this.hide();
  }

});
