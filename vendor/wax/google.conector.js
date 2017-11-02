function Connector(options) {
  options = options || {};

  this.options = {
    tiles: options.tiles,
    scheme: options.scheme || 'xyz',
    blankImage: options.blankImage || 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
  };

  this.minZoom = options.minzoom || 0;
  this.maxZoom = options.maxzoom || 22;

  this.name = options.name || '';
  this.description = options.description || '';

  // non-configurable options
  this.interactive = true;
  this.tileSize = new google.maps.Size(256, 256);

  // DOM element cache
  this.cache = {};
};

// Get a tile element from a coordinate, zoom level, and an ownerDocument.
Connector.prototype.getTile = function (coord, zoom, ownerDocument) {
  var key = zoom + '/' + coord.x + '/' + coord.y;
  if (!this.cache[key]) {
    var img = this.cache[key] = new Image(256, 256);
    this.cache[key].src = this.getTileUrl(coord, zoom);
    this.cache[key].setAttribute('gTileKey', key);
    this.cache[key].onerror = function () { img.style.display = 'none'; };
  }
  return this.cache[key];
};

// Remove a tile that has fallen out of the map's viewport.
//
// TODO: expire cache data in the gridmanager.
Connector.prototype.releaseTile = function (tile) {
  var key = tile.getAttribute('gTileKey');
  if (this.cache[key]) delete this.cache[key];
  if (tile.parentNode) tile.parentNode.removeChild(tile);
};

// Get a tile url, based on x, y coordinates and a z value.
Connector.prototype.getTileUrl = function (coord, z) {
  // Y coordinate is flipped in Mapbox, compared to Google
  var mod = Math.pow(2, z),
    y = (this.options.scheme === 'tms') ?
      (mod - 1) - coord.y :
      coord.y,
    x = (coord.x % mod);

  x = (x < 0) ? (coord.x % mod) + mod : x;

  if (y < 0) return this.options.blankImage;

  return this.options.tiles
  [parseInt(x + y, 10) %
    this.options.tiles.length]
    .replace(/\{z\}/g, z)
    .replace(/\{x\}/g, x)
    .replace(/\{y\}/g, y);
};


module.exports = Connector;
