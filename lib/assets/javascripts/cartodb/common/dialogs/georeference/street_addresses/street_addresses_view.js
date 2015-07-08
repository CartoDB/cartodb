var cdb = require('cartodb.js');
var _ = require('underscore');
var ViewFactory = require('../../../view_factory');
var EstimationView = require('./estimation_view');
var QuotaView = require('./quota_view');

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
    this._renderEstimation();
    this._renderQuota();
    return this;
  },

  _renderRows: function() {
    this.model.get('rows').chain()
      .map(this._createRowView, this)
      .map(this._appendRowToDOM, this);
  },

  _renderEstimation: function() {
    var view = new EstimationView({
      model: this.model.get('estimation'),
      hasHardLimit: this.model.hasHardLimit()
    });
    this.addView(view);
    this.$('.js-estimation').append(view.render().el);
  },

  _renderQuota: function() {
    var view = new QuotaView({
      model: this.model.get('userGeocoding')
    });
    this.addView(view);
    this.$('.js-quota').append(view.render().el);
  },

  _createRowView: function(m) {
    var view = m.createView();
    this.addView(view);
    return view;
  },

  _appendRowToDOM: function(view) {
    this.$('.js-rows').append(view.render().el);
  },

  _initBinds: function() {
    var rows = this.model.get('rows');
    rows.bind('change', this._onChangeRows, this);
    rows.bind('add', this._onAddRow, this);
    this.add_related_model(rows);

    var estimation = this.model.get('estimation');
    estimation.bind('change', this._onChangeEstimation, this);
    estimation.bind('error', this._onEstimationError, this);
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

  _onAddRow: function(newRow, rows, opts) {
    var rowView = this._createRowView(newRow);
    this.$('.js-rows').children().eq(opts.index).before(rowView.render().el);
    this.model.assertIfCanAddMoreRows();
  },

  _onChangeEstimation: function() {
    var mustAgreeToTOS = this.model.get('estimation').mayHaveCost() &&
      !this.model.get('isGoogleMapsUser') && !this.model.hasHardLimit();

    this.model.set('mustAgreeToTOS', mustAgreeToTOS);
  },

  _onEstimationError: function() {
    // Force re-render, handled in subview
    this.model.get('estimation').set({
      estimation: -1,
      rows: -1
    });
  },

  _onChangeConfirmTOS: function(m, confirmTOS) {
    if (confirmTOS) {
      this.model.set('confirmTOS', false, { silent: true }); // to re-renable if cancelled
      var view = ViewFactory.createDialogByTemplate('common/dialogs/georeference/street_addresses/confirm_tos', {
        // template data
        costInDollars: this.model.get('estimation').costInDollars()
      }, {
        // dialog options
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
