
/**
 *  List widget view
 *
 */

cdb.geo.ui.Widget.List.View = cdb.geo.ui.Widget.View.extend({

  _createContentView: function() {
    return new cdb.geo.ui.Widget.List.Content({
      model: this.model
    });
  }

});
