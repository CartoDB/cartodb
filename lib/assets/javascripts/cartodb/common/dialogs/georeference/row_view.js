var cdb = require('cartodb.js-v3');

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
      this.getTemplate('common/dialogs/georeference/row')({
        label: this.model.get('label')
      })
    );
    this.$('.js-select').append(this._selectView.render().el);
    return this;
  },

  _initBinds: function() {
    this.model.bind('change:value', this._onChangeValue, this);
  },

  _initViews: function() {
    this._selectView = new cdb.forms[this.model.get('comboViewClass')]({
      model: this.model,
      placeholder: this.model.get('placeholder'),
      disabled: this.model.get('disabled'),
      extra: this.model.get('data'),
      className: 'Select',
      width: '100%',
      property: 'value',

      // This is only needed for a ComboFreeText view, but doesn't hurt for the normal Combo so let's leave it
      text: 'isFreeText'
    });
    this.addView(this._selectView);

    // Simulate a initial selection to update model to be in sync with the view
    this._selectView.render()._changeSelection();
  },

  _onChangeValue: function(m, val) {
    this.$el.toggleClass('is-done', !!val);
  }

});
