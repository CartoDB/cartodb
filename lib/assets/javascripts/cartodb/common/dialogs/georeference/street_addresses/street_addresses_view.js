var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');
var ViewFactory = require('../../../view_factory');
var EstimationView = require('./estimation_view');
var QuotaView = require('./quota_view');
var DefaultFooterView = require('../default_footer_view');
var pluralizeString = require('../../../view_helpers/pluralize_string');

/**
 * View to select long/lat couple to do the georeference.
 */
module.exports = cdb.core.View.extend({

  initialize: function() {
    this._initBinds();
    this._fetchEstimation();
  },

  render: function() {
    this.clearSubViews();
    this.$el.html(
      this.getTemplate('common/dialogs/georeference/street_addresses/street_addresses')({
      })
    );
    this._renderHeader();
    this._renderRows();

    var showCostsInfo = this.model.showCostsInfo();
    if (showCostsInfo) {
      this._renderEstimation();
      this._renderQuota();
    }
    this.$('.js-costs-info').toggle(!!showCostsInfo);

    this._renderFooter();
    return this;
  },

  _renderHeader: function() {
    var view = ViewFactory.createByTemplate('common/dialogs/georeference/default_content_header', {
      title: 'Select the column(s) that has your street address',
      desc: 'Use this option if you need high resolution geocoding of your street adresses data.'
    });
    this.addView(view);
    this.$el.prepend(view.render().$el);
  },

  _renderRows: function() {
    this._$rows().toggleClass('u-disabled', !!this.model.isDisabled());
    this.model.get('rows').chain()
      .map(this._createRowView, this)
      .map(this._appendRowToDOM, this);
  },

  _renderEstimation: function() {
    var view = new EstimationView({
      model: this.model.get('estimation'),
      userGeocoding: this.model.get('userGeocoding'),
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

  _renderFooter: function() {
    var content;

    if (this.model.isDisabled()) {
      content = this.getTemplate('common/dialogs/georeference/street_addresses/upgrade_footer')({
        cartodb_com_hosted: cdb.config.get('cartodb_com_hosted'),
        upgradeURL: cdb.config.get('upgrade_url'),
        pluralizeString: pluralizeString,
        daysLeftToNextBilling: this.model.daysLeftToNextBilling()
      });
    } else {
      var view = new DefaultFooterView({
        model: this.model
      });
      this.addView(view);
      content = view.render().$el;
    }

    this.$el.append(content);
  },

  _createRowView: function(m) {
    var view = m.createView();
    this.addView(view);
    return view;
  },

  _appendRowToDOM: function(view) {
    this._$rows().append(view.render().el);
  },

  _$rows: function() {
    return this.$('.js-rows');
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

    var geocodeStuff = this.model.get('geocodeStuff');
    geocodeStuff.bind('change:forceAllRows', this._onChangeForceAllRows, this);
    this.add_related_model(geocodeStuff);

    this.model.bind('change:confirmTOS', this._onChangeConfirmTOS, this);
    this.model.bind('change:isGoogleMapsUser', this.render, this);
  },

  _onChangeForceAllRows: function() {
    this.model.get('estimation').reset();
    this._fetchEstimation();
  },

  _fetchEstimation: function() {
    if (this.model.showCostsInfo()) {
      this.model.get('estimation').fetch({
        data: {
          force_all_rows: this.model.get('geocodeStuff').get('forceAllRows')
        }
      });
    }
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
    var mustAgreeToTOS = this.model.get('estimation').mayHaveCost() && !this.model.hasHardLimit();
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
