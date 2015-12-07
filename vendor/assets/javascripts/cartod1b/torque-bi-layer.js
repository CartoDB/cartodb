
var MAX_CATEGORIES = 6;
var DUMMY_SQL = "select 0 as dummy, 'SRID=3857;POINT(0 0)'::geometry as the_geom_webmercator";
var DUMMY_CARTOCSS= [
    'Map {',
    '-torque-time-attribute: "dummy";',
    '-torque-aggregation-function: "count(1)";',
    '-torque-frame-count: 1;',
    '-torque-animation-duration: 15;',
    '-torque-resolution: 1',
    '}',
    '#layer {',
    '  marker-width: 1;',
    '}'
].join('\n');

var MAX_POINT_RENDERER_POINTS = 300;

/**
 * this is a special cartodb layer that replaces the regular torque layer cartodb.js generates when a torque layer is created.
 * It basically sets a new renderer and a new provider:
 *
 * - provider: the data layout is special so the provider needs to know how to deal with it. The torque tile format is also different, instead of using a time based cube it uses a multivariable one. The provider also has some methods to extract information from the tile data like histograms and so on. It also allows to filter data. The provider is in torque repository.
 * - the renderer: is a regular torque renderer but knows how to render multivariable format. The provider is in cartocss.js file
 */
