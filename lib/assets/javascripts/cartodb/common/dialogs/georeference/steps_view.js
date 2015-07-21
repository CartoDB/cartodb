var cdb = require('cartodb.js');
var RowsView = require('./rows_view');
var ChooseGeometryView = require('./choose_geometry_view');
var ViewFactory = require('../../view_factory');

/**
 * View for the georeference types that requires the two-steps flow.
 * First select columns values, and then the geometry type to use.
 */
module.exports = cdb.core.View.extend({

  initialize: function() {
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();

    if (this.model.get('step') === 1) {
      this._createChooseGeometryView();
    } else {
      this._createHeaderView();
      this._createRowsView();
    }

    return this;
  },

  _createHeaderView: function() {
    this._appendView(
      ViewFactory.createByTemplate('common/dialogs/georeference/default_content_header', {
        title: this.options.title,
        desc: this.options.desc
      })
    );
  },

  _createRowsView: function() {
    this._appendView(
      new RowsView({
        model: this.model
      })
    );
  },

  _createChooseGeometryView: function() {
    this._appendView(
      new ChooseGeometryView({
        model: this.model
      })
    );
  },

  _appendView: function(view) {
    this.addView(view);
    this.$el.append(view.render().$el);
  },

  _initBinds: function() {
    this.model.bind('change:step', this.render, this);
  }

});
