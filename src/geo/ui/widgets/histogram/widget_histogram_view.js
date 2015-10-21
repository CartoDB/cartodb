/**
 *  Histogram widget view
 *
 */

cdb.geo.ui.Widget.Histogram = {};

cdb.geo.ui.Widget.Histogram.View = cdb.geo.ui.Widget.View.extend({

  _createContentView: function() {
    return new cdb.geo.ui.Widget.Histogram.Content({
      viewModel: this.viewModel,
      dataModel: this.dataModel
    });
  }

});
