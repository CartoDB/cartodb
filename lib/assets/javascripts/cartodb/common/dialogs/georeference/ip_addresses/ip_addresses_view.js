var $ = require('jquery');
var cdb = require('cartodb.js');

/**
 * View to select IP addresses to do the georeference.
 */
module.exports = cdb.core.View.extend({

  initialize: function() {
    this._initViews();
    this._initBinds();
  },

  render: function() {
    var $el = $(
        this.getTemplate('common/dialogs/georeference/ip_addresses/ip_addresses')({
      })
    );
    $el.find('.js-column-name').append(this._columnNameView.render().el);
    this.$el.html($el);
    return this;
  },

  _initViews: function() {
    this._columnNameView = new cdb.forms.Combo({
      model: this.model,
      property: 'columnName',
      className: 'Select',
      width: '100%',
      placeholder: 'Select column',
      extra: this.model.get('columnsNames')
    });
    this.addView(this._columnNameView);
  },

  _initBinds: function() {
    this.model.bind('change:columnName', this.model.assertIfCanContinue, this.model);
  }

});
