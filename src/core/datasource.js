cdb.core.List = cdb.core.Model.extend({

});

cdb.core.Datasource = cdb.core.Model.extend({

  url: function() {
    return '/api/v1/map/'
  },

  initialize: function(attrs, opts) {
    this._lists = new Backbone.Collection();
    this._layerDef = new LayerDefinition(opts.layerDef.options.layer_definition, opts.layerDef.options);
  },

  addWidget: function(d) {
    var mdl = new cdb.core.List(d);
    this._lists.add(mdl);
    return mdl;
  },

  instantiate: function(callback) {
    this._layerDef.createMap(callback);
  }

})
