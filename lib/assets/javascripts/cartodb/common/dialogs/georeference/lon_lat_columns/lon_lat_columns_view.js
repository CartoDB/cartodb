var $ = require('jquery');
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
        this.getTemplate('common/dialogs/georeference/lon_lat_columns/lon_lat_columns')({
      })
    );
    $el.find('.js-lon-column').append(this._lonColumnView.render().el);
    $el.find('.js-lat-column').append(this._latColumnView.render().el);
    this.$el.html($el);
    return this;
  },

  _initViews: function() {
    this._lonColumnView = this._createSelectView('lonColumnName');
    this._latColumnView = this._createSelectView('latColumnName');
  },

  _createSelectView: function(attrName) {
    var view = new cdb.forms.Combo({
      model: this.model,
      property: attrName,
      className: 'Select',
      width: '100%',
      placeholder: '…',
      extra: this.model.get('columnsNames')
    });
    this.addView(view);
    return view;
  },

  _initBinds: function() {
    this.model.bind('change:lonColumnName change:latColumnName', this.model.assertIfCanContinue, this.model);
  }

});
