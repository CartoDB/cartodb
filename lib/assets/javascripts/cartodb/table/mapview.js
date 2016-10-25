/**
 * map tab shown in cartodb admin
 */

var SearchInput = Backbone.View.extend({
  query: "",
  _items: {},
  _clickedOnListItem : false,
  _hilitedItemIndex: 0,
  _hilitedItemKey: null,
  _results_exist: false,
  _numMaxResults: 7,
  events: {
    "keydown" : "_onKeyDown",
    "keyup" : "_onKeyUp",
    "blur": "_onBlur",
  },

  initialize: function(options) {
    this.map = options.map;
    this.user = options.user;
    this.vis = options.vis;
    if (options.maxResults !== undefined) {
      this._numMaxResults = options.maxResults;
    }
  },

  _onQueryChanged: function() {
    if (this.query == "") {
      this._resetSearch();
    } else {
      this._doDatasetSearch();
    }
  },

  _doDatasetSearch: function() {
    var self = this;

    if (this.user.featureEnabled('bbg_new_search')) {
      $.ajax({
        url: window.location.origin + '/search-srv-ac',
        type: 'POST',
        dataType: 'text',
        data: JSON.stringify({
          "text": this.query,
          "params": {
            "postgres-dev": {
              "username": self.user.get('username')
            }
          }
        })
      })
      .done(function(response) {
        self._setItems(JSON.parse(response));
      })
      .fail(function(err) {});
    }
    else {
      $.ajax({
        url: "../../api/v1/viz/search/?q=" + this.query
      })
      .done(function(response) {
        var results = [];
        for (var idx in response.visualizations) {
          var result = response.visualizations[idx];
          results.push({
            "dataset": result.name,
            "id": result.id,
            "is_dataset": true,
            "data": {
              "tags": result.tags
            }
          });
        }
        self._setItems({visualizations: results});
      })
      .fail(function(err) {});
    }
  },

  _renderListHeader: function(name) {
    return (typeof name === 'undefined' ? '' : ('<p>' + name + '</p>')) + '<ul class="search-result-list">';
  },

  _renderListItem: function(service, index, itemMatch, selected) {
    var name = itemMatch.match;
    var tags = itemMatch.dataset;
    if (!this.user.featureEnabled('bbg_new_search')) {
      name = itemMatch.dataset;
      tags = itemMatch.match;
    }
    // TODO: Change class names
    return ('<li class="search-result-row' + (selected ? ' selected ' : '') + '" data-index="' + index + '" data-key="' + service + '">' +
              '<div class="name">' + name + '</div>' +
              '<div class="tags">' + tags + '</div>' +
            '</li>');
  },

  _renderListFooter: function() {
    return '</ul>';
  },

  _renderNoResult: function() {
    return (this._renderListHeader() +
            '<li class="search-result-row no-result"><div class="name">No results found...</div><div class="tags"></div></li>' +
            this._renderListFooter());
  },

  _isDatasetLocal: function(name, callback) {
    $.ajax({
      url: "../../api/v1/viz/locality/?table=" + name
    })
    .done(function(response) {
      try {
        callback(response != null && response.type === 'table' && response.name === name);
      }
      catch(err) {}
    })
    .fail(function() {});
  },

  _onItemClicked: function(item) {
    var self = this;

    if (!self.user.canAddLayerTo(self.map)) {
      var dlg = new cdb.editor.LimitsReachView({
        clean_on_hide: true,
        enter_to_confirm: true,
        user: self.user
      });
      dlg.appendToBody();
      return;
    }

    var apply_filter_if_entity = function(layer) {
      self.map.layers.unbind('add', apply_filter_if_entity);

      if (!item.is_dataset && typeof item.matched === 'string') {
        var pane = table.menu.getPane(layer.cid);

        var set_filter = function(column) {
          var view = pane.filters._filterViews[column.cid];
          if (typeof view === 'undefined') {
            return;
          }
          pane.filters.filters.unbind('change', set_filter);
          if (view.model.get('list_view')) {
            view._toggleSwitch();
          }
          view._setFilter(item.data[item.matched]);
          pane._requestFiltersTabRefresh();
        };

        // Comment the following line if you don't want to nuke existing filters.
        pane.filters.filters._reset();
        pane.filters.filters.bind('change', set_filter);
        pane._applyFilter(item.matched);
      }
    };

    self._isDatasetLocal(item.dataset, function(is_local) {
      self.map.layers.bind('add', apply_filter_if_entity);
      if (is_local) {
        self.map.addCartodbLayerFromTable(item.dataset, self.user.get('username'), {
          vis: self.vis,
          success: function() {
            self.map.layers.saveLayers();
            table.menu.trigger('show-panel');
          },
          error: function() {
            self.map.layers.unbind('add', apply_filter_if_entity);
          }
        });
      }
      else {
        var d = {
          create_vis: false,
          type: 'remote',
          value: item.dataset,
          remote_visualization_id: item.id,
          size: undefined
        };
        table.backgroundPollingModel.bind('importCompleted', function importCompletedCallback() {
          table.backgroundPollingModel.unbind('importCompleted', importCompletedCallback);
          table.menu.trigger('show-panel');
        }, self);
        cdb.god.trigger('importByUploadData', d, self);
      }

    });
  },

  _onKeyDown: function(e) {
    switch (e.keyCode) {
      case 13: // enter
        e.stopPropagation();
        if (this._results_exist && $('.search-result-dropdown').length) {
          this._onItemClicked(this._items[this._hilitedItemKey][this._hilitedItemIndex]);
          this._resetSearch();
        }
        return;
      case 27: // esc
        e.stopPropagation();
        this._resetSearch();
        return;
      case 40: // down
        e.stopPropagation();
        e.preventDefault();
        this._changeHilitedItem(1);
        return;
      case 38: // up
        e.stopPropagation();
        e.preventDefault();
        this._changeHilitedItem(-1);
        return;
    }
  },

  _onKeyUp: function(e) {
    var keyCode = e.keyCode;
    if (keyCode == 13 || keyCode == 27 || keyCode == 40 || keyCode == 38) {
      return;
    }

    var query = this.$el.val();
    if (query != this.query) {
      this.query = query;
      this._onQueryChanged({query: this.query});
    }
  },

  _onBlur: function(e) {
    if (!this._clickedOnListItem) {
      this._resetSearch();
    }
  },

  _changeHilitedItem: function(change) {
    var keys = Object.keys(this._items)
    var keyIndex = keys.indexOf(this._hilitedItemKey);
    keyIndex = keyIndex === -1 ? 0 : keyIndex;
    var itemIndex = this._hilitedItemIndex;
    while (change != 0) {
      if (change < 0 && Math.abs(change) > itemIndex) {
        change += itemIndex;
        keyIndex -= 1;
        if (keyIndex < 0) {
          keyIndex = keys.length - 1;
        }
        itemIndex = this._items[keys[keyIndex]].length;
      }
      else if (change > 0 && (itemIndex + change) >= this._items[keys[keyIndex]].length) {
        change -= (this._items[keys[keyIndex]].length - itemIndex);
        keyIndex += 1;
        if (keyIndex >= keys.length) {
          keyIndex = 0;
        }
        itemIndex = 0;
      }
      else {
        itemIndex += change;
        change = 0;
      }
    }

    var selectedRow = $(".search-result-row.selected");
    if (selectedRow.length > 0) {
      $(selectedRow[0]).removeClass("selected");
    }

    this._hilitedItemIndex = itemIndex;
    this._hilitedItemKey = keys[keyIndex];
    $(".search-result-row[data-index='" + itemIndex + "'][data-key='" + keys[keyIndex] + "']").addClass("selected");
  },

  _resetSearch: function() {
    $('.search-result-dropdown').remove();
    this._hilitedItemIndex = 0;
    this._hilitedItemKey = Object.keys(this._items)[0];
    this.query = "";
    this.$el.val('');
  },

  /*
   * Determine if the strings contained in array_of_strings are in-order
   * whitespace-delimited substrings of string. We don't care if there is
   * 1 character of whitespace or 1000 in between.
   * If they are, return the string with the matching section highlighted,
   * otherwise return null.
   */
  _highlightMatchIgnoringWhitespaceSpecifics: function(array_of_strings, string) {
    var lstring = string.toLowerCase();
    var startPos = lstring.indexOf(array_of_strings[0]);
    if (startPos == -1) {
      return null;
    }

    var regex = /((?=[\x00-\x7F])\S)+/g;
    var candidate;
    var candidate_offset = startPos;
    var sliced = lstring.slice(startPos);
    while (startPos != -1) {
      // Break up lstring into array of words
      candidate = sliced.match(regex) || [];

      // Iterate through each word
      for (var i = 0; i < array_of_strings.length; i++) {

        if (i >= candidate.length) {
          break;
        }

        // If this is the last item we are just checking for a substring
        else if (i === (array_of_strings.length - 1)) {
          if (candidate[i].indexOf(array_of_strings[i]) != 0) {
            break;
          }
          else {
            // Replace lower case candidate with regular case.
            candidate = string.slice(candidate_offset).match(regex);

            // Figure out match
            var match = candidate.slice(0, i);
            var last = candidate[i].slice(0, array_of_strings[i].length);
            var last_leftover = candidate[i].slice(array_of_strings[i].length);
            var leftover = candidate.slice(i+1);

            // Format the output
            var match_str = (match.length > 0 ? match.join(' ') + ' ' : '') + last;
            var leftover_str = last_leftover + (leftover.length > 0 ? ' ' + leftover.join(' ') : '');
            return string.slice(0, candidate_offset) + '<span class="found-sub">' + match_str + '</span>' + leftover_str;
          }
        }
        // If any word doesn't match, break.
        else if (array_of_strings[i] != candidate[i]) {
          break;
        }
      }
      startPos = sliced.indexOf(array_of_strings[0], 1);
      candidate_offset += startPos;
      sliced = sliced.slice(startPos);
    }

    return null;
  },

  _getItemMatch: function(item, query_array) {
    var data = item.data;
    var match = null;
    var matched_attribute = null;
    var dataset = this._highlightMatchIgnoringWhitespaceSpecifics(query_array, item.dataset) || item.dataset;

    for (var key in data) {
      if (!data.hasOwnProperty(key)) {
        continue;
      }

      if (typeof data[key] === 'string') {
        match = this._highlightMatchIgnoringWhitespaceSpecifics(query_array, data[key]);
        if (match != null) {
          matched_attribute = key;
          break;
        }
      }
      else if (typeof data[key] === 'object' && data[key] != null) {
        for (var idx = 0; idx < data[key].length; idx++) {
          match = this._highlightMatchIgnoringWhitespaceSpecifics(query_array, data[key][idx]);
          if (match != null) {
            // Join array into a comma-delimited string.
            match = data[key].slice(0, idx).concat([match]).concat(data[key].slice(idx + 1)).join(', ');
            break;
          }
        }
        if (match != null) {
          matched_attribute = key;
        }
      }
    }

    if (match === null && !this.user.featureEnabled('bbg_new_search')) {
      match = data.tags === null ? '' : data.tags.join(', ');
      matched_attribute = 'tags';
    }

    return {
      match: match,
      attribute: matched_attribute,
      dataset: dataset
    };
  },

  _haveSeenMatch(itemMatch, record) {
    if (typeof record[itemMatch.dataset] === 'undefined') {
      record[itemMatch.dataset] = {};
    }
    if (typeof record[itemMatch.dataset][itemMatch.attribute] === 'undefined') {
      record[itemMatch.dataset][itemMatch.attribute] = [];
    }
    if (record[itemMatch.dataset][itemMatch.attribute].indexOf(itemMatch.match) != -1) {
      return true;
    }
    record[itemMatch.dataset][itemMatch.attribute].push(itemMatch.match);
    return false;
  },

  _setItems: function(items) {
    var self = this;
    $('.search-result-dropdown').remove();
    self._items = {};
    self._results_exist = false;

    var position = this._getPosition();
    var popupHtml = '<div class="search-result-dropdown" style="position:absolute;top:' + position.top + 'px;left:' + position.left + 'px;z-index:' + position.zIndex + ';">' + 
      '<div>' + 
      '</div>' +
    '<div>';
    var keysLength = 0, itemMatch, unique_items, seen_matches;
    var query_array = this.query.toLowerCase().match(/\S+/g) || [];

    // Iterate over each search service's results
    for (var key in items) {
      if (!items.hasOwnProperty(key) || items[key].length === 0) {
        continue;
      }
      unique_items = [];
      seen_matches = {};
      if (this.user.featureEnabled('bbg_new_search')) {
        popupHtml += this._renderListHeader(key);
      }
      else {
        popupHtml += this._renderListHeader();
      }
      keysLength = Object.keys(self._items).length

      // Iterate over each result in the list
      for (var i = 0; i < items[key].length; i++) {

        // Make sure we haven't seen this match before
        itemMatch = this._getItemMatch(items[key][i], query_array);
        if (itemMatch.attribute === null || this._haveSeenMatch(itemMatch, seen_matches)) {
          continue;
        }

        // Render and store
        items[key][i].matched = itemMatch.attribute;
        popupHtml += this._renderListItem(key, unique_items.length, itemMatch, keysLength === 0 && i === 0);
        unique_items.push(items[key][i]);
      }

      // Set the list of unique items as the service result
      self._items[key] = unique_items;
      popupHtml += this._renderListFooter();
    }

    // If any service returned results that match, we have results.
    if (Object.keys(self._items).length > 0) {
      self._results_exist = true;
    }

    // Reset highlighted indexes
    self._hilitedItemIndex = 0;
    self._hilitedItemKey = Object.keys(this._items)[0] || null;

    if (!self._results_exist) {
      popupHtml += this._renderNoResult();
    }
    popupHtml += '</div></div>';
    $(popupHtml).appendTo("body");

    // Set up event listeners
    if (self._results_exist) {
      $('.search-result-row').
      mouseover(function() {
        self._hilitedItemIndex = $(this).data("index");
        self._hilitedItemKey = $(this).data("key");
      }).
      mouseleave(function() {
        self._hilitedItemIndex = 0;
        self._hilitedItemKey = Object.keys(self._items)[0];
      }).
      mousedown(function() {
        self._clickedOnListItem = true;
      }).
      mouseup(function() {
        self._clickedOnListItem = false;
      }).
      click(function() {
        self._onItemClicked(self._items[self._hilitedItemKey][self._hilitedItemIndex]);
        self._resetSearch();
      });

      $(".search-result-dropdown").
      mouseover(function() {
        $(this).find(".selected").removeClass("selected");
      }).
      mouseleave(function() {
        if (self._results_exist) {
          var rows = $(this).find(".search-result-row");
          if (rows.length > 0) {
            $(rows[0]).addClass("selected");
          }
        }
      });
    }
  },
    
  _getPosition: function() {
    return {
      left: this.$el.offset().left,
      top: this.$el.offset().top + this.$el.height() + 5,
      width: this.$el.innerWidth(),
      height: 300,
      zIndex: 1002
    }
  }
});

