var cdb = require('cartodb.js');
var _ = require('underscore');
var ViewFactory = require('../../../view_factory');

/**
 * View to select long/lat couple to do the georeference.
 */
module.exports = cdb.core.View.extend({

  initialize: function() {
    this._initBinds();
    this.model.get('estimation').fetch();
  },

  render: function() {
    this.clearSubViews();
    this.$el.html(
      this.getTemplate('common/dialogs/georeference/street_addresses/street_addresses')({
      })
    );
    this._renderRows();
    return this;
  },

  _renderRows: function() {
    this.model.get('rows').chain()
      .map(this._createView, this)
      .map(this._appendToDOM, this);
  },

  _createView: function(m) {
    var view = m.createView();
    this.addView(view);
    return view;
  },

  _appendToDOM: function(view) {
    this.$('.js-rows').append(view.render().el);
  },

  _initBinds: function() {
    var rows = this.model.get('rows');
    rows.bind('change', this._onChangeRows, this);
    this.add_related_model(rows);

    var estimation = this.model.get('estimation');
    estimation.bind('all', this._onChangeEstimation, this);
    this.add_related_model(estimation);

    this.model.bind('change:confirmTOS', this._onChangeConfirmTOS, this);
  },

  _onChangeRows: function() {
    var formatter = this.model.get('rows').chain()
      .map(this.model.getFormatterItemByRow)
      .compact() // there might be rows that have no value, if so skip them
      .value().join(', ');

    this.model.set({
      formatter: formatter,
      canContinue: !_.isEmpty(formatter)
    });
  },

  _onChangeEstimation: function() {
    // Only if estimation value is 0 we know for sure that the TOS don't need to be agreed to
    var mustAgreeToTOS = this.model.get('estimation').get('estimation') !== 0 &&
      !this.model.get('isGoogleMapsUser') && !this.model.isHardLimit();

    this.model.set('mustAgreeToTOS', mustAgreeToTOS);
  },

  _onChangeConfirmTOS: function(m, confirmTOS) {
    if (confirmTOS) {
      this.model.set('confirmTOS', false, { silent: true }); // to re-renable if cancelled
      var view = ViewFactory.createDialogByTemplate('common/dialogs/georeference/street_addresses/confirm_tos', {}, {
        triggerDialogEvents: false, // to avoid closing this modal
        enter_to_confirm: true,
        clean_on_hide: false
      });
      view.ok = this._onAgreeToTOS.bind(this);
      this.addView(view);
      view.appendToBody();
    }
  },

  _onAgreeToTOS: function() {
    this.model.set('hasAgreedToTOS', true);
    this.model.continue();
  }

});
