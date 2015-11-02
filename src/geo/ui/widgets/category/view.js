
/**
 *  Category widget view
 *
 */

cdb.geo.ui.Widget.Category.View = cdb.geo.ui.Widget.View.extend({

  _createContentView: function() {
    return new cdb.geo.ui.Widget.Category.Content({
      model: this.model,
      filter: this.filter
    });
  }

});
