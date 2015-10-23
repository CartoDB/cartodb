
/**
 *  List widget view
 *
 */

cdb.geo.ui.Widget.List = {};

cdb.geo.ui.Widget.List.View = cdb.geo.ui.Widget.View.extend({

  _createContentView: function() {
    return new cdb.geo.ui.Widget.List.Content({
      viewModel: this.viewModel,
      dataModel: this.dataModel
    });
  }

});
