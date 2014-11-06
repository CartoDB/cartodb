
(function() {

  if(typeof(L) == "undefined")
    return;

  var substitutes = {
    roadmap: { // Nokia Day
      url: 'https://{s}.maps.nlp.nokia.com/maptile/2.1/maptile/newest/normal.day/{z}/{x}/{y}/256/png8?lg=eng&token=A7tBPacePg9Mj_zghvKt9Q&app_id=KuYppsdXZznpffJsKT24',
      subdomains: '1234',
      minZoom: 0,
      maxZoom: 21,
      attribution: "©2012 Nokia <a href='http://here.net/services/terms' target='_blank'>Terms of use</a>"
    },
    gray_roadmap: { // Nokia Day Gray
      url: 'https://{s}.maps.nlp.nokia.com/maptile/2.1/maptile/newest/normal.day.grey/{z}/{x}/{y}/256/png8?lg=eng&token=A7tBPacePg9Mj_zghvKt9Q&app_id=KuYppsdXZznpffJsKT24',
      subdomains: '1234',
      minZoom: 0,
      maxZoom: 21,
      attribution: "©2012 Nokia <a href='http://here.net/services/terms' target='_blank'>Terms of use</a>"
    },
    dark_roadmap: { // CartoDB Dark
      url: 'https://cartocdn_{s}.global.ssl.fastly.net/base-dark/{z}/{x}/{y}.png',
      subdomains: 'abcd',
      minZoom: 0,
      maxZoom: 10,
      attribution: ""
    },
    hybrid: { // Nokia Hybrid Day
      url: 'https://{s}.maps.nlp.nokia.com/maptile/2.1/maptile/newest/hybrid.day/{z}/{x}/{y}/256/png8?lg=eng&token=A7tBPacePg9Mj_zghvKt9Q&app_id=KuYppsdXZznpffJsKT24',
      subdomains: '1234',
      minZoom: 0,
      maxZoom: 21,
      attribution: "©2012 Nokia <a href='http://here.net/services/terms' target='_blank'>Terms of use</a>"
    },
    terrain: { // Nokia Terrain Day
      url: 'https://{s}.maps.nlp.nokia.com/maptile/2.1/maptile/newest/terrain.day/{z}/{x}/{y}/256/png8?lg=eng&token=A7tBPacePg9Mj_zghvKt9Q&app_id=KuYppsdXZznpffJsKT24',
      subdomains: '1234',
      minZoom: 0,
      maxZoom: 21,
      attribution: "©2012 Nokia <a href='http://here.net/services/terms' target='_blank'>Terms of use</a>"
    },
    satellite: { // Nokia Satellite Day
      url: 'https://{s}.maps.nlp.nokia.com/maptile/2.1/maptile/newest/satellite.day/{z}/{x}/{y}/256/png8?lg=eng&token=A7tBPacePg9Mj_zghvKt9Q&app_id=KuYppsdXZznpffJsKT24',
      subdomains: '1234',
      minZoom: 0,
      maxZoom: 21,
      attribution: "©2012 Nokia <a href='http://here.net/services/terms' target='_blank'>Terms of use</a>"
    }
  };

  var LeafLetGmapsTiledLayerView = L.TileLayer.extend({
    initialize: function(layerModel, leafletMap) {
      var substitute = substitutes[layerModel.get('base_type')];
      L.TileLayer.prototype.initialize.call(this, substitute.url, {
        tms:          false,
        attribution:  substitute.attribution,
        minZoom:      substitute.minZoom,
        maxZoom:      substitute.maxZoom,
        subdomains:   substitute.subdomains,
        errorTileUrl: '',
        opacity:      1
      });
      cdb.geo.LeafLetLayerView.call(this, layerModel, this, leafletMap);
    }

  });

  _.extend(LeafLetGmapsTiledLayerView.prototype, cdb.geo.LeafLetLayerView.prototype, {

    _modelUpdated: function() {
      throw new Error("A GMaps baselayer should never be updated");
    }

  });

  cdb.geo.LeafLetGmapsTiledLayerView = LeafLetGmapsTiledLayerView;

})();