/**
 * inside the UI all the cartodb layers should be shown merged.
 * the problem is that the editor needs the layers separated to work
 * with them so this class transform from multiple cartodb layers
 * and create only a view to represent all merged in a single layer group
 */
function GrouperLayerMapView(mapViewClass) {

  return {

    initialize: function() {
      this.groupLayer = null;
      this.activeLayerModel = null;
      mapViewClass.prototype.initialize.call(this);
    },

    _removeLayers: function() {
      var self = this;
      _.each(this.map.layers.getLayersByType('CartoDB'), function(layer) {
        layer.unbind(null, null, self);
      });
      cdb.geo.MapView.prototype._removeLayers.call(this);

      if(this.groupLayer) {
        this.groupLayer.model.unbind();
      }
      this.groupLayer = null;
    },

    _removeLayer: function(layer) {
      // if the layer is in layergroup
      if(layer.cid in this.layers) {
        if(this.layers[layer.cid] === this.groupLayer) {
          this._updateLayerDefinition(layer);
          layer.unbind(null, null, this);
          delete this.layers[layer.cid];
          this.trigger('removeLayerView', this);
        } else {
          this.trigger('removeLayerView', this);
          cdb.geo.MapView.prototype._removeLayer.call(this, layer);
        }
      } else {
        cdb.log.info("removing non existing layer");
      }
    },

    setActiveLayer: function(layer) {
      this.activeLayerModel = layer;
      this._setInteraction();
    },

    disableInteraction: function() {
      if (this.groupLayer) {
        this.groupLayer._clearInteraction();
      }
    },

    enableInteraction: function() {
      this._setInteraction();
    },

    // set interaction only for the active layer
    _setInteraction: function() {
      if(!this.groupLayer) return;
      if(this.activeLayerModel) {
        this.groupLayer._clearInteraction();
        var idx = this.map.layers.getLayerDefIndex(this.activeLayerModel);
        // when layer is not found idx == -1 so the interaction is
        // disabled for all the layers
        for(var i = 0; i < this.groupLayer.getLayerCount(); ++i) {
          this.groupLayer.setInteraction(i, i == idx);
        }
      }
    },

    _updateLayerDefinition: function(layer) {
      if(!layer) throw "layer must be a valid layer (not null)";
      if(this.groupLayer) {
        if(this.map.layers.getLayersByType('CartoDB').length === 0) {
          this.groupLayer.remove();
          this.groupLayer = null;
        } else {
          var def = this.map.layers.getLayerDef();
          this.groupLayer.setLayerDefinition(def);
          this._setInteraction();
        }
      }
    },

    /**
     * when merged layers raises an error this function send the error to the
     * layer that actually caused it
     */
    _routeErrors: function(errors) {
      var styleRegExp = /style(\d+)/;
      var postgresExp = /layer(\d+):/i;
      var generalPostgresExp = /PSQL error/i;
      var syntaxErrorExp = /syntax error/i;
      var webMercatorErrorExp = /"the_geom_webmercator" does not exist/i;
      var tilerError = /Error:/i;
      var layers = this.map.layers.where({ visible: true, type: 'CartoDB' });
      for(var i in errors) {
        var err = errors[i];
        // filter empty errors
        if(err && err.length) {
          var match = styleRegExp.exec(err);
          if(match) {
            var layerIndex = parseInt(match[1], 10);
            layers[layerIndex].trigger('parseError', [err]);
          } else {
            var match = postgresExp.exec(err);
            if(match) {
              var layerIndex = parseInt(match[1], 10);
              if (webMercatorErrorExp.exec(err)) {
                err = _t("you should select the_geom_webmercator column");
                layers[layerIndex].trigger('sqlNoMercator', [err]);
              } else {
                layers[layerIndex].trigger('sqlParseError', [err]);
              }
            } else if(generalPostgresExp.exec(err) || syntaxErrorExp.exec(err) || tilerError.exec(err)) {
              var error = 'sqlError';
              if (webMercatorErrorExp.exec(err)) {
                error = 'sqlNoMercator';
                err = _t("you should select the_geom_webmercator column");
              }
              _.each(layers, function(lyr) { lyr.trigger(error, err); });
            } else {
              _.each(layers, function(lyr) { lyr.trigger('error', err); });
            }
          }
        }
      }
    },

    _routeSignal: function(signal) {
      var self = this;
      return function() {
        var layers = self.map.layers.where({ visible: true, type: 'CartoDB' });
        var args = [signal].concat(arguments);
        _.each(layers, function(lyr) { lyr.trigger.apply(lyr, args); });
      };
    },

    _addLayer: function(layer, layers, opts) {

      // create group layer to acumulate cartodb layers
      if (layer.get('type') === 'CartoDB') {
        var self = this;
        if(!this.groupLayer) {
          // create model
          var m = new cdb.geo.CartoDBGroupLayer(
            _.extend(layer.toLayerGroup(), {
              user_name: this.options.user.get("username"),
              maps_api_template: cdb.config.get('maps_api_template'),
              no_cdn: false,
              force_cors: true // use CORS to control error management in a better way
            })
          );

          var layer_view = mapViewClass.prototype._addLayer.call(this, m, layers, _.extend({}, opts, { silent: true }));
          delete this.layers[m.cid];
          this.layers[layer.cid] = layer_view;
          this.groupLayer = layer_view;
          m.bind('error', this._routeErrors, this);
          m.bind('tileOk', this._routeSignal('tileOk'), this);
          this.trigger('newLayerView', layer_view, layer, this);
        } else {
          this.layers[layer.cid] = this.groupLayer;
          this._updateLayerDefinition(layer);
          this.trigger('newLayerView', this.groupLayer, layer, this);
        }

        layer.bind('change:tile_style change:query change:query_wrapper change:interactivity change:visible', this._updateLayerDefinition, this);
        this._addLayerToMap(this.groupLayer);
        delete this.layers[this.groupLayer.model.cid];
      } else {
        mapViewClass.prototype._addLayer.call(this, layer, layers, opts);
      }
    }
  };
}

