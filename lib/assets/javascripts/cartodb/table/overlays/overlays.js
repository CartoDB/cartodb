cdb.admin.overlays = {};

/*
 * Model for the Overlays
 * */
cdb.admin.models.Overlay = cdb.core.Model.extend({

  defaults: {
    order: 1
  },

  _clone: function(obj) {

    var copy;

    // Handle  a couple of types, plus null and undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Array
    if (obj instanceof Array) {
      copy = [];
      for (var i = 0, len = obj.length; i < len; i++) {
        copy[i] = this._clone(obj[i]);
      }
      return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
      copy = {};
      for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = this._clone(obj[attr]);
      }
      return copy;
    }

    throw new Error("Type not supported");
  },

  cloneAttributes: function() {
    return this._clone(this.attributes);
  },

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
  }, 

  parse: function(resp) {
    resp.display = resp.options.display;
    delete resp.options.display;
    return resp;
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

