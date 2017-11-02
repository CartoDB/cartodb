/* global L */

/**
 * Handles map interactivity through an [UtfGrid](https://github.com/mapbox/utfgrid-spec/blob/master/1.3/utfgrid.md)
 */
class Interactive {
  constructor(map, gridUrl) {
    this._cache = {};
    this._map = map;
    this._url = gridUrl;
    this._eventEmitter = document.createElement('i');
  }

  /**
   * Add the grid url from a tilejson file
   * @deprecated
   * Method added for backwards compatibility.
   */
  tilejson(tilejson) {
    this._url = tilejson.grids[0];
    return this;
  }

  /**
   * Add the native map 
   * @deprecated
   * Method added for backwards compatibility.
   */
  map(map) {
    this._map = map;
    // Bind map events
    this._map.on('click', this._onMapClick, this);
    this._map.on('mousemove', this._onMapMouseMove, this);
    return this;
  }

  /**
   * Attach event listeners to map events
   * @param {*} event 
   * @param {*} callback 
   */
  on(event, callback) {
    switch (event) {
      case 'on':
        this._eventEmitter.addEventListener('mousemove', event => callback(event.detail));
        this._eventEmitter.addEventListener('click', event => callback(event.detail));
        break;
      case 'off':
        this._eventEmitter.addEventListener('featureout', event => callback(event.detail));
        break;
      default:
    }
    return this;
  }

  /**
   * Used internally to dispatch events
   * @param {*} event 
   * @param {*} data 
   */
  _trigger(event, data) {
    this._eventEmitter.dispatchEvent(new CustomEvent(event, { detail: data }));
  }

  /**
   * Callback executed when the native map click event is fired
   * @param {*} e 
   */
  _onMapClick(e) {
    var coords = this._getTileCoordsFromMouseEvent(e);
    this._loadTile(coords.z, coords.x, coords.y).then(() => this._objectForEvent(e, 'click'));
  }

  /**
   * Callback executed when the native map "mousemove" event is fired.
   * @param {*} e 
   */
  _onMapMouseMove(e) {
    var coords = this._getTileCoordsFromMouseEvent(e);
    this._loadTile(coords.z, coords.x, coords.y).then(() => this._objectForEvent(e, 'mousemove'));
  }

  /**
   * Return the tile coordinates from a mouseEvent
   * @param {*} mouseEvent 
   */
  _getTileCoordsFromMouseEvent(event) {
    var tileSize = L.point(256, 256);
    var pixelPoint = this._map.project(event.latlng, this._map.getZoom()).floor()
    var coords = pixelPoint.unscaleBy(tileSize).floor()
    coords.z = this._map.getZoom() // { x: 212, y: 387, z: 10 }
    return coords;
  }

  /**
   * Load a grid.json tile from the coords using a cache system to improve performance.
   * @param {*} z 
   * @param {*} x 
   * @param {*} y 
   */
  _loadTile(z, x, y) {
    // If already cached the request is ignored.
    if (this._cache[z + '_' + x + '_' + y]) {
      return Promise.resolve();
    }
    // Prevent duplicated requests. The value will be async obtained.
    this._cache[z + '_' + x + '_' + y] = 'fetching';
    return fetch(this._buildTileUrl(z, x, y))
      .then(data => data.json())
      .then(data => this._cache[z + '_' + x + '_' + y] = data);
  }

  /**
   * Builds the tile url from the coords.
   * @param {*} z 
   * @param {*} x 
   * @param {*} y 
   */
  _buildTileUrl(z, x, y) {
    let url = this._url;
    url = url.replace(/{z}/, z);
    url = url.replace(/{x}/, x);
    url = url.replace(/{y}/, y);
    return url;
  }

  // Get grid coords
  // Get grid data
  // Throw event if neccesary

  /**
   * 
   */
  _objectForEvent(e, eventType) {
    var point = this._map.project(e.latlng);
    var tileSize = 256;
    var resolution = 4; // 4 pixels asigned to each grid in the utfGrid.
    var x = Math.floor(point.x / tileSize);
    var y = Math.floor(point.y / tileSize);
    var gridX = Math.floor((point.x - (x * tileSize)) / resolution);
    var gridY = Math.floor((point.y - (y * tileSize)) / resolution);
    var max = this._map.options.crs.scale(this._map.getZoom()) / tileSize;

    x = (x + max) % max;
    y = (y + max) % max;

    var tile = this._cache[this._map.getZoom() + '_' + x + '_' + y];
    var data;
    if (tile && tile.grid) {
      var idx = this._utfDecode(tile.grid[gridY].charCodeAt(gridX));
      var key = tile.keys[idx];
      if (tile.data.hasOwnProperty(key)) {
        data = tile.data[key];
      }
    }
    // Extend the event with the data from the grid json
    e.data = data;
    e.e = e.originalEvent;
    this._throwEvent(eventType, e);

  }

  /**
   */
  _throwEvent(eventType, extendedEvent) {
    // If there is no data dont do anything!
    if (!extendedEvent.data) {
      this._trigger('featureout', {});
      return;
    }
    if (eventType === 'mousemove') {
      this._trigger('mousemove', extendedEvent);
      return;
    }
    if (eventType === 'click') {
      this._trigger('featureout', {});
      this._trigger('click', extendedEvent);
    }
  }

  remove() {
    console.warn('Remove not implemented!');
  }

  /**
   * Decode an utf gridjson cell
   * @see https://github.com/mapbox/utfgrid-spec/blob/master/1.3/utfgrid.md
   * @param {*} c 
   */
  _utfDecode(c) {
    if (c >= 93) {
      c--;
    }
    if (c >= 35) {
      c--;
    }
    return c - 32;
  }
}


module.exports = {
  leaf: {
    interaction: () => new Interactive(),
  },
  g: {
    connector: Interactive,
  }
}
