{

  initialize: function() {
    // keep an instance vars for the cartodb.js/deep insights contexts that need to be synced
    this.vis = vis;
    this.deepInsights = di;

    // …
    layerDefinitionsCollection.on('add', this._onLayerDefinitionCreated, this);
    layerDefinitionsCollection.on('change', this._onLayerDefinitionChanged, this);
    layerDefinitionsCollection.on('remove', this._onLayerDefinitionUpdated, this);

    widgetDefinitionsCollection.on('add', this._onWidgetDefinitionCreated, this)
    widgetDefinitionsCollection.on('change', this.onWidgetDefinitionChanged, this)
    widgetDefinitionsCollection.on('remove', this._onWidgetDefinitions, this)
  },

  _createLayer: function (m) {
    // stub; the layer is initially an empty data layer basically, so enough to create the corresponding layer in cartodb.js
  },

  _onLayerDefinitionChanged: function (layerDef) {
    // stub, TBD:
    // - get the corresponding layer (should already exist)
    // - update the layer
    // - update infowindow
    // - update tooltips etc.
    // - other?
  },

  _onWidgetDefinitionCreated: function (widgetDef) {
    // …
  }

}
