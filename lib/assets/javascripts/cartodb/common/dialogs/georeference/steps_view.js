var cdb = require('cartodb.js');
var RowsView = require('./rows_view');
var ChooseGeometryView = require('./choose_geometry_view');

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
    this.$el.html(this._currentStepView().render().$el);
    return this;
  },

  _currentStepView: function() {
    var step = this.model.get('step');
    return step === 1 ? this._createChooseGeometryView() : this._createRowsView();
  },

  _createRowsView: function() {
    var view = new RowsView({
      model: this.model,
    });
    this.addView(view);
    return view;
  },

  _createChooseGeometryView: function() {
    var view = new ChooseGeometryView({
      model: this.model
    });
    this.addView(view);
    return view;
  },

  _initBinds: function() {
    this.model.bind('change:step', this.render, this);
  }

});
