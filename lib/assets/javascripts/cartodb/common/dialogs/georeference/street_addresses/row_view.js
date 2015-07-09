var cdb = require('cartodb.js');

/**
 * View for the street addresses georeference option.
 */
module.exports = cdb.core.View.extend({

  className: 'Form-row Form-row--step',

  initialize: function() {
    this._initViews();
    this._initBinds();
  },

  render: function() {
    this.$el.html(
      this.getTemplate('common/dialogs/georeference/street_addresses/row')({
        label: this.model.get('label')
      })
    );
    this.$('.js-select').append(this._selectView.render().el);
    return this;
  },

  _initBinds: function() {
    this.model.bind('change:columnOrFreeTextValue', this._onChangeValue, this);
  },

  _initViews: function() {
    this._selectView = new cdb.forms.CustomTextCombo({
      model: this.model,
      property: 'columnOrFreeTextValue',
      text: 'isFreeText',
      className: 'Select',
      width: '100%',
      placeholder: 'Select column or type it',
      extra: this.model.get('data')
    });
    this.addView(this._selectView);

    // Simulate a initial selection to update model to be in sync with the view
    this._selectView.render()._changeSelection();
  },

  _onChangeValue: function(m, val) {
    this.$el.toggleClass('is-done', !!val);
  }

});