var BITorqueLayer = cartodb.geo.LeafletTorqueLayer.extend({

  initialize: function(layerModel, leafletMap) {
    this.options.provider = 'filterable_sql_api';
    this.options.renderer = 'pixel';
    this.options.valueDataType = Float32Array;
    this.options.fields = layerModel.get('fields');
    this.options.overview_tables = layerModel.get('overview_tables');
    this.options.sql_api_template = layerModel.get('sql_api_template');
    this.options.max_point_renderer_points =  layerModel.get('max_point_renderer_points') || MAX_POINT_RENDERER_POINTS;
    layerModel.set('sql', DUMMY_SQL);
    layerModel.set('cartocss', DUMMY_CARTOCSS);
    layerModel.set('table_name', this.options.overview_tables[0]);
    this.buildFieldMapping();
    this._filters = {}

    cartodb.geo.LeafletTorqueLayer.prototype.initialize.call(this, layerModel, leafletMap);

    var updateWidgets = cartodb._.debounce(this._updateWidgets.bind(this), 500);
    this.bind('tileLoaded', updateWidgets);
    this.bind('tileRemoved', updateWidgets);
    this.bind('tileLoaded', cartodb._.debounce(this._checkRenderer.bind(this), 50));
    this._bindFilters();
    this._bindUpdates();
    this._bindInteraction();

    this.selectedPixel = null;
    this.highlightedPixel = null;
    this.options.renderer = null;

    this.styledColumn = null;

  },

  // check if the number of points is high to use the best renderer for them
  _checkRenderer: function() {
    // get the ammount of tiles loaded, don't take any decision until most of them are loaded
    var tilesLoaded = Object.keys(this._tiles).length
    if (tilesLoaded > 0) {
      var p = this.pointCount();
      var percent = Object.keys(this._tilesLoading).length/tilesLoaded;
      if (p > this.options.max_point_renderer_points) {
        this.switchRenderer('pixel');
      } else if(percent < 0.7) {
        this.switchRenderer('point');
      }
    }
  },

  // style using the first styled one, if not, use the default style
  applyStyles: function(c, active) {
     _.each(this.fields, function(f) {
        f.styled = f.name === c ? active: false;
     })
     var toStyle = _.find(this.fields, function(f) {
       return f.styled;
     })
     if (toStyle) {
       this.styledColumn = toStyle.name;
       this.styleByColumn(toStyle.name);
     } else {
       this.styledColumn = null;
       this.styleByColumn(null);
     }
  },

  _bindUpdates: function() {
    var self = this;
    // replace _fetch
    this.model.widgets.each(function(w) {
      if (w.get('type') === 'aggregation') {
        w.bind('applyCategoryColors', function() {
          self.applyStyles(w.get('column'), true)
        });
        w.bind('cancelCategoryColors', function() {
          self.applyStyles(w.get('column'), false)
        });
        //
        // hack to avoid setting url to range model
        w.rangeModel.setUrl = function() {}
        w._fetch = function(callback) {
          w.trigger('loading');
          self.getCategoriesForVisibleRegion(w.get('column'), function(d) {
            // merge categories in the tile
            d = d || []
            var tile_categories = w.get('tile_categories')
            if (tile_categories) {
              tile_categories.slice(0, MAX_CATEGORIES).forEach(function(cat) {
                var cat_entry = _.find(d, function(c) {
                  return String(c.category) == cat.category;
                });
                if (!cat_entry) {
                  d.push(cat);
                }
              });
            }

            var serverAttrs = w.parse({
              categories: d.slice(0, MAX_CATEGORIES),
              max: d.length ? d[0].value: 0,
              min: d.length ? _.last(d).value: 0,
              categoriesCount: d.length
            });
            if (!w.set(serverAttrs)) return false;
            callback && callback();
            w.trigger('sync');
            self.styleByColumn(self.styledColumn);
          })
        }
        // replace search
        w.search.fetch = function() {
          this.trigger("loading", this);
          self.provider.categorySearch(w.get('column'), this.get('q'), function(results) {
             var payload = {
                type: "aggregation",
                categories: results
             }
             var serverAttrs = this.parse(payload);
             if (! this.set(serverAttrs)) return false;
             this.trigger('sync');
          }.bind(w.search));
        }

      } else if (w.get('type') === 'formula') {
        w._fetch = function(callback) {
          w.trigger('loading');
          self.getAggregationForVisibleRegion(w.get('column'), w.get('operation'), true, function(data) {
            var serverAttrs = w.parse(data);
            if (!w.set(serverAttrs)) return false;
            w.trigger('sync');
          });
        }
        w._onChangeBinds()
      } else {
        w.bind('histogramSizes', function() {
          self.applyStyles(w.get('column'), true);
        });
        w.bind('cancelHistogramSizes', function() {
          self.applyStyles(w.get('column'), false);
        });
        var fn = self.getHistogramForDataset.bind(self);
        w._fetch = function(callback) {
           var start, end, bins, own_filter = false;;
           if (_.isNumber(this.get('start'))) {
             start = this.get('start');
           }
           if (_.isNumber(this.get('end'))) {
             end = this.get('end');
           }
           if (_.isNumber(this.get('bins'))) {
             bins = this.get('bins')
           }
           if (_.isNumber(this.get('own_filter'))) {
             own_filter = true;
           }

           w.trigger('loading');
           fn(w.get('column'), start, end, bins, own_filter, function(data) {
             //histogram fails with 0 buckets
             var a = { bin_width: 0, bins_count: 1, bins_start: 0, bins: [{start: 0, end: 0, freq: 0}], nulls: 0 }
             if (data && data.length) {
                a = {
                    bin_width: data[0].end - data[0].start,
                    bins_count: bins === undefined ? d3.max(data, function(f) { return f.bin }): bins,
                    bins_start: data[0].start,
                    bins: data,
                    nulls: 0
               };
               var freqs = data.map(function(f){ return f.freq; })
               data.forEach(function(f) {
                   //f.freq = Math.log(f.freq);
               });
             }
             var serverAttrs = w.parse(a);
             if (!w.set(serverAttrs)) return false;
             callback && callback();
             w.trigger('sync');
             fn = self.getHistogramForVisibleRegion.bind(self);
           });
        }
      }
    })
  },

  _bindFilters: function() {
    // update all the wigets but the caller, does not make any sense to update
    // itself
    var updateWidgets = function(except) {
      this.model.widgets.each(function(w) {
        w.set('tile_categories', []);
        if (w.cid != except.cid) {
          w._fetch();
        }
      });
    }.bind(this);
    this.model.widgets.each(function(w) {
      if (w.get('type') === 'aggregation') {
        w.bind('change:filter', function() {
          var accepted = w.filter.acceptedCategories.pluck('name').map(String);
          var rejected = w.filter.rejectedCategories.pluck('name').map(String);
          if (w.filter.get('rejectAll')) {
            this.filterByCat(w.get('column'), ['¯\\_(ツ)_/¯']);
          } else if (accepted.length) {
            this.filterByCat(w.get('column'), accepted);
          } else if (rejected.length) {
            this.filterByCat(w.get('column'), rejected, true);
          } else {
            this.clearFilter(w.get('column'));
          }
          this._reloadTiles();
          updateWidgets(w);
          w._fetch();
        }, this)
      } else {
        w.bind('change:filter', function() {
          this.filterByRange(w.get('column'), w.filter.get('min'), w.filter.get('max'))
          this._reloadTiles();
          updateWidgets(w);
        }, this)
      }
    }.bind(this));
  },

  _bindInteraction: function() {
    var line = null;
    var getClosestPoint = function (p, size) {
      var values = this.getClosestValuesFor(p.x - size/2, p.y - size/2, size);
      line && this.leafletMap.removeLayer(line)
      if (values.length) {
        function manhatan(a, b) { return Math.abs(p.x - a.x) + Math.abs(p.y - a.y); }
        values.sort(function(a, b) {
            return manhatan(p, b) - manhatan(p, a);
        })
        return values[0];
      }
      return null;
    }.bind(this);

    function mouseover(e) {
      var p = e.containerPoint;
      this.selectedPixel = getClosestPoint(p, 20);
      line && this.leafletMap.removeLayer(line)
      if (this.selectedPixel) {
        var pos = this.selectedPixel;
        // debug line rendering
        var nw = this.leafletMap.containerPointToLatLng([pos.x, pos.y]);
        var se = this.leafletMap.containerPointToLatLng([p.x, p.y]);
        this.selectedPixel.latlng = nw;
        line = L.polyline([nw, se], {color: 'red', weight: 2.0}).addTo(this.leafletMap);
        this.trigger('mouseover');
      } else {
        this.selectedPixel = null;
        this.trigger('mouseout');
      }
    }

    this.bind('infowindow_ready', this._onInfowindowReady, this);

    function click(e) {
      if (!this.selectedPixel) {
        // try to fetch a pixel, some devices don't have hover
        this.selectedPixel = getClosestPoint(e.containerPoint, 20);
      }
      if (this.selectedPixel) {
        var latlng = this.leafletMap.containerPointToLatLng([this.selectedPixel.x, this.selectedPixel.y]);
        this.trigger('featureClick', e, [latlng.lat, latlng.lng], e.layerPoint, {cartodb_id: this.selectedPixel}, 0);
      } else {
        this.infowindow && this.infowindow._closeInfowindow();
      }
    }

    this.leafletMap.on('mousemove', mouseover.bind(this));
    this.leafletMap.on('click', click.bind(this));

    var self = this;
    this.model.fetchAttributes = function(layer, featureID, callback) {
      var t = self.getTilePosForPixel(featureID.x, featureID.y);
      if (t) {
        self.provider.getDataForTorquePixel(t.tile, t.x, t.y, 10, 2, true, function(data) {
          callback({ pixel_list: data })
        });
      }
    }
  },

  _onInfowindowClickPrev: function(e) {
    e && e.preventDefault();
    e && e.stopPropagation();

    var infowindow = cdb.$(this).parents('.js-cdb-infowindow');
    var $navigation = infowindow.find('.js-cdb-infowindow-navigation');
    var $pages = infowindow.find('.js-cdb-infowindow-pages');
    var $currentPage = infowindow.find('.js-cdb-infowindow-current-page');
    var page = +$navigation.attr('data-page');

    if (page - 1 > 0) {
      page--;
      $pages.find('ul').hide();
      $pages.find('ul:nth-child(' + page + ')').show();
      $currentPage.text(page);
      $navigation.attr('data-page', page);
    }
  },

  _onInfowindowClickNext: function(e) {
    e && e.preventDefault();
    e && e.stopPropagation();

    var infowindow = cdb.$(this).parents('.js-cdb-infowindow');

    var $navigation = infowindow.find('.js-cdb-infowindow-navigation');
    var $pages = infowindow.find('.js-cdb-infowindow-pages');
    var $currentPage = infowindow.find('.js-cdb-infowindow-current-page');
    var page = +$navigation.attr('data-page');
    var pageCount = +$navigation.attr('data-page-count');

    if (page + 1 <= pageCount) {
      page++;
      $pages.find('ul').hide();
      $pages.find('ul:nth-child(' + page + ')').show();
      $currentPage.text(page);
      $navigation.attr('data-page', page);
    }
  },

  _onInfowindowReady: function(infowindow) {
    infowindow.$el.find('.js-cdb-infowindow-prev').on('click', this._onInfowindowClickPrev);
    infowindow.$el.find('.js-cdb-infowindow-next').on('click', this._onInfowindowClickNext);
    this.infowindow = infowindow;
  },

  _updateWidgets: function() {

    var bb = this.leafletMap.getBounds()
    var bbox = [bb.getWest(), bb.getSouth(), bb.getEast(), bb.getNorth()];
    var zoom = this.leafletMap.getZoom();

    this.model.widgets.each(function(w) {
      if (w.get('type') === 'aggregation') {
        this.getHistogramCat(w.get('column'), function(err, hist) {
          w.set('tile_categories', _.pairs(hist).map(function(f) { return { category: String(f[0]), value: f[1] } }));
          //w.setCategories()
        });
      } else {
        /*this.getHistogramForVisibleRegion(w.get('column'), function(data) {
          w.setBins(data);
        })*/
        if ( w.get('bins')) {
          this.getHistogram(w.get('column'), w.get('start'), w.get('end'), w.get('bins'), function(err, hist) {
            console.log(hist);
            if (hist.length) {
              // merge bins
              for (var i = 0; i < hist.length; ++i) {
                var b = w._data.find({ bin: hist[i].bin })
                if (b) {
                  console.log("freq ->", i, b.get('freq'), hist[i].freq);
                  b.set('freq', hist[i].freq);
                }
                w.setBins(w._data.toJSON());
              }
            }
          });
        }
      }
    }.bind(this));
  },

  buildFieldMapping: function() {
    // map to
    this.fields = {}
    var f = this.options.fields;
    for (var i = 0; i < f.length; ++i) {
      this.fields[f[i].name] = f[i]
      f[i].index = i;
    }
  },

  // histogram for real columns
  getHistogram: function(attr, start, end, bins, callback) {
    var values = this.getValues(this.fields[attr].index)
    var data = new Uint32Array(bins); // initizlied to 0
    for (var i = 0; i < values.length; ++i) {
      var v = values[i]
      var bin = Math.min(bins, Math.floor(bins* (v - start) / (end - start)))
      data[bin] += 1;
    }

    // transform to internal histogram format
    var hist = []
    var bw = (end - start)/bins;
    for (var i = 0; i < data.length; ++i) {
      var b = data[i]
      if (b) {
        hist.push({
          bin: i,
          freq: b,
          start: i * bw,
          end: (i + 1) * bw
        })
      }
    }
    callback(null, hist);
  },

  // histogram for category columns
  getHistogramCat: function(attr, callback) {
    var values = this.getValues(this.fields[attr].index)
    var hist = {}
    for (var i = 0; i < values.length; ++i) {
      var c = values[i];
      //TODO: check why returns undefined
      if (c !== undefined) {
        hist[c] = hist[c] ? hist[c] + 1: 1;
      }
    }

    callback(null, hist);
  },

  // styles the map for the column
  styleByColumn: function(column) {
    var css, idx;
    if (column) {
      idx = this.fields[column].index;
      css = this.getCartoCSSForAttribute(column, this.options.renderer);
    } else {
      css = MiniPecan.density();
      idx = 0;
    }
    this.model.set('cartocss', css);
    this.setStep(idx);
  },

  switchRenderer: function(rendererType) {
    if (this.options.renderer !== rendererType) {
      this.options.renderer = rendererType;
      if (rendererType === 'point') {
        this.renderer = new BIRenderer(this.getCanvas(), this.options);
      } else {
        this.renderer = new BIPixelRenderer(this.getCanvas(), this.options);
      }
      this.styleByColumn(this.styledColumn);
      this.render();
    }
  },

  getWidgetByColumn: function(attr) {
    return this.model.widgets.find(function(f) {
      return f.get('column') === attr;
    })
  },

  getCartoCSSForAttribute: function(attr, renderer) {
    var w = this.getWidgetByColumn(attr);
    if (w.get('type') === 'aggregation') {
      var cats = w._data.pluck('name');
      var colors = w._data.pluck('color');
      return MiniPecan.category(cats.map(String), colors);
    } else {
      var values = this.getValues(this.fields[attr].index)
      values.sort(function(a, b) {
        return a - b;
      });
      if (renderer === 'pixel') {
        return MiniPecan.density(values)
      } else {
        return MiniPecan.bubbleBucket(values);
      }
    }
  },

  _modelUpdated: function(model) {
    var changed = this.model.changedAttributes();
    if(changed === false) return;
    changed.cartocss && this.setCartoCSS(this.model.get('cartocss'));
  },

  setFilters: function() {
    this.provider.setFilters(this._filters);
    this._reloadTiles();
    return this;
  },

  filterByRange: function(variableName, start, end) {
    this._filters[variableName] = {type: 'range',  range: {start: start, end: end} }
    this._filtersChanged()
    this.fire('dataUpdate')
    return this
  },

  filterByCat: function(variableName, categories, exclusive) {
    this._filters[variableName] = {type: 'cat',  categories: categories, exclusive: !!exclusive };
    this._filtersChanged()
    return this
  },

  clearFilter: function(name){
    if(name) {
      delete this._filters[name]
    }
    else {
      this._filters = {}
    }
    this._filtersChanged()
    return this
  },

  _filtersChanged:function(){
    this.provider._filters = this._filters;
    this._clearTileCaches()
    this._render()
  },

  getHistogramForDataset: function(varName, start, end, bins, own_filter, callback) {
    var tiles = [{x: 0, y: 0, z: 0}];
    this.provider.getHistogramForTiles(varName, start, end, bins, tiles, own_filter, callback);
  },

  getAggregationForVisibleRegion: function(varName, agg, own_filter, callback) {
    var tiles = this.visibleTiles();
    this.provider.getAggregationForTiles(varName, agg, tiles, own_filter, callback);
  },

  getHistogramForVisibleRegion: function(varName, start, end, bins, own_filter, callback) {
    var tiles = this.visibleTiles();
    this.provider.getHistogramForTiles(varName, start, end, bins, tiles, own_filter, callback);
  },

  getCategoriesForVisibleRegion: function(varName, callback){
    var tiles = this.visibleTiles();
    this.provider.getCategoriesForTiles(varName, tiles, callback);
  },

  // override default getValues to be able to handle categories
  getValues: function(step) {
    var values = [];
    var idx = 0;
    var mappedValues = [];
    step = step === undefined ? this.key: step;
    var t, tile;
    for(t in this._tiles) {
      tile = this._tiles[t];
      if (tile) {
        this.renderer.getValues(tile, step, values);
        // map the categories
        var mapping = tile.categories[step];
        if (mapping) {
          for (var i = idx; i <= values.length - idx; ++i) {
            mappedValues.push(mapping[values[i]]);
          }
          idx = values.length;
        }
      }
    }
    if (mappedValues.length) {
      return mappedValues;
    }
    return values;
  }

});

// replace the default one with custom one so when cartodb.js instances a torque layer uses this one
cartodb.geo.LeafletMapView.layerTypeMap['torque'] = BITorqueLayer;
