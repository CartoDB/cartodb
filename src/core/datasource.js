cdb.core.Datasource = cdb.core.Model.extend({

  _WIDGETS: {
    'list': 'ListModel'
  },

  initialize: function(attrs, opts) {
    this._generateWidgetCollections();
    this._layerDef = new LayerDefinition(opts.layerDef.options.layer_definition, opts.layerDef.options);
    this._initBinds();
  },

  _generateWidgetCollections: function() {
    var self = this;
    _.each(this._WIDGETS, function(val, name) {
      self['_' + name] = new Backbone.Collection({
        model: cdb.Widget[val]
      });
    });
  },

  _getWidgetCollection: function(type) {
    var collection = this['_' + type];
    if (collection) {
      return collection;
    } else {
      throw new Error("Widgets collection " + type + " not defined.");
    }
  },

  _initBinds: function() {},

  addWidgetModel: function(d) {
    if (!this._WIDGETS[d.type]) {
      throw new Error("Widget model " + d.type + " not defined.");
    }

    var mdl = new cdb.Widget[this._WIDGETS[d.type]](d);
    var collection = this._getWidgetCollection(d.type);
    collection && collection.add(mdl);
    this.bind('change:id', function(datasource, id) {
      mdl.set("id", id);
    }, this);
    return mdl;
  },

  instantiate: function(callback) {
    var self = this;
    this.trigger('loading');
    this._layerDef.createMap(function(data) {
      self.set('id', data.layergroupid);
      self.trigger('done');
      callback && callback(data);
    });
  },

  filter: function(min, max) {
    this._layerDef.setSQL('');
  },

  clean: function() {
    this._layerDef.unbind && this._layerDef.unbind(null, null, this);
  }

})
