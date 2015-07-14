var cdb = require('cartodb.js');
var RowsView = require('../rows_view');
var ChooseGeometryView = require('../choose_geometry_view');

/**
 * Since admin. regions involves multiple steps, this view delegates to subviews for each step
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
    return step === 0 ? this._createSelectColumnsView() : this._createChooseGeometryView();
  },

  _createSelectColumnsView: function() {
    var view = new RowsView({
      model: this.model,
      title: 'Select the column that has Administrative Regions',
      desc: "Georeference your data by country’s, state's, province's or municipality’s"
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
