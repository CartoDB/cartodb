
/**
 *  Formula widget view
 *
 */

cdb.geo.ui.Widget.Formula.View = cdb.geo.ui.Widget.View.extend({

  _createContentView: function() {
    return new cdb.geo.ui.Widget.Formula.Content({
      viewModel: this.viewModel,
      dataModel: this.dataModel
    });
  }

});
