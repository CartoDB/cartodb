var cdb = require('cartodb.js');

/**
 * View to render a set of rows.
 */
module.exports = cdb.core.View.extend({

  initialize: function() {
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    this.$el.html(
      this.getTemplate('common/dialogs/georeference/rows')({
        title: this.options.title,
        desc: this.options.desc
      })
    );
    this._renderRows();
    return this;
  },

  _initBinds: function() {
    var rows = this.model.get('rows');
    rows.bind('change', this.model.assertIfCanContinue, this.model);
    this.add_related_model(rows);
  },

  _renderRows: function() {
    this.model.get('rows').chain()
      .map(this._createRowView, this)
      .map(this._appendRowToDOM, this);
  },

  _createRowView: function(m) {
    var view = m.createView();
    this.addView(view);
    return view;
  },

  _appendRowToDOM: function(view) {
    this.$('.js-rows').append(view.render().el);
  }

});
