var $ = require('jquery');
var _ = require('underscore');
var cdb = require('cartodb.js');

/**
 * View to select long/lat couple to do the georeference.
 */
module.exports = cdb.core.View.extend({

  initialize: function() {
    this._initViews();
    this._initBinds();
  },

  render: function() {
    var $el = $(
        this.getTemplate('common/dialogs/georeference/street_addresses/street_addresses')({
      })
    );
    $el.find('.js-street-addr').append(this._streetAddrView.render().el);
    $el.find('.js-state').append(this._stateView.render().el);
    $el.find('.js-country').append(this._countryView.render().el);
    this.$el.html($el);
    return this;
  },

  _initViews: function() {
    this._streetAddrView = this._createSelectView({
      property: 'streetAddr',
      text: 'isStreetAddrFreeText'
    });
    this._stateView = this._createSelectView({
      property: 'state',
      text: 'isStateFreeText'
    });
    this._countryView = this._createSelectView({
      property: 'country',
      text: 'isCountryFreeText'
    });
  },

  _createSelectView: function(data) {
    var view = new cdb.forms.CustomTextCombo(
      _.extend({
        model: this.model,
        className: 'Select',
        width: '100%',
        placeholder: 'Select column or type it',
        extra: this.model.get('columns')
      }, data)
    );
    // Simulate a initial selection to update model to be in sync with the view
    view.render()._changeSelection();
    this.addView(view);
    return view;
  },

  _initBinds: function() {
  }

});
