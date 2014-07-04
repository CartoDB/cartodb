cdb.admin.overlays = {};

/*
 * Model for the Overlays
 * */
cdb.admin.models.Overlay = cdb.core.Model.extend({

  /*
   * Overwrite serialization method to use our Overlay structure
   * */
  toJSON: function() {

    return {
      template: this.get("template"),
      order:    this.get("order"),
      type:     this.get("type"),
      options:  {
        x:       this.get("x"),
        y:       this.get("y"),
        device:  this.get("device"),
        display: this.get("display"),
        style:   this.get("style"),
        extra:   this.get("extra")
      }
    }
  }

});

/*
 * Overlays collection
 * */
cdb.admin.Overlays = Backbone.Collection.extend({

  model: cdb.admin.models.Overlay,
  comparator: function(item) {
    return item.get("order");
  }

});

