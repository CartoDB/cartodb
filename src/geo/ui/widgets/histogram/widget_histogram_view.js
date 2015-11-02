/**
 *  Histogram widget view
 *
 */

cdb.geo.ui.Widget.Histogram = {};

cdb.geo.ui.Widget.Histogram.View = cdb.geo.ui.Widget.View.extend({

  _createContentView: function() {
    return new cdb.geo.ui.Widget.Histogram.Content({
      dataModel: this.model,
      viewModel: new cdb.core.Model(),
      filter: this.filter
    });
  }

});
