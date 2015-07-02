var cdb = require('cartodb.js');

/**
 * View to select long/lat couple to do the georeference.
 */
module.exports = cdb.core.View.extend({

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
  }

});
