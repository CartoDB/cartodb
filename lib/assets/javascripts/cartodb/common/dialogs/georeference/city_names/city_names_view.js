var $ = require('jquery');
var _ = require('underscore');
var cdb = require('cartodb.js');

/**
 * View to select long/lat couple to do the georeference.
 */
module.exports = cdb.core.View.extend({

  className: 'Georeference-content',

  initialize: function() {
    this._initViews();
    this._initBinds();
  },

  render: function() {
    var $el = $(
        this.getTemplate('common/dialogs/georeference/city_names/city_names')({
      })
    );
    $el.find('.js-city').append(this._cityView.render().el);
    $el.find('.js-admin-region').append(this._adminRegionView.render().el);
    $el.find('.js-country').append(this._countryView.render().el);
    this.$el.html($el);
    return this;
  },

  _initViews: function() {
    this._cityView = this._createSelectView('cityColumnName', true);
    this._adminRegionView = this._createSelectView('adminRegion');
    this._countryView = this._createSelectView('country');
  },

  _createSelectView: function(attrName, useDefaultCombo) {
    var ComboView;
    var data;

    if (useDefaultCombo) {
      ComboView = cdb.forms.Combo;
      data = this.model.get('columnsNames');
    } else {
      ComboView = cdb.forms.CustomTextCombo;
      data = this._columnsDataForCustomTextCombo();
    }

    var view = new ComboView({
      model: this.model,
      property: attrName,
      className: 'Select',
      width: '100%',
      placeholder: 'Select column or type it',
      extra: data
    });
    this.addView(view);
    return view;
  },

  _columnsDataForCustomTextCombo: function() {
    // The cdb.forms.CustomTextCombo expects the data to be in order of [type, name], so need to translate the raw schema
    return _.map(this.model.get('columns'), function(rawColumn) {
      var type = rawColumn[1];
      var name = rawColumn[0];
      return [type, name];
    });
  },

  _columnName: function(m) {
    return m.name;
  },

  _initBinds: function() {
    this.model.bind('change:cityColumnName change:adminRegion change:country', this.model.assertIfCanContinue, this.model);
  }

});