cdb.admin.LeafletMapView = cdb.geo.LeafletMapView.extend(GrouperLayerMapView(cdb.geo.LeafletMapView));

if (typeof(google) !== 'undefined') {
  cdb.admin.GoogleMapsMapView = cdb.geo.GoogleMapsMapView.extend(GrouperLayerMapView(cdb.geo.GoogleMapsMapView));
}

cdb.admin.MapTab = cdb.core.View.extend({

  events: {
    'click .toggle_slides.button': '_toggleSlides',
    'click .add_overlay.button':   'killEvent',
    'click .canvas_setup.button':  'killEvent',
    'click .sqlview .clearview':   '_clearView',
    'click .sqlview .export_query':'_tableFromQuery',
    'click .sqlview .dismiss':'_dismissSQLView',
    'keydown':'_onKeyDown'
  },

  _TEXTS: {
    no_interaction_warn: _t("Map interaction is disabled, select cartodb_id to enable it")
  },

  className: 'map',
  animation_time: 300,

  export_sizes: {
    'small': [500, 300],
    'medium': [650, 450],
    'large': [800, 600]
  },

  default_export_size: 'small',
  export_size: 'small',
  last_export_size: 'small',

  export_form_data: [
    {
      name: 'Destination',
      form: {
        'destination': {
          type: 'select',
          value: "AVMM",
          disable_triggering: true,
          extra: ["AVMM", "Local"]
        }
      }
    }, {
      name: 'Size',
      form: {
        'size': {
          type: 'select',
          value: 'Small (500x300)',
          disable_triggering: true,
          extra: ["Small (500x300)", "Medium (650x450)", "Large (800x600)", "Custom"]
        }
      },
    }, {
      name: 'Custom Size',
      form: {
        'width': {
          type: 'simple_number_with_label',
          value: 10, min: 10, max: 1000, inc: 5,
          label: "Width (px)",
          width: 30,
          disable_triggering: true
        }, 'height': {
          type: 'simple_number_with_label',
          value: 10, min: 10, max: 1000, inc: 5,
          width: 30,
          label: "Height (px)",
          disable_triggering: true
        }
      }
    }
  ],

  initialize: function() {

    this.template = this.getTemplate('table/views/maptab');

    this.map  = this.model;
    this.user = this.options.user;
    this.vis  = this.options.vis;
    this.master_vis  = this.options.master_vis;

    this.canvas = new cdb.core.Model({ mode: "desktop" });

    this.map_enabled     = false;
    this.georeferenced   = false;
    this.featureHovered  = null;
    this.activeLayerView = null;
    this.layerDataView   = null;
    this.layerModel      = null;
    this.legends         = [];
    this.overlays        = null;

    this.add_related_model(this.map);
    this.add_related_model(this.canvas);
    this.add_related_model(this.map.layers);

    this._addBindings();

    if (!this.user.featureEnabled("bbg_pro_ui")) {
      this.export_form_data[0].form.destination.value = 'Local';
      this.export_form_data[0].form.destination.extra.splice(0, 1);
    }
  },

  _addBindings: function() {

    // Actions triggered in the right panel
    cdb.god.bind("panel_action", function(action) {
      this._moveInfo(action);
    }, this);

    this.add_related_model(cdb.god);

    this.map.bind('change:provider',       this.switchMapType, this);
    this.map.bind('change:legends',        this._toggleLegends, this);
    this.map.layers.bind('change:visible', this._addLegends, this);
    this.map.layers.bind('change:visible', this._addTimeline, this);
    this.map.layers.bind('change:tile_style', this._addTimeline, this);
    this.map.layers.bind('remove reset',   this._changeLegends, this);
    this.map.layers.bind('remove reset',   this._addTimeline, this);

    this._addLegendBindings();

    _.bindAll(this, 'showNoGeoRefWarning', "_exportImage");

    cdb.god.bind("export_image_clicked", function(e) {
      this._exportImageClick(e);
    }, this);
  },

  _addLegendBindings: function () {
    var self = this;
    this.map.layers.each($.proxy(this._bindLegendChange, this));
    this.map.layers.bind('add', $.proxy(this._bindLegendChange, this));
    this.map.layers.bind('remove', $.proxy(this._unbindLegendChange, this));
    this.map.layers.bind('reset', function (c) {
        if (c) {
          c.each($.proxy(self._unbindLegendChange, self));
        }
    });
  },

  _bindLegendChange: function(l) {
    if (l.legend) {
      l.legend.bind('change:style', $.proxy(this._addLegends, this));

      // unset CSS style on change of any legend attribute other than the style itself
      // (needs to be recalculated)
      l.legend.bind('change:items change:show_title change:title change:template change:type change:visible',
                    $.proxy(this._changeLegends, this));
    }
  },

  _unbindLegendChange: function(l) {
    if (l.legend) {
      l.legend.off('change', $.proxy(this._changeLegends, this));
    }
  },

  _addSearchBar: function() {
    if (this._searchInput) {
      return;
    }
    this._searchInput = new SearchInput({ el: '#search-bar-input', map: this.map, user: this.user, vis: this.vis });
    this._searchInput.$el.focus();
    
    $(".search-bar-browse").click(function(e) {
      e.stopPropagation();
      table.menu._addLayerDialog();
    });
  },

  isMapEnabled: function() {
    return this.map_enabled;
  },

  deactivated: function() {
    if(this.map_enabled) {
      this.clearMap();
    }
  },

  clearMap: function() {

    clearTimeout(this.autoSaveBoundsTimer);

    if (this.mapView) {
      this.mapView.clean();
    }

    if (this.exportBar) {
      this._removeExportBar(false);
    }

    this._removeExportImageView();

    if (this.basemapDropdown)         this.basemapDropdown.clean();

    if (this.zoom) {
      this.zoom.clean();
    }

    if (this.infowindow) {
      this.infowindow.clean();
    }

    if (this.overlays) {
      this.overlays._cleanOverlays();
    }

    this._cleanLegends();
    this.vis.set('legend_style', '');
    this.vis.save();

    if (this.stackedLegend) {
      this.stackedLegend.clean();
    }

    if (this.timeline) {
      this.timeline.clean();
      this.timeline = null;
    }

    if (this.geometryEditor) this.geometryEditor.clean();

    if (this.table) {
      this.table.unbind(null, null, this);
    }

    delete this.mapToolbar;
    delete this.mapView;
    delete this.basemapDropdown;

    delete this.zoom;
    delete this.infowindow;
    delete this.layer_selector;
    delete this.header;
    delete this.share;
    delete this.legends;
    delete this.overlays;
    delete this.legend;
    delete this.stackedLegend;
    delete this.geometryEditor;

    this.map_enabled = false;

    // place the map DOM object again
    this.render();
  },


  /**
   *  Hide the infowindow when a query is applied or cleared
   */
  _hideInfowindow: function() {
    if(this.infowindow) {
      this.infowindow.model.set('visibility', false);
    }
  },


  /**
   * this function is used when the map library is changed. Each map library
   * works in different way and need to recreate all the components again
   */
  switchMapType: function() {

    if (this.map_enabled) {
      this.clearMap();
      this.enableMap();
    }

  },

  _showGMapsDeprecationDialog: function() {
    var dialog = cdb.editor.ViewFactory.createDialogByTemplate('common/dialogs/confirm_gmaps_basemap_to_leaflet_conversion');

    var self = this;
    dialog.ok = function() {
      self.map.set('provider', 'leaflet', { silent: true });
      self.setupMap();
      this.close && this.close();
    };

    dialog.cancel = function() {
      if (self.user.isInsideOrg()) {
        window.location = "/u/" + self.user.get("username") + "/dashboard";
      } else {
        window.location = "/dashboard";
      }
    };

    dialog.appendToBody();
  },

  /**
   * map can't be loaded from the beggining, it needs the DOM to be loaded
   * so we wait until is actually shown to create the mapview and show it
   */
  enableMap: function() {

    this.render();

    var baseLayer = this.map.getBaseLayer();

    // check if this user has google maps enabled. In case not and the provider is google maps
    // show a message
    if ( typeof cdb.admin.GoogleMapsMapView === 'undefined') {
      if (baseLayer && this.map.isProviderGmaps()) {
        this._showGMapsDeprecationDialog();
        return;
      }
    }

    this.setupMap();

    this._addSearchBar();
  },

  setupMap: function() {

    this.$('.tipsy').remove();

    var self = this;

    if (!this.map_enabled) {

      this._addMapView();

      this.clickTimeout = null;

      this._bindMissingClickEvents();

      this.map_enabled = true;

      $(".map")
      .append('<div class="map-options" />')
      .append("<div class='mobile_bkg' />");

      this._addBasemapDropdown();
      this._addInfowindow();
      this._addTooltip();
      this._addLegends();
      this._addOverlays();

      if (!this.$('.sqlview').is(':visible')) {
        this.overlays.setHeaderMessageIsVisible(false);
      }

      this._showPecan();

      //this._showScratchDialog();

      if (this.user.featureEnabled('slides')) {
        this._addSlides();
      };

      var torqueLayer;

      var type = this.vis.get("type");

      if (type !== "table") {

        this.canvas.on("change:mode", this._onChangeCanvasMode, this);

      }

      this.master_vis.on("change:type", function() {
        if (this.master_vis.previous('type') === 'table') {
          // reaload the map to show overlays and other visualization related stuff
          this.switchMapType();
        }
      }, this);

      // HACK
      // wait a little bit to give time to the mapview
      // to estabilize
      this.autoSaveBoundsTimer = setTimeout(function() {
        //self.mapView.setAutoSaveBounds();
        self.mapView.on('dragend zoomend', function() {
          self.mapView._saveLocation();
        });
      }, 1000);

    }

    if (!this.user.featureEnabled("bbg_disabled_shared_empty_dataset")) {
      this.map.layers.bind('add remove', function() {
        self._enableDisableTableMapSwitch();
      }, this);
      self._enableDisableTableMapSwitch();
    }

    if (localStorage.getItem('open-sidepanel')) {
      localStorage.removeItem('open-sidepanel')
      setTimeout(function() {
        table.menu.trigger('show-panel');
      }, 1000);
    }

    $('.leaflet-control-attribution a').click(function(e) {
       e.preventDefault(); 
       window.open(this.href);
   });

  },

  _enableDisableTableMapSwitch: function() {
    var i, numLayers = this.map.layers.length;
    var numVisibleLayers = numLayers;
    var emptyDatasetName = cdb.config.get('shared_empty_dataset_name');

    for (i = 0; i < numLayers; ++i) {
      if (this.map.layers.at(i).get('table_name') === emptyDatasetName) {
        numVisibleLayers--;
        break;
      }
    }
    var links = $(".vis_navigation a");
    if (numVisibleLayers == 1) {
      if (table.workViewActive === "table") {
        $('.vis_navigation a[href$="#/map"]').click();
      }
      links.addClass("disabled");
      links.attr("disabled", "disabled");
      links.css("pointer-events", "none");
    } else {
      links.removeClass("disabled");
      links.removeAttr("disabled");
      links.css("pointer-events", "auto");
    }
  },

  _addMapView: function() {

    var div = this.$('.cartodb-map');

    var mapViewClass = cdb.admin.LeafletMapView;
    if (this.map.get('provider') === 'googlemaps') {
      var mapViewClass = cdb.admin.GoogleMapsMapView;
    }

    this.mapView = new mapViewClass({
      el: div,
      map: this.map,
      user: this.user
    });

    this.mapView.bind('removeLayerView', function(layerView) {
      if (this.layer_selector) this.layer_selector.render();
    }, this);

    this.mapView.bind('newLayerView', function(layerView, model) {
      if(this.activeLayerView && this.activeLayerView.model.id === model.id) {
        this._bindDataLayer(this.activeLayerView, model);

        if (this.layer_selector) {
          this.layer_selector.render();
        }
      }
      this._addTimeline();
    }, this);

    if (this.activeLayerView) {
      this._bindDataLayer(this.activeLayerView, this.activeLayerView.model);
    }

    this.trigger('mapViewReady');

  },

  _addBasemapDropdown: function() {

    if (!this.basemapDropdown) {

      if (this.vis.get("type") !== "table") {
        // TODO: use templates and _t for texts
        var $options = $('<a href="#" class="option-button dropdown basemap_dropdown"><div class="thumb"></div>Basemap</a>');

        $(".map-options").append($options);

      }

      this.basemapDropdown = new cdb.admin.DropdownBasemap({
        target: $('.basemap_dropdown'),
        position: "position",
        template_base: "table/views/basemap/basemap_dropdown",
        model: this.map,
        mapview: this.mapView,
        user: this.user,
        baseLayers: this.options.baseLayers,
        tick: "left",
        vertical_offset: 40,
        horizontal_position: "left",
        vertical_position: this.vis.get("type") === 'table' ? "down" : "up",
        horizontal_offset: this.vis.get("type") === 'table' ? 42 : 0
      });

      this.addView(this.basemapDropdown);

      this.basemapDropdown.bind("onDropdownShown", function() {
        cdb.god.trigger("closeDialogs");
      });

      cdb.god.bind("closeDialogs", this.basemapDropdown.hide, this.basemapDropdown);

      $(".basemap_dropdown").append(this.basemapDropdown.render().el);

    }

    // Set active base layer if it already exists
    if (this.map.getBaseLayer()) {
      this.basemapDropdown.setActiveBaselayer();
    }

  },

  bindGeoRefCheck: function() {
    if(!this.table.data().fetched) {
      this.table.bind('dataLoaded', function() {
        this.checkGeoRef();
        if (!this.user.featureEnabled("bbg_rtr_single_step_new_map")) {
          if (!this.scratchDialog) {
            this._showScratchDialog();
          }
        }
        if (!this.pecanView) {
          this._showPecan();
        }
      }, this);
    } else {
      this.checkGeoRef();
    }
  },

  activated: function() {
    this.checkGeoRef();
    $(window).scrollTop(0);
  },

  checkGeoRef: function() {
    if (this.options && this.table) {
      this.georeferenced = this.table.isGeoreferenced();
      if (this.noGeoRefDialog) {
        this.noGeoRefDialog.hide();
      }
      if (!this.georeferenced) {
        if (this.table.data().length > 0) {
          this[ this.table.isSync() ? '_showNoGeoWarning' : 'showNoGeoRefWarning' ]();
        }
      }
    }
  },

  // Shows a warning dialog when your current dialog doesn't have any
  // geometry on it and it is synchronized
  _showNoGeoWarning: function() {
    var noGeoWarningDialog = 'noGeoWarningDialog_' + this.table.id + '_' + this.table.get('map_id');
    if (this.noGeoWarningDialog || localStorage[noGeoWarningDialog]) {
      return;
    }

    this.noGeoWarningDialog = cdb.editor.ViewFactory.createDialogByTemplate(
      'table/views/no_geo_warning_template', {
        clean_on_hide: true
      }
    );

    this.noGeoWarningDialog.bind("hide", function() {
      localStorage[noGeoWarningDialog] = true;
    });

    this.noGeoWarningDialog.appendToBody();
  },

  _showPecan: function() {

    var hasPecan     = this.user.featureEnabled('pecan_cookies');

    var hasData = this.options.table && this.options.table.data() && this.options.table.data().length > 0 ? true : false;

    if (hasPecan && hasData) {

      var skipPencanDialog = 'pecan_' + this.options.user.get("username") + "_" + this.options.table.id;

      if (!localStorage[skipPencanDialog]) {

        this.pecanView = new cdb.editor.PecanView({
          table: this.options.table,
          backgroundPollingModel: this.options.backgroundPollingModel
        });
      }
    }
  },

  _showScratchDialog: function() {
    if (this.options.table && this.options.table.data().fetched && this.options.table.data().length === 0) {

      var skipScratchDialog = 'scratchDialog_' + this.options.table.id + '_' + this.options.table.get('map_id');

      if (!localStorage[skipScratchDialog]) {

        this.scratchDialog = new cdb.editor.ScratchView({
          table: this.options.table
        });

        this.scratchDialog.appendToBody();

        this.scratchDialog.bind("newGeometry", function(type) {
          this._addGeometry(type);
        }, this);

        this.scratchDialog.bind("skip", function() {
          localStorage[skipScratchDialog] = true;
        });
      }
    }
  },

  /**
   * this function binds click and dblclick events
   * in order to not raise click when user does a dblclick
   *
   * it raises a missingClick when the user clicks on the map
   * but not over a feature or ui component
   */
  _bindMissingClickEvents: function() {
    var self = this;
    this.mapView.bind('click', function(e) {
      if(self.clickTimeout === null) {
        self.clickTimeout = setTimeout(function() {
          self.clickTimeout = null;
          if(!self.featureHovered) {
            self.trigger('missingClick');
          }
        }, 150);
      }
      //google maps does not send an event
      if(!self.featureHovered && e.preventDefault) {
        e.preventDefault();
        e.stopPropagation();
      }
    });

    this.mapView.bind('dblclick', function() {
      if(self.clickTimeout !== null) {
        clearTimeout(self.clickTimeout);
        self.clickTimeout = null;
      }
    });
  },

  setActiveLayer: function(layerView) {
    this.activeLayerView = layerView;
    // check if the map is rendered and the layer is in the map
    if(this.mapView && this.mapView.getLayerByCid(layerView.model.cid)) {
      var layerModel = layerView.model;
      this._bindDataLayer(layerView, layerModel);
    }
  },

  /**
   * when the layer view is created this method is called
   * to attach all the click events
   */
  _bindDataLayer: function(layerView, layer) {
    var self = this;
    var layerType = layer.get('type');

    if (layerType === 'CartoDB' || layerType === 'torque') { // unbind previos stuff

      // Set data layer bindings
      if (self.layerDataView) {
        self.layerDataView.unbind(null, null, this);
      }

      if (self.layerModel) {
        self.layerModel.unbind(null, null, this);
      }

      if (self.options.geocoder) {
        self.options.geocoder.unbind(null, null, this);
      }

      self.infowindowModel  = layer.infowindow;
      self.tooltipModel     = layer.tooltip;
      self.legendModel      = layer.legend;

      self._bindTable(layer.table);
      self._bindSQLView(layer.sqlView);
      self.layerDataView = self.mapView.getLayerByCid(layer.cid);

      self.mapView.setActiveLayer(layer);
      self._addLegends();
      self._addTimeline();

      if (self.layerDataView) {
        self.layerDataView.bind('featureClick', self.featureClick, self);
        self.layerDataView.bind('featureOut',   self.featureOut,   self);
        self.layerDataView.bind('featureOver',  self.featureOver,  self);
        self.layerDataView.bind('loading',      self.loadingTiles, self);
        self.layerDataView.bind('load',         self.loadTiles,    self);
        self.layerDataView.bind('error',        self.loadTiles,    self);
        self.tooltip
          .setLayer(self.layerDataView)
          .enable();

      }

      // Set layer model binding
      if (layerView && layer) {
        layer.unbind('startEdition',this._addGeometry, this);
        layer.bind('startEdition', this._addGeometry, this);
      }

      if(layer) {
        self.layerModel = layer;
        //TODO: unbind this at some point
        layer.bind('change:interactivity', this._updateSQLHeader, this);
        this._updateSQLHeader();
      }

      if (self.options.geocoder) {
        self.options.geocoder.bind('geocodingComplete geocodingError geocodingCanceled', this.updateDataLayerView, this);
        self.add_related_model(self.options.geocoder);
      }

    }
  },

  _cleanLegends: function() {

    if (this.legends) {
      _.each(this.legends, function(legend) {
        legend.clean();
      });

      // destroy the drag handler if it exists
      if (this.stackedLegend && this.stackedLegend.$el.data('ui-draggable')) {
        this.stackedLegend.$el.draggable('destroy');
      }
    }

    this.legends = [];
    if (this.overlays) this.overlays.setLegend(null);

  },


  _getCartoDBLayers: function() {

    return this.map.layers.models.filter(function(layerModel) {
      return layerModel.get("type") === 'CartoDB'
    });

  },

  getMapView: function() {
    return this.mapView;
  },

  getCanvas: function() {
    return this.canvas;
  },

  _onKeyDown: function(e) {
    if (this.overlays && e.which == 86 && (e.ctrlKey || e.metaKey)) {
      this.overlays.paste();
    }
  },

  _onChangeCanvasMode: function() {

    var self = this;

    cdb.god.trigger("closeDialogs");

    var mode = this.canvas.get("mode");

    if (mode === "desktop") {

      this._showDesktopCanvas(mode);

      if (this.overlays.loader && this.overlays.fullscreen) {
        setTimeout(function() {
          self.overlays && self.overlays._positionOverlaysVertically(true);
        }, 500);
      }

    } else if (mode === "mobile") {

      this._showMobileCanvas(mode);

      setTimeout(function() {
        self.overlays && self.overlays._positionOverlaysVertically(true);
      }, 300);

    }

  },

  _showMobileCanvas: function(mode) {

    var self = this;

    var width  = 288;
    var height = 476;

    this.overlays._hideOverlays("desktop");

    var $map = $("div.map div.cartodb-map");

    this.$el.addClass(mode);

    // Animations step - 1
    var onBackgroundShown = function() {

      $map.animate(
        { width: width, marginLeft: -Math.round(width/2) - 1, left: "50%" },
        { easing: "easeOutQuad", duration: 200, complete: onCanvasLandscapeStretched }
      );

    };

    // Animations step - 2
    var onCanvasPortraitStretched = function() {

      self.$el.find(".mobile_bkg").animate(
        { opacity: 1 },
        { duration: 250 }
      );

      self.overlays._showOverlays(mode);

      // Let's set center view for mobile mode
      var center = self.map.get('center');
      self.mapView.invalidateSize();
      $map.fadeOut(250);

      setTimeout(function() {
        self.mapView.map.setCenter(center);
        $map.fadeIn(250);
      },300);

    };

    // Animations step - 3
    var onCanvasLandscapeStretched = function() {

      $map.animate(
        { height: height, marginTop: -Math.round(height/2) + 23,  top:  "50%" },
        { easing: "easeOutQuad", duration: 200, complete: onCanvasPortraitStretched }
      );

    };

    onBackgroundShown();

    this._enableAnimatedMap();
    this._enableMobileLayout();

  },

  _enableMobileLayout: function() {

    if (!this.mobile) {

      var torqueLayer;

      this.mobile = new cdb.admin.overlays.Mobile({
        mapView: this.mapView,
        overlays: this.overlays,
        map: this.map
      });

      this.mapView.$el.append(this.mobile.render().$el);

    } else {
      this.mobile.show();
    }

  },

  _disableMobileLayout: function() {

    if (this.mobile) this.mobile.hide();

  },

  _showDesktopCanvas: function(mode) {

    var self = this;

    this.overlays._hideOverlays("mobile");

    this.$el.removeClass("mobile");

    this.$el.find(".mobile_bkg").animate({ opacity: 0}, 250);

    var
    $map       = $("div.map div.cartodb-map"),
    top        = $map.css("top"),
    left       = $map.css("left"),
    mTop       = $map.css("marginTop"),
    mLeft      = $map.css("marginLeft"),
    curWidth   = $map.width(),
    curHeight  = $map.height(),
    autoWidth  = $map.css({width:  'auto', marginLeft: 0, left: "15px"}).width();  //temporarily change to auto and get the width.
    autoHeight = $map.css({height: 'auto', marginTop: 0,  top: "82px" }).height(); //temporarily change to auto and get the width.

    $map.height(curHeight);
    $map.width(curWidth);

    $map.css({ top: top, left: left, marginLeft: mLeft, marginTop: mTop, height: curHeight, width: curWidth });

    var onSecondAnimationFinished = function() {

      $map.css('width', 'auto');
      self.overlays._showOverlays(mode);

      // Let's set center view for desktop mode
      var center = self.map.get('center');
      self.mapView.invalidateSize();

      setTimeout(function() {
        self.mapView.map.setCenter(center);
      },300);

    };

    var onFirstAnimationFinished = function() {

      $map.css('height', 'auto');
      $map.animate(
        { width: autoWidth, left: "15px", marginLeft: "0"},
        { easing: "easeOutQuad", duration: 200, complete: onSecondAnimationFinished }
      );

    };

    var stretchMapLandscape = function() {
      $map.animate(
        { height: autoHeight, top: "82", marginTop: "0"},
        { easing: "easeOutQuad", duration: 200, complete: onFirstAnimationFinished }
      );
    };

    stretchMapLandscape();

    this._disableAnimatedMap();
    this._disableMobileLayout();

  },

  _enableAnimatedMap: function() {

    var self = this;

    setTimeout(function() {
      self.$el.addClass("animated");
    }, 800)

  },

  _disableAnimatedMap: function() {
    this.$el.removeClass("animated");
  },

  _addOverlays: function() {
    this.overlays = new cdb.admin.MapOverlays({
      headerMessageIsVisible: this._shouldAddSQLViewHeader(),
      vis: this.vis,
      canvas: this.canvas,
      mapView: this.mapView,
      master_vis: this.master_vis,
      mapToolbar: $(".map_toolbar")
    });
    if (this.stackedLegend) {
        this.overlays.setLegend(this.stackedLegend);
    }

  },

  _addExportBar: function(model, form_data) {

    // prevent dragging on legend child element from opening file upload overlay (apparent bug)
    if (this.stackedLegend) {
      this.stackedLegend.$el.children().on('dragstart', function(event) {
        event.preventDefault();
      });
    }

    if (!this.mapToolbar) {
      this.mapToolbar = $(".map_toolbar");
    }

    this.mapToolbar.addClass("animated");

    this._hideToolbarOptions(model);

    if (!this.exportBar) {

      this.exportBar = new cdb.admin.ExportBar({
        model: model,
        mapView: this.mapView,
        overlays: this.overlays,
        canvas: this.canvas,
        vis: this.vis,
        form_data: form_data
      });
      this.exportBarActions = new cdb.admin.ExportBarActions({
      });

      this.overlays.addView(this.exportBar);

      this.mapToolbar.append(this.exportBar.render().el);
      this.mapToolbar.append(this.exportBarActions.render().el);


      this.exportBar.bind("export_size_changed", function(selection) {
        this._exportSizeChanged(selection);
      }, this);

      this.exportBar.bind("custom_size_changed", function(width, height) {
        this._customSizeChanged(width, height);
      }, this);

      this.exportBar.$el.animate({ top: 0 }, { duration: 200, easing: "easeInOutQuad" });
      this.exportBarActions.$el.animate({ top: 0 }, { duration: 200, easing: "easeInOutQuad" });
    }

  },

  _cancelExport: function (e) {
    this.exportBar && this._removeExportBar(true);
    this.exportImageView && this._removeExportImageView();
  },

  _doExport: function(e) {
    if (this.exportBar.getDestinationType() === 'AVMM') {
      this.exportImageView._avmm(e);
    } else {
      this.exportImageView._local(e);
    }
  },

  _removeExportBar: function(showToolbar) {

    showToolbar && this._showToolbarOptions();

    // Attempt to destroy the bar
    if (this.exportBar) {

      var self = this;

      this.exportBar.unbind("export_size_changed");
      this.exportBar.unbind("custom_size_changed");

      this.exportBar.reset();

      this.exportBarActions.$el.animate({ top: 100 }, { duration: 150, complete: function () {
        self.exportBarActions.clean();
        delete self.exportBarActions;
      }});

      this.exportBar.$el.animate({ top: 100 }, { duration: 150, complete: function() {
        self.exportBar.clean();
        self.exportBar.destroy();
        delete self.exportBar;
      }});
    }
  },

  _showToolbarOptions: function() {
    var self = this;

    if (!this.mapToolbar) {
      this.mapToolbar = $(".map_toolbar");
    }

    if (this.mapToolbar) {
      this.mapToolbar.find(".header_block").animate({ top: 0 }, { duration: 250, easing: "easeInOutQuad", complete: function() {
        self.mapToolbar.removeClass("animated");
      }});
    }
  },

  _hideToolbarOptions: function(model) {

    if (!this.mapToolbar) {
      this.mapToolbar = $(".map_toolbar");
    }

    if (this.exportBar) {
      if (this.exportBar.compareModel(model)) { // if the model is the same as the current one, hide the options bar
        this.mapToolbar.find(".header_block").animate({ top: -100 }, { duration: 200, easing: "easeInOutQuad" } );
      } else { // otherwise, deselect the overlay
        this.exportBar.deselectOverlay();
      }

    } else  {
      this.mapToolbar.find(".header_block").animate({ top: -100 }, { duration: 200, easing: "easeInOutQuad" });
    }
  },

  _exportSizeChanged: function(selection) {
    var self = this;
    var selectedSize;

    if (selection === 'Custom') {
      selectedSize = 'custom';
    } else if (selection.indexOf('Small') > -1) {
      selectedSize = 'small';
    } else if (selection.indexOf('Medium') > -1) {
      selectedSize = 'medium';
    } else if (selection.indexOf('Large') > -1) {
      selectedSize = 'large';
    } else {
      console.error('unrecognized size selection ' + selection);
    }

    if (selectedSize === this.export_size) {
      return;
    }

    // recreate image exporter view for new size
    this._removeExportImageView();

    this.last_export_size = this.export_size;
    this.export_size = selectedSize;
    this._exportImage();

    setTimeout(function() {
      if (selectedSize === 'custom') {
        self.exportBar.showField('Custom Size');
      } else {
        self.exportBar.hideField('Custom Size');
      }
    }, 200);
  },

  _customSizeChanged: function(width, height) {
    // recreate image exporter view for new custom size
    var offset = this.exportImageView.getOffset();
    this._removeExportImageView();
    this._exportImage(width, height, offset.left, offset.top);
  },

  _exportImageClick: function(e) {

    // close the annotations editor and any open dropdowns before starting export
    cdb.god.trigger('closeDialogs');

    if (this.exportBar) {
      this.exportBar.reset();
      this._removeExportBar(false);
    }

    this._addExportBar(this.layerModel.legend, this.export_form_data);
    this.exportBar.reset(); // reset the persisted toolbar options on starting a new export
    this.export_size = this.default_export_size;  // reset the export image view on starting new export
    this._exportImage();
  },

  _exportImage: function(customWidth, customHeight, left, top) {

    if (this.exportImageView) {
      return;
    }

    var mapWidth = this.mapView.$el.width();
    var mapHeight = this.mapView.$el.height();
    var lastExportSize = this.last_export_size || this.default_export_size;

    var width, height;
    if (this.export_size === 'custom') {
      // Use custom dimensions or default to last standard export size
      width = customWidth ? customWidth : this.export_sizes[lastExportSize][0];
      height = customHeight ? customHeight : this.export_sizes[lastExportSize][1];
    } else {
      width = this.export_sizes[this.export_size][0];
      height = this.export_sizes[this.export_size][1];
    }

    var exportOptions = {
      vizjson:     this.vis.vizjsonURL(),
      vis:         this.vis,
      user:        this.options.user,
      overlays:    this.overlays,
      mapView:     this.mapView,
      width:       width,
      height:      height,
      map:         this.map,
      custom_size: this.export_size === 'custom'
    };

    var w, h;
    if (customWidth && customHeight) {
      // custom sizing set from text box
      exportOptions.horizontalMargin = 0;
      exportOptions.verticalMargin = 0;
      w = mapWidth - customWidth;
      h = mapHeight - customHeight;
      exportOptions.left = left;
      exportOptions.top = top;
    } else {
      // using a preset size
      exportOptions.horizontalMargin = 0;
      exportOptions.verticalMargin = 0;
      w = mapWidth - width;
      h = mapHeight - height;
      exportOptions.left = w > 0 ? w / 2: 0;
      exportOptions.top = h > 0 ? h / 2 : 0;
    }

    this.exportImageView = new cdb.admin.ExportImageView(exportOptions);

    this.exportImageView.bind("was_removed", function() {
      if (this.exportBar) {
        this._removeExportBar(true);
      }
      this.export_size = this.default_export_size; // back to default
      this.exportImageView.unbind("width_height_changed");
      this.exportImageView = null;
    }, this);

    this.exportImageView.bind("width_height_changed", function(width, height) {
      this.exportBar && this.exportBar.updateSize(width, height);
    }, this);

    this.mapView.$el.append(this.exportImageView.render().$el);

    cdb.god.bind("panel_action", function(action) {
      if (action !== "hide" && this.exportImageView) {
        this.exportImageView.hide();
      }
    }, this);
  },

  _addSlides: function() {

    if (!this.vis.isVisualization()) return;

    this.slidesPanel = new cdb.admin.SlidesPanel({
      user: this.user,
      slides:  this.vis.slides,
      toggle: this.$el.find(".toggle_slides")
    });

    this.slidesPanel.bind("onChangeVisible", function() {
      this.exportImageView && this.exportImageView.hide();
    }, this);

    this.$el.append(this.slidesPanel.render().el);

    this.addView(this.slidesPanel);

  },

  _addLegends: function() {

    var self = this;

    this._cleanLegends();

    if (!this.map.get("legends")) {
      return;
    }

    var models = this.map.layers.models;

    for (var i = models.length - 1; i >= 0; --i) {
      var layer = models[i];
      self._addLegend(layer);
    }

  },

  _addLegend: function(layer) {

    var type = layer.get('type');

    if (type === 'CartoDB' || type === 'torque') {

      if (this.table && this.mapView) {

        if (this.legend) this.legend.clean();

        if (layer.get("visible")) {

          var legend = new cdb.geo.ui.Legend({
            model:   layer.legend,
            mapView: this.mapView,
            table:   this.table
          });

          if (this.legends) {
            this.legends.push(legend);
            this._renderStackedLegends();
          }

        }
      }
    }

  },

  _toggleLegends: function() {
    if (this.map.get("legends")) {
      this._addLegends();
    } else {
      this._cleanLegends();
    }
  },

  _changeLegends: function() {
    // clear custom legend placement before re-adding them (CSS will need to be recalculated)
    if (this.legends) {
      _.each(this.legends, function(legend) {
        legend.model.set('style', null);
      });
    }

    this._addLegends();
  },

  _addTimeline: function() {
    if (!this.mapView) return;
    // check if there is some torque layer
    if(!this.map.layers.any(function(lyr) { return lyr.get('type') === 'torque' && lyr.get('visible'); })) {
      this.timeline && this.timeline.clean();
      this.timeline = null;
    } else {
      var layer = this.map.layers.getLayersByType('torque')[0];
      var steps = layer.wizard_properties.get('torque-frame-count');

      if (this.timeline) {
        // check if the model is different
        if (this.timeline.torqueLayer.model.cid !== layer.cid) {
          this.timeline.clean();
          this.timeline = null;
        }
      }

      layerView = this.mapView.getLayerByCid(layer.cid);

      if (layerView && typeof layerView.getStep !== "undefined" && steps > 1) {
        if (!this.timeline) {
          this.timeline = new cdb.geo.ui.TimeSlider({
            layer: layerView,
            width: "auto"
          });

          this.mapView.$el.append(this.timeline.render().$el);
          this.addView(this.timeline);
        } else {
          this.timeline.setLayer(layerView);
        }
      }
      else if (this.timeline) {
        this.timeline.clean();
        this.timeline = null;
      }
    }
  },

  _renderStackedLegends: function() {

    if (this.stackedLegend) this.stackedLegend.clean();
    if (this.legend)        this.legend.clean();

    this.stackedLegend = new cdb.geo.ui.StackedLegend({
      legends: this.legends,
      vis: this.vis
    });

    this.mapView.$el.append(this.stackedLegend.render().$el);
    this.addView(this.stackedLegend);
    if (this.overlays) this.overlays.setLegend(this.stackedLegend);
  },

  _renderLegend: function() {

    if (this.legend) this.legend.clean();

    this.legend = this.legends[0];

    this.mapView.$el.append(this.legend.render().$el);

    if (!this.legend.model.get("type")) this.legend.hide();
    else this.legend.show();

    this.addView(this.legend);

  },

  _addTooltip: function() {
    if(this.tooltip) this.tooltip.clean();
    if(this.table && this.mapView) {
      this.tooltip = new cdb.admin.Tooltip({
        model: this.tooltipModel,
        table: this.table,
        mapView: this.mapView,
        omit_columns: ['cartodb_id'] // don't show cartodb_id while hover
      });
      this.mapView.$el.append(this.tooltip.render().el);
      this.tooltip.bind('editData', this._editData, this);
      this.tooltip.bind('removeGeom', this._removeGeom, this);
      this.tooltip.bind('editGeom', this._editGeom, this);
      if (this.layerDataView) {
        this.tooltip
          .setLayer(this.layerDataView)
          .enable();
      }
    }
  },

  _addInfowindow: function() {
    if(this.infowindow) this.infowindow.clean();
    if(this.table && this.mapView) {
      this.infowindow = new cdb.admin.MapInfowindow({
        model: this.infowindowModel,
        mapView: this.mapView,
        table: this.table
      });
      this.mapView.$el.append(this.infowindow.el);

      // Editing geometry
      if(this.geometryEditor) {
        this.geometryEditor.discard();
        this.geometryEditor.clean();
      }

      this.geometryEditor = new cdb.admin.GeometryEditor({
        user: this.user,
        model: this.table
      });

      this.geometryEditor.mapView = this.mapView;
      this.mapView.$el.append(this.geometryEditor.render().el);
      this.geometryEditor.hide();

      this.geometryEditor.bind('editStart', this.hideDataLayer, this);
      this.geometryEditor.bind('editDiscard', this.showDataLayer, this);
      this.geometryEditor.bind('editFinish', this.showDataLayer, this);
      this.geometryEditor.bind('editFinish', this.updateDataLayerView, this);
      this.geometryEditor.bind('geomCreated', function(row) {
        this.table.data().add(row);
      }, this);

      var self = this;

      this.infowindow.bind('editData', this._editData, this);
      this.infowindow.bind('removeGeom', this._removeGeom, this);
      this.infowindow.bind('editGeom', this._editGeom, this);

      this.infowindow.bind('openInfowindowPanel', function() {
        this.activeLayerView.showModule('infowindow', 'fields');
      }, this);

      this.infowindow.bind('close', function() {
        if (this.tooltip) {
          this.tooltip.setFilter(null);
        }
      }, this);

      this.table.bind('remove:row', this.updateDataLayerView, this);

      this.table.bind('change:dataSource', function() {
        if (this.geometryEditor) this.geometryEditor.discard();
      }, this);

      this.map.bind('change:provider', function() {
        if (this.geometryEditor) this.geometryEditor.discard();
      }, this);
    }
  },

  _editGeom: function(row) {
    // when provider is leaflet move the world to [-180, 180]
    // because vector features are only rendered on that slice
    if (this.map.get('provider') === 'leaflet') {
      this.map.clamp();
    }
    this.geometryEditor.editGeom(row);
  },

  /**
   * Shows edit data modal window
   */
  _editData: function(row) {
    if (!this.table.isReadOnly()) {
      var self = this;
      row.fetch({ cache: false, no_geom: true, success: function() {
        var dlg = new cdb.editor.FeatureDataView({
          row: row,
          provider: self.map.get('provider'),
          baseLayer: self.map.getBaseLayer().clone(),
          dataLayer: self.layerModel.clone(),
          currentZoom: self.map.getZoom(),
          enter_to_confirm: false,
          table: self.table,
          user: self.user,
          clean_on_hide: true,
          onDone: self.updateDataLayerView.bind(self) // Refreshing layer when changes have been done
        });

        dlg.appendToBody();
      }});

      return false;
    }
  },

  /**
   * triggers an removeGeom event when the geometry
   * is removed from the server
   */
  _removeGeom: function(row) {
    if (!this.table.isReadOnly()) {
      var view = new cdb.editor.DeleteRowView({
        name: 'feature',
        table: this.table,
        row: row,
        clean_on_hide: true,
        enter_to_confirm: true,
        wait: true // to not remove from parent collection until server-side confirmed deletion
      });
      view.appendToBody();

      return false;
    }
  },

  _addGeometry: function(type) {
    this.geometryEditor.createGeom(this.table.data().newRow(), type);
  },

  _bindTable: function(table) {
    if (this.table) {
      this.table.unbind(null, null, this);
    }

    this.table = table;

    this.table.bind('change:dataSource', this._hideInfowindow, this);
    this.table.bind('change:dataSource', this._updateSQLHeader, this);
    this.table.bind('change:schema',     this._updateSQLHeader, this);

    this.table.bind('data:saved', this.updateDataLayerView, this);

    this._addInfowindow();

    this._addLegends();
    this._addTooltip();

    this.bindGeoRefCheck();
  },

  _bindSQLView: function(sqlView) {
    if(this.sqlView) {
      this.sqlView.unbind(null, null, this);
    }
    this.sqlView = sqlView;
    this.sqlView.bind('reset error', this._updateSQLHeader, this);
    this.sqlView.bind('loading', this._renderLoading, this);
    this._updateSQLHeader();
  },

  _renderLoading: function(opts) {
    var self = this;
    this._removeSQLViewHeader();

    this.loadingTimeout = setTimeout(function(){
      //TODO: remove this hack
      if ($('.table_panel').length > 0) {
        panel_opened = $('.table_panel').css("right").replace("px","") == 0
      }

      var html = self.getTemplate('table/views/sql_view_notice_loading')({
        panel_opened: panel_opened
      });

      if (self.overlays) {
        self.overlays.setHeaderMessageIsVisible(true);
      }

      self.$('.cartodb-map').after(html);
    }, 500);
  },

  _updateSQLHeader: function() {
    if (this._shouldAddSQLViewHeader()) {
      this._addSQLViewHeader();
    } else {
      this._removeSQLViewHeader();
    }
  },

  _shouldAddSQLViewHeader: function() {
    return this.table && this.table.isInSQLView() && this.table.showSqlBanner;
  },

  loadingTiles: function() {
    if (this.overlays.loader) this.overlays.loader.show();
  },

  loadTiles: function() {
    if (this.overlays.loader) this.overlays.loader.hide();
  },

  featureOver: function(e, latlon, pxPos, data) {
    if(this.infowindowModel.get('disabled')) return;
    this.mapView.setCursor('pointer');
    this.featureHovered = data;
  },

  featureOut: function() {
    if(this.infowindowModel.get('disabled')) return;
    this.mapView.setCursor('auto');
    this.featureHovered = null;
  },

  featureClick: function(e, latlon, pxPos, data) {
    if(this.infowindowModel.get('disabled')) return;
    if(!this.geometryEditor.isEditing()) {
      if(data.cartodb_id) {
        this.infowindow
          .setLatLng(latlon)
          .setFeatureInfo(data.cartodb_id)
          .showInfowindow();

        this.tooltip.setFilter(function(feature) {
          return feature.cartodb_id !== data.cartodb_id;
        }).hide();
      } else {
        cdb.log.error("can't show infowindow, no cartodb_id on data");
      }
    }
  },

  /**
   *  Move all necessary blocks when panel is openned (normal, narrowed,...) or closed
   */
  _moveInfo: function(type) {
    if (type === "show") {
      this.$el
        .removeClass('narrow')
        .addClass('displaced');
    } else if (type === "hide") {
      this.$el.removeClass('narrow displaced');
    } else if (type === "narrow") {
      this.$el.addClass('narrow displaced');
    }
  },

  render: function() {

    this.$el.html('');

    this.$el
    .removeClass("mobile")
    .removeClass("derived")
    .removeClass("table");

    this.$el.addClass(this.vis.isVisualization() ? 'derived': 'table');
    var provider = this.map.get("provider");

    this.$el.append(this.template({
      slides_enabled: this.user.featureEnabled('slides'),
      type: this.vis.get('type'),
      exportEnabled: !this.map.isProviderGmaps()
    }));

    return this;

  },

  showDataLayer: function() {
    this.mapView.enableInteraction();
    this.layerDataView.setOpacity && this.layerDataView.setOpacity(1.0);
  },

  hideDataLayer: function() {
    this.mapView.disableInteraction();
    this.layerDataView.setOpacity && this.layerDataView.setOpacity(0.5);
  },

  /**
   * reload tiles
   */
  updateDataLayerView: function() {
    if(this.layerDataView) {
      this.layerDataView.invalidate();
    }
  },
  /**
   * Paints a dialog with a warning when the user hasn't any georeferenced row
   * @method showNoGeorefWarning
   */
  showNoGeoRefWarning: function() {
    var warningStorageName = 'georefNoContentWarningShowed_' + this.table.id + '_' + this.table.get('map_id');

    // if the dialog already has been shown, we don't show it again
    if(!this.noGeoRefDialog && !this.table.isInSQLView() && (!localStorage[warningStorageName])) {
      localStorage[warningStorageName] = true;

      this.noGeoRefDialog = new cdb.editor.GeoreferenceView({
        table: this.table,
        user: this.user
      });
      this.noGeoRefDialog.appendToBody();
    }

  },

  //adds the green indicator when a query is applied
  _addSQLViewHeader: function() {
    var self = this;

    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
      this.loadingTimeout = undefined;
    }
    if (this.queryTimeout) {
      clearTimeout(this.queryTimeout);
      this.queryTimeout = undefined;
    }
    this.$('.sqlview').remove();
    var total = this.table.data().size();
    var warnMsg = null;
    // if the layer does not suppor interactivity do not show the message
    if (this.layerModel && !this.layerModel.get('interactivity') && this.layerModel.wizard_properties.supportsInteractivity()) {
      warnMsg = this._TEXTS.no_interaction_warn;
    }
    if (this.layerModel && !this.layerModel.table.containsColumn('the_geom_webmercator')) {
      warnMsg = _t('the_geom_webmercator column should be selected');
    }
    var html = this.getTemplate('table/views/sql_view_notice')({
      empty: !total,
        isVisualization: this.vis.isVisualization(),
        warnMsg: warnMsg
    });

    // do not show if there is result and no warning
    if (total && warnMsg == null) {
      return;
    }

    this.queryTimeout = setTimeout(function(){
      //self.$('.cartodb-map').after(html);

      if (self.overlays) {
        self.overlays.setHeaderMessageIsVisible(true);
      }
    }, 500);
  },

  _removeExportImageView: function() {
    if (this.exportImageView) {
      this.exportImageView.clean();
      this.exportImageView.unbind("width_height_changed");
      this.exportImageView.unbind("was_removed");
      this.exportImageView = null;
    }
  },

  _removeSQLViewHeader: function() {
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
      this.loadingTimeout = undefined;
    }
    if (this.queryTimeout) {
      clearTimeout(this.queryTimeout);
      this.queryTimeout = undefined;
    }
    this.$('.sqlview').remove();

    if (this.overlays) {
      this.overlays.setHeaderMessageIsVisible(false);
    }
  },

  _toggleSlides: function(e) {
    this.killEvent(e);
    this.slidesPanel && this.slidesPanel.toggle();
  },

  _clearView: function(e) {
    this.killEvent(e);
    this.activeLayerView.model.clearSQLView();
    return false;
  },

  _dismissSQLView: function (e) {
    this.killEvent(e);
    if (this.table) {
      this.table.showSqlBanner = false;
    }
    this._removeSQLViewHeader();
  },

  _tableFromQuery: function(e) {
    this.killEvent(e);

    var duplicate_dialog = new cdb.editor.DuplicateDatasetView({
      model: this.table,
      user: this.user,
      clean_on_hide: true
    });
    duplicate_dialog.appendToBody();
  }

});
