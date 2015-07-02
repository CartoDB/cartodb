var cdb = require('cartodb.js');

/**
 * View to select long/lat couple to do the georeference.
 */
module.exports = cdb.core.View.extend({

  initialize: function() {
    this._initBinds();
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
  },

  _onChangeRows: function() {
    this.model.onChangeRows();
  }

});
