cdb.core.Datasource = cdb.core.Model.extend({

  _WIDGETS: {
    'list': 'ListModel'
  },

  initialize: function(attrs, opts) {
    this._generateWidgetCollections();
    this._windshaftMap = opts.windshaftMap;
    this._initBinds();

    this.trigger('loading');
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

  _initBinds: function() {
    var self = this;

    this._windshaftMap.bind("change:layergroupid", function() {
      self.set('id', self._windshaftMap.get('layergroupid'));
      self.trigger('done');
    })
  },

  addWidgetModel: function(d) {
    if (!this._WIDGETS[d.type]) {
      throw new Error("Widget model " + d.type + " not defined.");
    }

    var modelAttributes = _.extend(d, {
      baseURL: this.get('maps_api_template').replace('{user}', this.get('user_name'))
    })
    var mdl = new cdb.Widget[this._WIDGETS[d.type]](modelAttributes);
    var collection = this._getWidgetCollection(d.type);
    collection && collection.add(mdl);
    this.bind('change:id', function(datasource, id) {
      mdl.set({
        layerGroupId: id
      });

      mdl.fetch();
    }, this);
    return mdl;
  },

  filter: function(min, max) {
    this._layerDef.setSQL('');
  },

  clean: function() {
    this._layerDef.unbind && this._layerDef.unbind(null, null, this);
  }

})
