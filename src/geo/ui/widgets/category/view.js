
/**
 *  Category widget view
 *
 */

cdb.geo.ui.Widget.Category = {};

cdb.geo.ui.Widget.Category.View = cdb.geo.ui.Widget.View.extend({

  _createContentView: function() {
    return new cdb.geo.ui.Widget.Category.Content({
      viewModel: this.viewModel,
      dataModel: this.dataModel
    });
  }

});
