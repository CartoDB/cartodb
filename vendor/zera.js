(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["gridjson"] = factory();
	else
		root["gridjson"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Map = __webpack_require__(1);

/**
 * 
 */

var Interactive = function () {
    function Interactive(map, gridUrl) {
        var _this = this;

        _classCallCheck(this, Interactive);

        // Map element
        this._map = map && new Map(map);
        // Object with the grid.json cached data
        this._cache = {};
        // Url template for the grid tiles
        this._url = gridUrl;
        // We asume 256x256px tiles
        this._tileSize = 256;
        // At the moment only one callback is supported so a custom event emitter is used.
        this._eventEmitter = {
            dispatchEvent: function dispatchEvent(event, data) {
                switch (event) {
                    case 'mousemove':
                        _this._listeners.move && _this._listeners.move(data);
                        break;
                    case 'click':
                        _this._listeners.click && _this._listeners.click(data);
                        break;
                    case 'featureout':
                        _this._listeners.out && _this._listeners.out();
                        break;
                    case 'error':
                        _this._listeners.error && _this._listeners.error(data);
                }
            },
            addEventListener: function addEventListener(event, callback) {
                switch (event) {
                    case 'mousemove':
                        _this._listeners.move = callback;
                        break;
                    case 'click':
                        _this._listeners.click = callback;
                        break;
                    case 'featureout':
                        _this._listeners.out = callback;
                        break;
                    case 'error':
                        _this._listeners.error = callback;
                }
            },
            removeEventListener: function removeEventListener(event) {
                switch (event) {
                    case 'mousemove':
                        delete _this._listeners.move;
                        break;
                    case 'click':
                        delete _this._listeners.click;
                        break;
                    case 'featureout':
                        delete _this._listeners.out;
                        break;
                    case 'error':
                        delete _this._listeners.error;
                }
            }
            // Callbacks for every event
        };this._listeners = {
            click: undefined,
            move: undefined,
            out: undefined,
            error: undefined
        };
    }

    /**
     * Add the grid url from a tilejson file
     * @deprecated
     * Method added for backwards compatibility with wax
     */


    _createClass(Interactive, [{
        key: 'tilejson',
        value: function tilejson(_tilejson) {
            this._url = _tilejson.grids[0];
            return this;
        }

        /**
         * Add the native map 
         * @deprecated
         * Method added for backwards compatibility with wax
         */

    }, {
        key: 'map',
        value: function map(_map) {
            this._map = new Map(_map);
            this._map.on('click', this._onMapClick.bind(this));
            this._map.on('mousemove', this._onMapMouseMove.bind(this));
            return this;
        }

        /**
         * Attach event listeners to map events
         * @param {*} event 
         * @param {*} callback 
         */

    }, {
        key: 'on',
        value: function on(event, callback) {
            switch (event) {
                case 'on':
                    this._eventEmitter.addEventListener('mousemove', callback);
                    this._eventEmitter.addEventListener('click', callback);
                    break;
                case 'off':
                    this._eventEmitter.addEventListener('featureout', callback);
                    break;
                case 'error':
                    this._eventEmitter.addEventListener('error', callback);
                    break;
            }
            return this;
        }

        /**
         * Callback executed when the native map click event is fired
         * @param {*} e 
         */

    }, {
        key: '_onMapClick',
        value: function _onMapClick(e) {
            var _this2 = this;

            var coords = this._getTileCoordsFromMouseEvent(e);
            this._loadTile(coords.z, coords.x, coords.y).then(function () {
                return _this2._objectForEvent(e, 'click');
            });
        }

        /**
         * Callback executed when the native map "mousemove" event is fired.
         * @param {*} e 
         */

    }, {
        key: '_onMapMouseMove',
        value: function _onMapMouseMove(e) {
            var _this3 = this;

            var coords = this._getTileCoordsFromMouseEvent(e);
            this._loadTile(coords.z, coords.x, coords.y).then(function () {
                return _this3._objectForEvent(e, 'mousemove');
            });
        }

        /**
         * Return the tile coordinates from a mouseEvent
         * @param {*} mouseEvent 
         */

    }, {
        key: '_getTileCoordsFromMouseEvent',
        value: function _getTileCoordsFromMouseEvent(event) {
            var pixelPoint = this._map.project(event);
            var coords = this._unscale(pixelPoint, this._tileSize);
            coords.z = this._map.getZoom();
            return coords;
        }
    }, {
        key: '_unscale',
        value: function _unscale(pixelPoint, tileSize) {
            return {
                x: Math.floor(pixelPoint.x / tileSize),
                y: Math.floor(pixelPoint.y / tileSize)
            };
        }

        /**
         * Load a grid.json tile from the coords using a cache system to improve performance.
         * @param {*} z 
         * @param {*} x 
         * @param {*} y 
         */

    }, {
        key: '_loadTile',
        value: function _loadTile(z, x, y) {
            var _this4 = this;

            // If already cached the request is ignored.
            if (this._cache[z + '_' + x + '_' + y]) {
                return Promise.resolve();
            }
            // Mark the tile as "fetching" to prevent duplicated requests. The value will be async obtained.
            this._cache[z + '_' + x + '_' + y] = 'fetching';
            return fetch(this._buildTileUrl(z, x, y))
            // On server limit errors reject throw a featureError
            .then(this._handleLimitErrors).then(function (data) {
                return _this4._cache[z + '_' + x + '_' + y] = data;
            }).catch(function (data) {
                return _this4._eventEmitter.dispatchEvent('error', data);
            });
        }

        /**
         * When the server returns a 429 we want to throw an especific error.
         */

    }, {
        key: '_handleLimitErrors',
        value: function _handleLimitErrors(response) {
            if (response.status === 429) {
                return response.json().then(function (data) {
                    return Promise.reject(data);
                });
            }
            return response.json();
        }

        /**
         * Builds the tile url from the coords.
         * @param {*} z 
         * @param {*} x 
         * @param {*} y 
         */

    }, {
        key: '_buildTileUrl',
        value: function _buildTileUrl(z, x, y) {
            var url = this._url;
            url = url.replace(/{z}/, z);
            url = url.replace(/{x}/, x);
            url = url.replace(/{y}/, y);
            return url;
        }

        /**
         * Get the data from a map event.
         * Using the event coords, get the data from the grid.json data stored in the cache.
         * 
         * This method Trigger an event with a `data` property. 
         */

    }, {
        key: '_objectForEvent',
        value: function _objectForEvent(e, eventType) {
            var point = this._map.project(e);
            // 4 pixels asigned to each grid in the utfGrid.
            var resolution = 4;
            // get the tile coords to which the pixel belongs

            var _unscale2 = this._unscale(point, this._tileSize),
                x = _unscale2.x,
                y = _unscale2.y;

            var max = Math.pow(2, this._map.getZoom());
            x = (x + max) % max;
            y = (y + max) % max;

            var tile = this._cache[this._map.getZoom() + '_' + x + '_' + y];

            if (tile && tile.grid) {
                var gridX = Math.floor((point.x - x * this._tileSize) / resolution);
                var gridY = Math.floor((point.y - y * this._tileSize) / resolution);
                var idx = this._utfDecode(tile.grid[gridY].charCodeAt(gridX));
                var key = tile.keys[idx];
                if (tile.data.hasOwnProperty(key)) {
                    // Extend the event with the data from the grid json
                    e.data = tile.data[key];
                }
            }

            // Add "e" property for backwards compatibility with wax.
            e.e = e.originalEvent || { type: eventType };

            this._triggerEvent(eventType, e);
        }

        /**
         */

    }, {
        key: '_triggerEvent',
        value: function _triggerEvent(eventType, extendedEvent) {
            // If there is no data dont do anything!
            if (!extendedEvent.data) {
                this._eventEmitter.dispatchEvent('featureout', {});
                return;
            }
            if (eventType === 'mousemove') {
                this._eventEmitter.dispatchEvent('mousemove', extendedEvent);
                return;
            }
            if (eventType === 'click') {
                this._eventEmitter.dispatchEvent('featureout', {});
                this._eventEmitter.dispatchEvent('click', extendedEvent);
            }
        }

        /**
         * Remove interactivity
         */

    }, {
        key: 'remove',
        value: function remove() {
            this._eventEmitter.removeEventListener('mousemove');
            this._eventEmitter.removeEventListener('click');
            this._eventEmitter.removeEventListener('error');
            this._eventEmitter.removeEventListener('featureout');
        }

        /**
         * Decode an utf gridjson cell
         * @see https://github.com/mapbox/utfgrid-spec/blob/master/1.3/utfgrid.md
         * @param {string} char 
         */

    }, {
        key: '_utfDecode',
        value: function _utfDecode(char) {
            if (char >= 93) {
                char--;
            }
            if (char >= 35) {
                char--;
            }
            return char - 32;
        }
    }]);

    return Interactive;
}();

module.exports = { Interactive: Interactive };

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var GoogleMap = __webpack_require__(2);
var LeafletMap = __webpack_require__(3);

function Map(nativeMap) {
    if (nativeMap.__gm) {
        return new GoogleMap(nativeMap);
    } else {
        return new LeafletMap(nativeMap);
    }
}
module.exports = Map;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GoogleMap = function () {
    function GoogleMap(nativeMap) {
        _classCallCheck(this, GoogleMap);

        this._map = nativeMap;
    }

    /**
     * Return the pixel coordinates of an event at a certain zoom level.
     */


    _createClass(GoogleMap, [{
        key: "project",
        value: function project(event) {
            var latLng = event.latLng;
            var point = this._map.getProjection().fromLatLngToPoint(latLng);
            var scale = Math.pow(2, this.getZoom());
            return {
                x: Math.floor(scale * point.x),
                y: Math.floor(scale * point.y)
            };
        }
    }, {
        key: "getZoom",
        value: function getZoom() {
            return this._map.getZoom();
        }
    }, {
        key: "on",
        value: function on(event, callback) {
            this._map.addListener(event, callback);
        }
    }]);

    return GoogleMap;
}();

module.exports = GoogleMap;

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LeafletMap = function () {
    function LeafletMap(nativeMap) {
        _classCallCheck(this, LeafletMap);

        this._map = nativeMap;
    }

    // LatLong to pixel coords


    _createClass(LeafletMap, [{
        key: "project",
        value: function project(event) {
            var latlng = event.latlng;
            return this._map.project(latlng, this._map.getZoom()).floor();
        }
    }, {
        key: "getZoom",
        value: function getZoom() {
            return this._map.getZoom();
        }
    }, {
        key: "on",
        value: function on(event, callback) {
            this._map.on(event, callback);
        }
    }]);

    return LeafletMap;
}();

module.exports = LeafletMap;

/***/ })
/******/ ]);
});
//# sourceMappingURL=gridjson.bundle.js.map
