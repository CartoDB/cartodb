var $ = require('jquery');
var _ = require('underscore');
var cdb = require('cartodb.js');

/**
 * Select the columns to use for city names georeference.
 */
module.exports = cdb.core.View.extend({

  initialize: function() {
    this._initViews();
    this._initBinds();
  },

  render: function() {
    var $el = $(
        this.getTemplate('common/dialogs/georeference/city_names/select_columns')({
      })
    );
    $el.find('.js-city').append(this._cityView.render().el);
    $el.find('.js-admin-region').append(this._adminRegionView.render().el);
    $el.find('.js-country').append(this._countryView.render().el);
    this.$el.html($el);
    return this;
  },

  _initViews: function() {
    this._cityView = this._createSelectView(cdb.forms.Combo, {
      property: 'column_name',
      placeholder: 'Select column',
      extra: this.model.get('columnsNames')
    });
    this._adminRegionView = this._createSelectView(cdb.forms.CustomTextCombo, {
      property: 'region',
      extra: this._columnsDataForCustomTextCombo()
    });
    this._countryView = this._createSelectView(cdb.forms.CustomTextCombo, {
      property: 'location',
      extra: this._columnsDataForCustomTextCombo()
    });
  },

  _createSelectView: function(ComboView, data) {
    var view = new ComboView(
      _.extend({
        model: this.model,
        className: 'Select',
        width: '100%',
        placeholder: 'Select column or type it'
      }, data)
    );
    // Simulate a initial selection to update model to be in sync with the view
    view.render()._changeSelection();
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
    this.model.bind('change', this.model.assertIfCanContinue, this.model);
  }

});
