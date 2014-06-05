
var assert = {
  ok: function(value, message) {
    message = message || '';
    if(!value) throw new Error("assertion failed", message);
  }
};

if (navigator.userAgent.indexOf('MSIE 8.0') !== -1 || navigator.userAgent.indexOf('MSIE 7.0') !== -1) {
  Object.defineProperty = function(o, p, fn) { o[p] = fn.value; };
}



var carto_initialize = function(carto, uri, callback) {
  callback();
};
window.carto = window.carto || {};

var _mapnik_reference_latest = {
    "version": "2.1.1",
    "style": {
        "filter-mode": {
            "type": [
                "all",
                "first"
            ],
            "doc": "Control the processing behavior of Rule filters within a Style. If 'all' is used then all Rules are processed sequentially independent of whether any previous filters matched. If 'first' is used then it means processing ends after the first match (a positive filter evaluation) and no further Rules in the Style are processed ('first' is usually the default for CSS implementations on top of Mapnik to simplify translation from CSS to Mapnik XML)",
            "default-value": "all",
            "default-meaning": "All Rules in a Style are processed whether they have filters or not and whether or not the filter conditions evaluate to true."
        },
        "image-filters": {
            "css": "image-filters",
            "default-value": "none",
            "default-meaning": "no filters",
            "type": "functions",
            "functions": [
                ["agg-stack-blur", 2],
                ["emboss", 0],
                ["blur", 0],
                ["gray", 0],
                ["sobel", 0],
                ["edge-detect", 0],
                ["x-gradient", 0],
                ["y-gradient", 0],
                ["invert", 0],
                ["sharpen", 0]
            ],
            "doc": "A list of image filters."
        },
        "comp-op": {
            "css": "comp-op",
            "default-value": "src-over",
            "default-meaning": "add the current layer on top of other layers",
            "doc": "Composite operation. This defines how this layer should behave relative to layers atop or below it.",
            "type": ["clear",
                "src",
                "dst",
                "src-over",
                "source-over", // added for torque
                "dst-over",
                "src-in",
                "dst-in",
                "src-out",
                "dst-out",
                "src-atop",
                "dst-atop",
                "xor",
                "plus",
                "minus",
                "multiply",
                "screen",
                "overlay",
                "darken",
                "lighten",
                "lighter", // added for torque
                "color-dodge",
                "color-burn",
                "hard-light",
                "soft-light",
                "difference",
                "exclusion",
                "contrast",
                "invert",
                "invert-rgb",
                "grain-merge",
                "grain-extract",
                "hue",
                "saturation",
                "color",
                "value"
            ]
        },
        "opacity": {
            "css": "opacity",
            "type": "float",
            "doc": "An alpha value for the style (which means an alpha applied to all features in separate buffer and then composited back to main buffer)",
            "default-value": 1,
            "default-meaning": "no separate buffer will be used and no alpha will be applied to the style after rendering"
        }
    },
    "layer" : {
        "name": {
            "default-value": "",
            "type":"string",
            "required" : true,
            "default-meaning": "No layer name has been provided",
            "doc": "The name of a layer. Can be anything you wish and is not strictly validated, but ideally unique  in the map"
        },
        "srs": {
            "default-value": "",
            "type":"string",
            "default-meaning": "No srs value is provided and the value will be inherited from the Map's srs",
            "doc": "The spatial reference system definition for the layer, aka the projection. Can either be a proj4 literal string like '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs' or, if the proper proj4 epsg/nad/etc identifier files are installed, a string that uses an id like: '+init=epsg:4326'"
        },
        "status": {
            "default-value": true,
            "type":"boolean",
            "default-meaning": "This layer will be marked as active and available for processing",
            "doc": "A property that can be set to false to disable this layer from being processed"
        },
        "minzoom": {
            "default-value": "0",
            "type":"float",
            "default-meaning": "The layer will be visible at the minimum possible scale",
            "doc": "The minimum scale denominator that this layer will be visible at. A layer's visibility is determined by whether its status is true and if the Map scale >= minzoom - 1e-6 and scale < maxzoom + 1e-6"
        },
        "maxzoom": {
            "default-value": "1.79769e+308",
            "type":"float",
            "default-meaning": "The layer will be visible at the maximum possible scale",
            "doc": "The maximum scale denominator that this layer will be visible at. The default is the numeric limit of the C++ double type, which may vary slightly by system, but is likely a massive number like 1.79769e+308 and ensures that this layer will always be visible unless the value is reduced. A layer's visibility is determined by whether its status is true and if the Map scale >= minzoom - 1e-6 and scale < maxzoom + 1e-6"
        },
        "queryable": {
            "default-value": false,
            "type":"boolean",
            "default-meaning": "The layer will not be available for the direct querying of data values",
            "doc": "This property was added for GetFeatureInfo/WMS compatibility and is rarely used. It is off by default meaning that in a WMS context the layer will not be able to be queried unless the property is explicitly set to true"
        },
        "clear-label-cache": {
            "default-value": false,
            "type":"boolean",
            "default-meaning": "The renderer's collision detector cache (used for avoiding duplicate labels and overlapping markers) will not be cleared immediately before processing this layer",
            "doc": "This property, by default off, can be enabled to allow a user to clear the collision detector cache before a given layer is processed. This may be desirable to ensure that a given layers data shows up on the map even if it normally would not because of collisions with previously rendered labels or markers"
        },
        "group-by": {
            "default-value": "",
            "type":"string",
            "default-meaning": "No special layer grouping will be used during rendering",
            "doc": "https://github.com/mapnik/mapnik/wiki/Grouped-rendering"
        },
        "buffer-size": {
            "default-value": "0",
            "type":"float",
            "default-meaning": "No buffer will be used",
            "doc": "Extra tolerance around the Layer extent (in pixels) used to when querying and (potentially) clipping the layer data during rendering"
        },
        "maximum-extent": {
            "default-value": "none",
            "type":"bbox",
            "default-meaning": "No clipping extent will be used",
            "doc": "An extent to be used to limit the bounds used to query this specific layer data during rendering. Should be minx, miny, maxx, maxy in the coordinates of the Layer."
        }
    },
    "symbolizers" : {
        "*": {
            "image-filters": {
                "css": "image-filters",
                "default-value": "none",
                "default-meaning": "no filters",
                "type": "functions",
                "functions": [
                    ["agg-stack-blur", 2],
                    ["emboss", 0],
                    ["blur", 0],
                    ["gray", 0],
                    ["sobel", 0],
                    ["edge-detect", 0],
                    ["x-gradient", 0],
                    ["y-gradient", 0],
                    ["invert", 0],
                    ["sharpen", 0]
                ],
                "doc": "A list of image filters."
            },
            "comp-op": {
                "css": "comp-op",
                "default-value": "src-over",
                "default-meaning": "add the current layer on top of other layers",
                "doc": "Composite operation. This defines how this layer should behave relative to layers atop or below it.",
                "type": ["clear",
                    "src",
                    "dst",
                    "src-over",
                    "source-over", // added for torque
                    "dst-over",
                    "src-in",
                    "dst-in",
                    "src-out",
                    "dst-out",
                    "src-atop",
                    "dst-atop",
                    "xor",
                    "plus",
                    "minus",
                    "multiply",
                    "screen",
                    "overlay",
                    "darken",
                    "lighten",
                    "lighter", // added for torque
                    "color-dodge",
                    "color-burn",
                    "hard-light",
                    "soft-light",
                    "difference",
                    "exclusion",
                    "contrast",
                    "invert",
                    "invert-rgb",
                    "grain-merge",
                    "grain-extract",
                    "hue",
                    "saturation",
                    "color",
                    "value"
                ]
            },
            "opacity": {
                "css": "opacity",
                "type": "float",
                "doc": "An alpha value for the style (which means an alpha applied to all features in separate buffer and then composited back to main buffer)",
                "default-value": 1,
                "default-meaning": "no separate buffer will be used and no alpha will be applied to the style after rendering"
            }
        },
        "map": {
            "background-color": {
                "css": "background-color",
                "default-value": "none",
                "default-meaning": "transparent",
                "type": "color",
                "doc": "Map Background color"
            },
            "background-image": {
                "css": "background-image",
                "type": "uri",
                "default-value": "",
                "default-meaning": "transparent",
                "doc": "An image that is repeated below all features on a map as a background.",
                "description": "Map Background image"
            },
            "srs": {
                "css": "srs",
                "type": "string",
                "default-value": "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs",
                "default-meaning": "The proj4 literal of EPSG:4326 is assumed to be the Map's spatial reference and all data from layers within this map will be plotted using this coordinate system. If any layers do not declare an srs value then they will be assumed to be in the same srs as the Map and not transformations will be needed to plot them in the Map's coordinate space",
                "doc": "Map spatial reference (proj4 string)"
            },
            "buffer-size": {
                "css": "buffer-size",
                "default-value": "0",
                "type":"float",
                "default-meaning": "No buffer will be used",
                "doc": "Extra tolerance around the map (in pixels) used to ensure labels crossing tile boundaries are equally rendered in each tile (e.g. cut in each tile). Not intended to be used in combination with \"avoid-edges\"."
            },
            "maximum-extent": {
                "css": "",
                "default-value": "none",
                "type":"bbox",
                "default-meaning": "No clipping extent will be used",
                "doc": "An extent to be used to limit the bounds used to query all layers during rendering. Should be minx, miny, maxx, maxy in the coordinates of the Map."
            },
            "base": {
                "css": "base",
                "default-value": "",
                "default-meaning": "This base path defaults to an empty string meaning that any relative paths to files referenced in styles or layers will be interpreted relative to the application process.",
                "type": "string",
                "doc": "Any relative paths used to reference files will be understood as relative to this directory path if the map is loaded from an in memory object rather than from the filesystem. If the map is loaded from the filesystem and this option is not provided it will be set to the directory of the stylesheet."
            },
            "paths-from-xml": {
                "css": "",
                "default-value": true,
                "default-meaning": "Paths read from XML will be interpreted from the location of the XML",
                "type": "boolean",
                "doc": "value to control whether paths in the XML will be interpreted from the location of the XML or from the working directory of the program that calls load_map()"
            },
            "minimum-version": {
                "css": "",
                "default-value": "none",
                "default-meaning": "Mapnik version will not be detected and no error will be thrown about compatibility",
                "type": "string",
                "doc": "The minumum Mapnik version (e.g. 0.7.2) needed to use certain functionality in the stylesheet"
            },
            "font-directory": {
                "css": "font-directory",
                "type": "uri",
                "default-value": "none",
                "default-meaning": "No map-specific fonts will be registered",
                "doc": "Path to a directory which holds fonts which should be registered when the Map is loaded (in addition to any fonts that may be automatically registered)."
            }
        },
        "polygon": {
            "fill": {
                "css": "polygon-fill",
                "type": "color",
                "default-value": "rgba(128,128,128,1)",
                "default-meaning": "gray and fully opaque (alpha = 1), same as rgb(128,128,128)",
                "doc": "Fill color to assign to a polygon"
            },
            "fill-opacity": {
                "css": "polygon-opacity",
                "type": "float",
                "doc": "The opacity of the polygon",
                "default-value": 1,
                "default-meaning": "opaque"
            },
            "gamma": {
                "css": "polygon-gamma",
                "type": "float",
                "default-value": 1,
                "default-meaning": "fully antialiased",
                "range": "0-1",
                "doc": "Level of antialiasing of polygon edges"
            },
            "gamma-method": {
                "css": "polygon-gamma-method",
                "type": [
                    "power",
                    "linear",
                    "none",
                    "threshold",
                    "multiply"
                ],
                "default-value": "power",
                "default-meaning": "pow(x,gamma) is used to calculate pixel gamma, which produces slightly smoother line and polygon antialiasing than the 'linear' method, while other methods are usually only used to disable AA",
                "doc": "An Antigrain Geometry specific rendering hint to control the quality of antialiasing. Under the hood in Mapnik this method is used in combination with the 'gamma' value (which defaults to 1). The methods are in the AGG source at https://github.com/mapnik/mapnik/blob/master/deps/agg/include/agg_gamma_functions.h"
            },
            "clip": {
                "css": "polygon-clip",
                "type": "boolean",
                "default-value": true,
                "default-meaning": "geometry will be clipped to map bounds before rendering",
                "doc": "geometries are clipped to map bounds by default for best rendering performance. In some cases users may wish to disable this to avoid rendering artifacts."
            },
            "smooth": {
                "css": "polygon-smooth",
                "type": "float",
                "default-value": 0,
                "default-meaning": "no smoothing",
                "range": "0-1",
                "doc": "Smooths out geometry angles. 0 is no smoothing, 1 is fully smoothed. Values greater than 1 will produce wild, looping geometries."
            },
            "geometry-transform": {
                "css": "polygon-geometry-transform",
                "type": "functions",
                "default-value": "none",
                "default-meaning": "geometry will not be transformed",
                "doc": "Allows transformation functions to be applied to the geometry.",
                "functions": [
                    ["matrix", 6],
                    ["translate", 2],
                    ["scale", 2],
                    ["rotate", 3],
                    ["skewX", 1],
                    ["skewY", 1]
                ]
            },
            "comp-op": {
                "css": "polygon-comp-op",
                "default-value": "src-over",
                "default-meaning": "add the current symbolizer on top of other symbolizer",
                "doc": "Composite operation. This defines how this symbolizer should behave relative to symbolizers atop or below it.",
                "type": ["clear",
                    "src",
                    "dst",
                    "src-over",
                    "dst-over",
                    "src-in",
                    "dst-in",
                    "src-out",
                    "dst-out",
                    "src-atop",
                    "dst-atop",
                    "xor",
                    "plus",
                    "minus",
                    "multiply",
                    "screen",
                    "overlay",
                    "darken",
                    "lighten",
                    "color-dodge",
                    "color-burn",
                    "hard-light",
                    "soft-light",
                    "difference",
                    "exclusion",
                    "contrast",
                    "invert",
                    "invert-rgb",
                    "grain-merge",
                    "grain-extract",
                    "hue",
                    "saturation",
                    "color",
                    "value"
                ]
            }
        },
        "line": {
            "stroke": {
                "css": "line-color",
                "default-value": "rgba(0,0,0,1)",
                "type": "color",
                "default-meaning": "black and fully opaque (alpha = 1), same as rgb(0,0,0)",
                "doc": "The color of a drawn line"
            },
            "stroke-width": {
                "css": "line-width",
                "default-value": 1,
                "type": "float",
                "doc": "The width of a line in pixels"
            },
            "stroke-opacity": {
                "css": "line-opacity",
                "default-value": 1,
                "type": "float",
                "default-meaning": "opaque",
                "doc": "The opacity of a line"
            },
            "stroke-linejoin": {
                "css": "line-join",
                "default-value": "miter",
                "type": [
                    "miter",
                    "round",
                    "bevel"
                ],
                "doc": "The behavior of lines when joining"
            },
            "stroke-linecap": {
                "css": "line-cap",
                "default-value": "butt",
                "type": [
                    "butt",
                    "round",
                    "square"
                ],
                "doc": "The display of line endings"
            },
            "stroke-gamma": {
                "css": "line-gamma",
                "type": "float",
                "default-value": 1,
                "default-meaning": "fully antialiased",
                "range": "0-1",
                "doc": "Level of antialiasing of stroke line"
            },
            "stroke-gamma-method": {
                "css": "line-gamma-method",
                "type": [
                    "power",
                    "linear",
                    "none",
                    "threshold",
                    "multiply"
                ],
                "default-value": "power",
                "default-meaning": "pow(x,gamma) is used to calculate pixel gamma, which produces slightly smoother line and polygon antialiasing than the 'linear' method, while other methods are usually only used to disable AA",
                "doc": "An Antigrain Geometry specific rendering hint to control the quality of antialiasing. Under the hood in Mapnik this method is used in combination with the 'gamma' value (which defaults to 1). The methods are in the AGG source at https://github.com/mapnik/mapnik/blob/master/deps/agg/include/agg_gamma_functions.h"
            },
            "stroke-dasharray": {
                "css": "line-dasharray",
                "type": "numbers",
                "doc": "A pair of length values [a,b], where (a) is the dash length and (b) is the gap length respectively. More than two values are supported for more complex patterns.",
                "default-value": "none",
                "default-meaning": "solid line"
            },
            "stroke-dashoffset": {
                "css": "line-dash-offset",
                "type": "numbers",
                "doc": "valid parameter but not currently used in renderers (only exists for experimental svg support in Mapnik which is not yet enabled)",
                "default-value": "none",
                "default-meaning": "solid line"
            },
            "stroke-miterlimit": {
                "css": "line-miterlimit",
                "type": "float",
                "doc": "The limit on the ratio of the miter length to the stroke-width. Used to automatically convert miter joins to bevel joins for sharp angles to avoid the miter extending beyond the thickness of the stroking path. Normally will not need to be set, but a larger value can sometimes help avoid jaggy artifacts.",
                "default-value": 4.0,
                "default-meaning": "Will auto-convert miters to bevel line joins when theta is less than 29 degrees as per the SVG spec: 'miterLength / stroke-width = 1 / sin ( theta / 2 )'"
            },
            "clip": {
                "css": "line-clip",
                "type": "boolean",
                "default-value": true,
                "default-meaning": "geometry will be clipped to map bounds before rendering",
                "doc": "geometries are clipped to map bounds by default for best rendering performance. In some cases users may wish to disable this to avoid rendering artifacts."
            },
            "smooth": {
                "css": "line-smooth",
                "type": "float",
                "default-value": 0,
                "default-meaning": "no smoothing",
                "range": "0-1",
                "doc": "Smooths out geometry angles. 0 is no smoothing, 1 is fully smoothed. Values greater than 1 will produce wild, looping geometries."
            },
            "offset": {
                "css": "line-offset",
                "type": "float",
                "default-value": 0,
                "default-meaning": "no offset",
                "doc": "Offsets a line a number of pixels parallel to its actual path. Postive values move the line left, negative values move it right (relative to the directionality of the line)."
            },
            "rasterizer": {
                "css": "line-rasterizer",
                "type": [
                    "full",
                    "fast"
                ],
                "default-value": "full",
                "doc": "Exposes an alternate AGG rendering method that sacrifices some accuracy for speed."
            },
            "geometry-transform": {
                "css": "line-geometry-transform",
                "type": "functions",
                "default-value": "none",
                "default-meaning": "geometry will not be transformed",
                "doc": "Allows transformation functions to be applied to the geometry.",
                "functions": [
                    ["matrix", 6],
                    ["translate", 2],
                    ["scale", 2],
                    ["rotate", 3],
                    ["skewX", 1],
                    ["skewY", 1]
                ]
            },
            "comp-op": {
                "css": "line-comp-op",
                "default-value": "src-over",
                "default-meaning": "add the current symbolizer on top of other symbolizer",
                "doc": "Composite operation. This defines how this symbolizer should behave relative to symbolizers atop or below it.",
                "type": ["clear",
                    "src",
                    "dst",
                    "src-over",
                    "dst-over",
                    "src-in",
                    "dst-in",
                    "src-out",
                    "dst-out",
                    "src-atop",
                    "dst-atop",
                    "xor",
                    "plus",
                    "minus",
                    "multiply",
                    "screen",
                    "overlay",
                    "darken",
                    "lighten",
                    "color-dodge",
                    "color-burn",
                    "hard-light",
                    "soft-light",
                    "difference",
                    "exclusion",
                    "contrast",
                    "invert",
                    "invert-rgb",
                    "grain-merge",
                    "grain-extract",
                    "hue",
                    "saturation",
                    "color",
                    "value"
                ]
            }
        },
        "markers": {
            "file": {
                "css": "marker-file",
                "doc": "An SVG file that this marker shows at each placement. If no file is given, the marker will show an ellipse.",
                "default-value": "",
                "default-meaning": "An ellipse or circle, if width equals height",
                "type": "uri"
            },
            "opacity": {
                "css": "marker-opacity",
                "doc": "The overall opacity of the marker, if set, overrides both the opacity of both the fill and stroke",
                "default-value": 1,
                "default-meaning": "The stroke-opacity and fill-opacity will be used",
                "type": "float"
            },
            "fill-opacity": {
                "css": "marker-fill-opacity",
                "doc": "The fill opacity of the marker",
                "default-value": 1,
                "default-meaning": "opaque",
                "type": "float"
            },
            "stroke": {
                "css": "marker-line-color",
                "doc": "The color of the stroke around a marker shape.",
                "default-value": "black",
                "type": "color"
            },
            "stroke-width": {
                "css": "marker-line-width",
                "doc": "The width of the stroke around a marker shape, in pixels. This is positioned on the boundary, so high values can cover the area itself.",
                "type": "float"
            },
            "stroke-opacity": {
                "css": "marker-line-opacity",
                "default-value": 1,
                "default-meaning": "opaque",
                "doc": "The opacity of a line",
                "type": "float"
            },
            "placement": {
                "css": "marker-placement",
                "type": [
                    "point",
                    "line",
                    "interior"
                ],
                "default-value": "point",
                "default-meaning": "Place markers at the center point (centroid) of the geometry",
                "doc": "Attempt to place markers on a point, in the center of a polygon, or if markers-placement:line, then multiple times along a line. 'interior' placement can be used to ensure that points placed on polygons are forced to be inside the polygon interior"
            },
            "multi-policy": {
                "css": "marker-multi-policy",
                "type": [
                    "each",
                    "whole",
                    "largest"
                ],
                "default-value": "each",
                "default-meaning": "If a feature contains multiple geometries and the placement type is either point or interior then a marker will be rendered for each",
                "doc": "A special setting to allow the user to control rendering behavior for 'multi-geometries' (when a feature contains multiple geometries). This setting does not apply to markers placed along lines. The 'each' policy is default and means all geometries will get a marker. The 'whole' policy means that the aggregate centroid between all geometries will be used. The 'largest' policy means that only the largest (by bounding box areas) feature will get a rendered marker (this is how text labeling behaves by default)."
            },
            "marker-type": {
                "css": "marker-type",
                "type": [
                    "arrow",
                    "ellipse",
                    "rectangle"
                ],
                "default-value": "ellipse",
                "doc": "The default marker-type. If a SVG file is not given as the marker-file parameter, the renderer provides either an arrow or an ellipse (a circle if height is equal to width)"
            },
            "width": {
                "css": "marker-width",
                "default-value": 10,
                "doc": "The width of the marker, if using one of the default types.",
                "type": "expression"
            },
            "height": {
                "css": "marker-height",
                "default-value": 10,
                "doc": "The height of the marker, if using one of the default types.",
                "type": "expression"
            },
            "fill": {
                "css": "marker-fill",
                "default-value": "blue",
                "doc": "The color of the area of the marker.",
                "type": "color"
            },
            "allow-overlap": {
                "css": "marker-allow-overlap",
                "type": "boolean",
                "default-value": false,
                "doc": "Control whether overlapping markers are shown or hidden.",
                "default-meaning": "Do not allow makers to overlap with each other - overlapping markers will not be shown."
            },
            "ignore-placement": {
                "css": "marker-ignore-placement",
                "type": "boolean",
                "default-value": false,
                "default-meaning": "do not store the bbox of this geometry in the collision detector cache",
                "doc": "value to control whether the placement of the feature will prevent the placement of other features"
            },
            "spacing": {
                "css": "marker-spacing",
                "doc": "Space between repeated labels",
                "default-value": 100,
                "type": "float"
            },
            "max-error": {
                "css": "marker-max-error",
                "type": "float",
                "default-value": 0.2,
                "doc": "The maximum difference between actual marker placement and the marker-spacing parameter. Setting a high value can allow the renderer to try to resolve placement conflicts with other symbolizers."
            },
            "transform": {
                "css": "marker-transform",
                "type": "functions",
                "functions": [
                    ["matrix", 6],
                    ["translate", 2],
                    ["scale", 2],
                    ["rotate", 3],
                    ["skewX", 1],
                    ["skewY", 1]
                ],
                "default-value": "",
                "default-meaning": "No transformation",
                "doc": "SVG transformation definition"
            },
            "clip": {
                "css": "marker-clip",
                "type": "boolean",
                "default-value": true,
                "default-meaning": "geometry will be clipped to map bounds before rendering",
                "doc": "geometries are clipped to map bounds by default for best rendering performance. In some cases users may wish to disable this to avoid rendering artifacts."
            },
            "smooth": {
                "css": "marker-smooth",
                "type": "float",
                "default-value": 0,
                "default-meaning": "no smoothing",
                "range": "0-1",
                "doc": "Smooths out geometry angles. 0 is no smoothing, 1 is fully smoothed. Values greater than 1 will produce wild, looping geometries."
            },
            "geometry-transform": {
                "css": "marker-geometry-transform",
                "type": "functions",
                "default-value": "none",
                "default-meaning": "geometry will not be transformed",
                "doc": "Allows transformation functions to be applied to the geometry.",
                "functions": [
                    ["matrix", 6],
                    ["translate", 2],
                    ["scale", 2],
                    ["rotate", 3],
                    ["skewX", 1],
                    ["skewY", 1]
                ]
            },
            "comp-op": {
                "css": "marker-comp-op",
                "default-value": "src-over",
                "default-meaning": "add the current symbolizer on top of other symbolizer",
                "doc": "Composite operation. This defines how this symbolizer should behave relative to symbolizers atop or below it.",
                "type": ["clear",
                    "src",
                    "dst",
                    "src-over",
                    "dst-over",
                    "src-in",
                    "dst-in",
                    "src-out",
                    "dst-out",
                    "src-atop",
                    "dst-atop",
                    "xor",
                    "plus",
                    "minus",
                    "multiply",
                    "screen",
                    "overlay",
                    "darken",
                    "lighten",
                    "color-dodge",
                    "color-burn",
                    "hard-light",
                    "soft-light",
                    "difference",
                    "exclusion",
                    "contrast",
                    "invert",
                    "invert-rgb",
                    "grain-merge",
                    "grain-extract",
                    "hue",
                    "saturation",
                    "color",
                    "value"
                ]
            }
        },
        "shield": {
            "name": {
                "css": "shield-name",
                "type": "expression",
                "serialization": "content",
                "doc": "Value to use for a shield\"s text label. Data columns are specified using brackets like [column_name]"
            },
            "file": {
                "css": "shield-file",
                "required": true,
                "type": "uri",
                "default-value": "none",
                "doc": "Image file to render behind the shield text"
            },
            "face-name": {
                "css": "shield-face-name",
                "type": "string",
                "validate": "font",
                "doc": "Font name and style to use for the shield text",
                "default-value": "",
                "required": true
            },
            "unlock-image": {
                "css": "shield-unlock-image",
                "type": "boolean",
                "doc": "This parameter should be set to true if you are trying to position text beside rather than on top of the shield image",
                "default-value": false,
                "default-meaning": "text alignment relative to the shield image uses the center of the image as the anchor for text positioning."
            },
            "size": {
                "css": "shield-size",
                "type": "float",
                "doc": "The size of the shield text in pixels"
            },
            "fill": {
                "css": "shield-fill",
                "type": "color",
                "doc": "The color of the shield text"
            },
            "placement": {
                "css": "shield-placement",
                "type": [
                    "point",
                    "line",
                    "vertex",
                    "interior"
                ],
                "default-value": "point",
                "doc": "How this shield should be placed. Point placement attempts to place it on top of points, line places along lines multiple times per feature, vertex places on the vertexes of polygons, and interior attempts to place inside of polygons."
            },
            "avoid-edges": {
                "css": "shield-avoid-edges",
                "doc": "Tell positioning algorithm to avoid labeling near intersection edges.",
                "type": "boolean",
                "default-value": false
            },
            "allow-overlap": {
                "css": "shield-allow-overlap",
                "type": "boolean",
                "default-value": false,
                "doc": "Control whether overlapping shields are shown or hidden.",
                "default-meaning": "Do not allow shields to overlap with other map elements already placed."
            },
            "minimum-distance": {
                "css": "shield-min-distance",
                "type": "float",
                "default-value": 0,
                "doc": "Minimum distance to the next shield symbol, not necessarily the same shield."
            },
            "spacing": {
                "css": "shield-spacing",
                "type": "float",
                "default-value": 0,
                "doc": "The spacing between repeated occurrences of the same shield on a line"
            },
            "minimum-padding": {
                "css": "shield-min-padding",
                "default-value": 0,
                "doc": "Determines the minimum amount of padding that a shield gets relative to other shields",
                "type": "float"
            },
            "wrap-width": {
                "css": "shield-wrap-width",
                "type": "unsigned",
                "default-value": 0,
                "doc": "Length of a chunk of text in characters before wrapping text"
            },
            "wrap-before": {
                "css": "shield-wrap-before",
                "type": "boolean",
                "default-value": false,
                "doc": "Wrap text before wrap-width is reached. If false, wrapped lines will be a bit longer than wrap-width."
            },
            "wrap-character": {
                "css": "shield-wrap-character",
                "type": "string",
                "default-value": " ",
                "doc": "Use this character instead of a space to wrap long names."
            },
            "halo-fill": {
                "css": "shield-halo-fill",
                "type": "color",
                "default-value": "#FFFFFF",
                "default-meaning": "white",
                "doc": "Specifies the color of the halo around the text."
            },
            "halo-radius": {
                "css": "shield-halo-radius",
                "doc": "Specify the radius of the halo in pixels",
                "default-value": 0,
                "default-meaning": "no halo",
                "type": "float"
            },
            "character-spacing": {
                "css": "shield-character-spacing",
                "type": "unsigned",
                "default-value": 0,
                "doc": "Horizontal spacing between characters (in pixels). Currently works for point placement only, not line placement."
            },
            "line-spacing": {
                "css": "shield-line-spacing",
                "doc": "Vertical spacing between lines of multiline labels (in pixels)",
                "type": "unsigned"
            },
            "dx": {
                "css": "shield-text-dx",
                "type": "float",
                "doc": "Displace text within shield by fixed amount, in pixels, +/- along the X axis.  A positive value will shift the text right",
                "default-value": 0
            },
            "dy": {
                "css": "shield-text-dy",
                "type": "float",
                "doc": "Displace text within shield by fixed amount, in pixels, +/- along the Y axis.  A positive value will shift the text down",
                "default-value": 0
            },
            "shield-dx": {
                "css": "shield-dx",
                "type": "float",
                "doc": "Displace shield by fixed amount, in pixels, +/- along the X axis.  A positive value will shift the text right",
                "default-value": 0
            },
            "shield-dy": {
                "css": "shield-dy",
                "type": "float",
                "doc": "Displace shield by fixed amount, in pixels, +/- along the Y axis.  A positive value will shift the text down",
                "default-value": 0
            },
            "opacity": {
                "css": "shield-opacity",
                "type": "float",
                "doc": "(Default 1.0) - opacity of the image used for the shield",
                "default-value": 1
            },
            "text-opacity": {
                "css": "shield-text-opacity",
                "type": "float",
                "doc": "(Default 1.0) - opacity of the text placed on top of the shield",
                "default-value": 1
            },
            "horizontal-alignment": {
                "css": "shield-horizontal-alignment",
                "type": [
                    "left",
                    "middle",
                    "right",
                    "auto"
                ],
                "doc": "The shield's horizontal alignment from its centerpoint",
                "default-value": "auto"
            },
            "vertical-alignment": {
                "css": "shield-vertical-alignment",
                "type": [
                    "top",
                    "middle",
                    "bottom",
                    "auto"
                ],
                "doc": "The shield's vertical alignment from its centerpoint",
                "default-value": "middle"
            },
            "text-transform": {
                "css": "shield-text-transform",
                "type": [
                    "none",
                    "uppercase",
                    "lowercase",
                    "capitalize"
                ],
                "doc": "Transform the case of the characters",
                "default-value": "none"
            },
            "justify-alignment": {
                "css": "shield-justify-alignment",
                "type": [
                    "left",
                    "center",
                    "right",
                    "auto"
                ],
                "doc": "Define how text in a shield's label is justified",
                "default-value": "auto"
            },
            "clip": {
                "css": "shield-clip",
                "type": "boolean",
                "default-value": true,
                "default-meaning": "geometry will be clipped to map bounds before rendering",
                "doc": "geometries are clipped to map bounds by default for best rendering performance. In some cases users may wish to disable this to avoid rendering artifacts."
            },
            "comp-op": {
                "css": "shield-comp-op",
                "default-value": "src-over",
                "default-meaning": "add the current symbolizer on top of other symbolizer",
                "doc": "Composite operation. This defines how this symbolizer should behave relative to symbolizers atop or below it.",
                "type": ["clear",
                    "src",
                    "dst",
                    "src-over",
                    "dst-over",
                    "src-in",
                    "dst-in",
                    "src-out",
                    "dst-out",
                    "src-atop",
                    "dst-atop",
                    "xor",
                    "plus",
                    "minus",
                    "multiply",
                    "screen",
                    "overlay",
                    "darken",
                    "lighten",
                    "color-dodge",
                    "color-burn",
                    "hard-light",
                    "soft-light",
                    "difference",
                    "exclusion",
                    "contrast",
                    "invert",
                    "invert-rgb",
                    "grain-merge",
                    "grain-extract",
                    "hue",
                    "saturation",
                    "color",
                    "value"
                ]
            }
        },
        "line-pattern": {
            "file": {
                "css": "line-pattern-file",
                "type": "uri",
                "default-value": "none",
                "required": true,
                "doc": "An image file to be repeated and warped along a line"
            },
            "clip": {
                "css": "line-pattern-clip",
                "type": "boolean",
                "default-value": true,
                "default-meaning": "geometry will be clipped to map bounds before rendering",
                "doc": "geometries are clipped to map bounds by default for best rendering performance. In some cases users may wish to disable this to avoid rendering artifacts."
            },
            "smooth": {
                "css": "line-pattern-smooth",
                "type": "float",
                "default-value": 0,
                "default-meaning": "no smoothing",
                "range": "0-1",
                "doc": "Smooths out geometry angles. 0 is no smoothing, 1 is fully smoothed. Values greater than 1 will produce wild, looping geometries."
            },
            "geometry-transform": {
                "css": "line-pattern-geometry-transform",
                "type": "functions",
                "default-value": "none",
                "default-meaning": "geometry will not be transformed",
                "doc": "Allows transformation functions to be applied to the geometry.",
                "functions": [
                    ["matrix", 6],
                    ["translate", 2],
                    ["scale", 2],
                    ["rotate", 3],
                    ["skewX", 1],
                    ["skewY", 1]
                ]
            },
            "comp-op": {
                "css": "line-pattern-comp-op",
                "default-value": "src-over",
                "default-meaning": "add the current symbolizer on top of other symbolizer",
                "doc": "Composite operation. This defines how this symbolizer should behave relative to symbolizers atop or below it.",
                "type": ["clear",
                    "src",
                    "dst",
                    "src-over",
                    "dst-over",
                    "src-in",
                    "dst-in",
                    "src-out",
                    "dst-out",
                    "src-atop",
                    "dst-atop",
                    "xor",
                    "plus",
                    "minus",
                    "multiply",
                    "screen",
                    "overlay",
                    "darken",
                    "lighten",
                    "color-dodge",
                    "color-burn",
                    "hard-light",
                    "soft-light",
                    "difference",
                    "exclusion",
                    "contrast",
                    "invert",
                    "invert-rgb",
                    "grain-merge",
                    "grain-extract",
                    "hue",
                    "saturation",
                    "color",
                    "value"
                ]
            }
        },
        "polygon-pattern": {
            "file": {
                "css": "polygon-pattern-file",
                "type": "uri",
                "default-value": "none",
                "required": true,
                "doc": "Image to use as a repeated pattern fill within a polygon"
            },
            "alignment": {
                "css": "polygon-pattern-alignment",
                "type": [
                    "local",
                    "global"
                ],
                "default-value": "local",
                "doc": "Specify whether to align pattern fills to the layer or to the map."
            },
            "gamma": {
                "css": "polygon-pattern-gamma",
                "type": "float",
                "default-value": 1,
                "default-meaning": "fully antialiased",
                "range": "0-1",
                "doc": "Level of antialiasing of polygon pattern edges"
            },
            "opacity": {
                "css": "polygon-pattern-opacity",
                "type": "float",
                "doc": "(Default 1.0) - Apply an opacity level to the image used for the pattern",
                "default-value": 1,
                "default-meaning": "The image is rendered without modifications"
            },
            "clip": {
                "css": "polygon-pattern-clip",
                "type": "boolean",
                "default-value": true,
                "default-meaning": "geometry will be clipped to map bounds before rendering",
                "doc": "geometries are clipped to map bounds by default for best rendering performance. In some cases users may wish to disable this to avoid rendering artifacts."
            },
            "smooth": {
                "css": "polygon-pattern-smooth",
                "type": "float",
                "default-value": 0,
                "default-meaning": "no smoothing",
                "range": "0-1",
                "doc": "Smooths out geometry angles. 0 is no smoothing, 1 is fully smoothed. Values greater than 1 will produce wild, looping geometries."
            },
            "geometry-transform": {
                "css": "polygon-pattern-geometry-transform",
                "type": "functions",
                "default-value": "none",
                "default-meaning": "geometry will not be transformed",
                "doc": "Allows transformation functions to be applied to the geometry.",
                "functions": [
                    ["matrix", 6],
                    ["translate", 2],
                    ["scale", 2],
                    ["rotate", 3],
                    ["skewX", 1],
                    ["skewY", 1]
                ]
            },
            "comp-op": {
                "css": "polygon-pattern-comp-op",
                "default-value": "src-over",
                "default-meaning": "add the current symbolizer on top of other symbolizer",
                "doc": "Composite operation. This defines how this symbolizer should behave relative to symbolizers atop or below it.",
                "type": ["clear",
                    "src",
                    "dst",
                    "src-over",
                    "dst-over",
                    "src-in",
                    "dst-in",
                    "src-out",
                    "dst-out",
                    "src-atop",
                    "dst-atop",
                    "xor",
                    "plus",
                    "minus",
                    "multiply",
                    "screen",
                    "overlay",
                    "darken",
                    "lighten",
                    "color-dodge",
                    "color-burn",
                    "hard-light",
                    "soft-light",
                    "difference",
                    "exclusion",
                    "contrast",
                    "invert",
                    "invert-rgb",
                    "grain-merge",
                    "grain-extract",
                    "hue",
                    "saturation",
                    "color",
                    "value"
                ]
            }
        },
        "raster": {
            "opacity": {
                "css": "raster-opacity",
                "default-value": 1,
                "default-meaning": "opaque",
                "type": "float",
                "doc": "The opacity of the raster symbolizer on top of other symbolizers."
            },
            "filter-factor": {
                "css": "raster-filter-factor",
                "default-value": -1,
                "default-meaning": "Allow the datasource to choose appropriate downscaling.",
                "type": "float",
                "doc": "This is used by the Raster or Gdal datasources to pre-downscale images using overviews. Higher numbers can sometimes cause much better scaled image output, at the cost of speed."
            },
            "scaling": {
                "css": "raster-scaling",
                "type": [
                    "near",
                    "fast",
                    "bilinear",
                    "bilinear8",
                    "bicubic",
                    "spline16",
                    "spline36",
                    "hanning",
                    "hamming",
                    "hermite",
                    "kaiser",
                    "quadric",
                    "catrom",
                    "gaussian",
                    "bessel",
                    "mitchell",
                    "sinc",
                    "lanczos",
                    "blackman"
                ],
                "default-value": "near",
                "doc": "The scaling algorithm used to making different resolution versions of this raster layer. Bilinear is a good compromise between speed and accuracy, while lanczos gives the highest quality."
            },
            "mesh-size": {
                "css": "raster-mesh-size",
                "default-value": 16,
                "default-meaning": "Reprojection mesh will be 1/16 of the resolution of the source image",
                "type": "unsigned",
                "doc": "A reduced resolution mesh is used for raster reprojection, and the total image size is divided by the mesh-size to determine the quality of that mesh. Values for mesh-size larger than the default will result in faster reprojection but might lead to distortion."
            },
            "comp-op": {
                "css": "raster-comp-op",
                "default-value": "src-over",
                "default-meaning": "add the current symbolizer on top of other symbolizer",
                "doc": "Composite operation. This defines how this symbolizer should behave relative to symbolizers atop or below it.",
                "type": ["clear",
                    "src",
                    "dst",
                    "src-over",
                    "dst-over",
                    "src-in",
                    "dst-in",
                    "src-out",
                    "dst-out",
                    "src-atop",
                    "dst-atop",
                    "xor",
                    "plus",
                    "minus",
                    "multiply",
                    "screen",
                    "overlay",
                    "darken",
                    "lighten",
                    "color-dodge",
                    "color-burn",
                    "hard-light",
                    "soft-light",
                    "difference",
                    "exclusion",
                    "contrast",
                    "invert",
                    "invert-rgb",
                    "grain-merge",
                    "grain-extract",
                    "hue",
                    "saturation",
                    "color",
                    "value"
                ]
            }
        },
        "point": {
            "file": {
                "css": "point-file",
                "type": "uri",
                "required": false,
                "default-value": "none",
                "doc": "Image file to represent a point"
            },
            "allow-overlap": {
                "css": "point-allow-overlap",
                "type": "boolean",
                "default-value": false,
                "doc": "Control whether overlapping points are shown or hidden.",
                "default-meaning": "Do not allow points to overlap with each other - overlapping markers will not be shown."
            },
            "ignore-placement": {
                "css": "point-ignore-placement",
                "type": "boolean",
                "default-value": false,
                "default-meaning": "do not store the bbox of this geometry in the collision detector cache",
                "doc": "value to control whether the placement of the feature will prevent the placement of other features"
            },
            "opacity": {
                "css": "point-opacity",
                "type": "float",
                "default-value": 1.0,
                "default-meaning": "Fully opaque",
                "doc": "A value from 0 to 1 to control the opacity of the point"
            },
            "placement": {
                "css": "point-placement",
                "type": [
                    "centroid",
                    "interior"
                ],
                "doc": "How this point should be placed. Centroid calculates the geometric center of a polygon, which can be outside of it, while interior always places inside of a polygon.",
                "default-value": "centroid"
            },
            "transform": {
                "css": "point-transform",
                "type": "functions",
                "functions": [
                    ["matrix", 6],
                    ["translate", 2],
                    ["scale", 2],
                    ["rotate", 3],
                    ["skewX", 1],
                    ["skewY", 1]
                ],
                "default-value": "",
                "default-meaning": "No transformation",
                "doc": "SVG transformation definition"
            },
            "comp-op": {
                "css": "point-comp-op",
                "default-value": "src-over",
                "default-meaning": "add the current symbolizer on top of other symbolizer",
                "doc": "Composite operation. This defines how this symbolizer should behave relative to symbolizers atop or below it.",
                "type": ["clear",
                    "src",
                    "dst",
                    "src-over",
                    "dst-over",
                    "src-in",
                    "dst-in",
                    "src-out",
                    "dst-out",
                    "src-atop",
                    "dst-atop",
                    "xor",
                    "plus",
                    "minus",
                    "multiply",
                    "screen",
                    "overlay",
                    "darken",
                    "lighten",
                    "color-dodge",
                    "color-burn",
                    "hard-light",
                    "soft-light",
                    "difference",
                    "exclusion",
                    "contrast",
                    "invert",
                    "invert-rgb",
                    "grain-merge",
                    "grain-extract",
                    "hue",
                    "saturation",
                    "color",
                    "value"
                ]
            }
        },
        "text": {
            "name": {
                "css": "text-name",
                "type": "expression",
                "required": true,
                "default-value": "",
                "serialization": "content",
                "doc": "Value to use for a text label. Data columns are specified using brackets like [column_name]"
            },
            "face-name": {
                "css": "text-face-name",
                "type": "string",
                "validate": "font",
                "doc": "Font name and style to render a label in",
                "required": true
            },
            "size": {
                "css": "text-size",
                "type": "float",
                "default-value": 10,
                "doc": "Text size in pixels"
            },
            "text-ratio": {
                "css": "text-ratio",
                "doc": "Define the amount of text (of the total) present on successive lines when wrapping occurs",
                "default-value": 0,
                "type": "unsigned"
            },
            "wrap-width": {
                "css": "text-wrap-width",
                "doc": "Length of a chunk of text in characters before wrapping text",
                "default-value": 0,
                "type": "unsigned"
            },
            "wrap-before": {
                "css": "text-wrap-before",
                "type": "boolean",
                "default-value": false,
                "doc": "Wrap text before wrap-width is reached. If false, wrapped lines will be a bit longer than wrap-width."
            },
            "wrap-character": {
                "css": "text-wrap-character",
                "type": "string",
                "default-value": " ",
                "doc": "Use this character instead of a space to wrap long text."
            },
            "spacing": {
                "css": "text-spacing",
                "type": "unsigned",
                "doc": "Distance between repeated text labels on a line (aka. label-spacing)"
            },
            "character-spacing": {
                "css": "text-character-spacing",
                "type": "float",
                "default-value": 0,
                "doc": "Horizontal spacing adjustment between characters in pixels"
            },
            "line-spacing": {
                "css": "text-line-spacing",
                "default-value": 0,
                "type": "unsigned",
                "doc": "Vertical spacing adjustment between lines in pixels"
            },
            "label-position-tolerance": {
                "css": "text-label-position-tolerance",
                "default-value": 0,
                "type": "unsigned",
                "doc": "Allows the label to be displaced from its ideal position by a number of pixels (only works with placement:line)"
            },
            "max-char-angle-delta": {
                "css": "text-max-char-angle-delta",
                "type": "float",
                "default-value": "22.5",
                "doc": "The maximum angle change, in degrees, allowed between adjacent characters in a label. This value internally is converted to radians to the default is 22.5*math.pi/180.0. The higher the value the fewer labels will be placed around around sharp corners."
            },
            "fill": {
                "css": "text-fill",
                "doc": "Specifies the color for the text",
                "default-value": "#000000",
                "type": "color"
            },
            "opacity": {
                "css": "text-opacity",
                "doc": "A number from 0 to 1 specifying the opacity for the text",
                "default-value": 1.0,
                "default-meaning": "Fully opaque",
                "type": "float"
            },
            "halo-fill": {
                "css": "text-halo-fill",
                "type": "color",
                "default-value": "#FFFFFF",
                "default-meaning": "white",
                "doc": "Specifies the color of the halo around the text."
            },
            "halo-radius": {
                "css": "text-halo-radius",
                "doc": "Specify the radius of the halo in pixels",
                "default-value": 0,
                "default-meaning": "no halo",
                "type": "float"
            },
            "dx": {
                "css": "text-dx",
                "type": "float",
                "doc": "Displace text by fixed amount, in pixels, +/- along the X axis.  A positive value will shift the text right",
                "default-value": 0
            },
            "dy": {
                "css": "text-dy",
                "type": "float",
                "doc": "Displace text by fixed amount, in pixels, +/- along the Y axis.  A positive value will shift the text down",
                "default-value": 0
            },
            "vertical-alignment": {
                "css": "text-vertical-alignment",
                "type": [
                  "top",
                  "middle",
                  "bottom",
                  "auto"
                ],
                "doc": "Position of label relative to point position.",
                "default-value": "auto",
                "default-meaning": "Default affected by value of dy; \"bottom\" for dy>0, \"top\" for dy<0."
            },
            "avoid-edges": {
                "css": "text-avoid-edges",
                "doc": "Tell positioning algorithm to avoid labeling near intersection edges.",
                "default-value": false,
                "type": "boolean"
            },
            "minimum-distance": {
                "css": "text-min-distance",
                "doc": "Minimum permitted distance to the next text symbolizer.",
                "type": "float"
            },
            "minimum-padding": {
                "css": "text-min-padding",
                "doc": "Determines the minimum amount of padding that a text symbolizer gets relative to other text",
                "type": "float"
            },
            "minimum-path-length": {
                "css": "text-min-path-length",
                "type": "float",
                "default-value": 0,
                "default-meaning": "place labels on all paths",
                "doc": "Place labels only on paths longer than this value."
            },
            "allow-overlap": {
                "css": "text-allow-overlap",
                "type": "boolean",
                "default-value": false,
                "doc": "Control whether overlapping text is shown or hidden.",
                "default-meaning": "Do not allow text to overlap with other text - overlapping markers will not be shown."
            },
            "orientation": {
                "css": "text-orientation",
                "type": "expression",
                "doc": "Rotate the text."
            },
            "placement": {
                "css": "text-placement",
                "type": [
                    "point",
                    "line",
                    "vertex",
                    "interior"
                ],
                "default-value": "point",
                "doc": "Control the style of placement of a point versus the geometry it is attached to."
            },
            "placement-type": {
                "css": "text-placement-type",
                "doc": "Re-position and/or re-size text to avoid overlaps. \"simple\" for basic algorithm (using text-placements string,) \"dummy\" to turn this feature off.",
                "type": [
                    "dummy",
                    "simple"
                ],
                "default-value": "dummy"
            },
            "placements": {
                "css": "text-placements",
                "type": "string",
                "default-value": "",
                "doc": "If \"placement-type\" is set to \"simple\", use this \"POSITIONS,[SIZES]\" string. An example is `text-placements: \"E,NE,SE,W,NW,SW\";` "
            },
            "text-transform": {
                "css": "text-transform",
                "type": [
                    "none",
                    "uppercase",
                    "lowercase",
                    "capitalize"
                ],
                "doc": "Transform the case of the characters",
                "default-value": "none"
            },
            "horizontal-alignment": {
                "css": "text-horizontal-alignment",
                "type": [
                    "left",
                    "middle",
                    "right",
                    "auto"
                ],
                "doc": "The text's horizontal alignment from its centerpoint",
                "default-value": "auto"
            },
            "justify-alignment": {
                "css": "text-align",
                "type": [
                    "left",
                    "right",
                    "center",
                    "auto"
                ],
                "doc": "Define how text is justified",
                "default-value": "auto",
                "default-meaning": "Auto alignment means that text will be centered by default except when using the `placement-type` parameter - in that case either right or left justification will be used automatically depending on where the text could be fit given the `text-placements` directives"
            },
            "clip": {
                "css": "text-clip",
                "type": "boolean",
                "default-value": true,
                "default-meaning": "geometry will be clipped to map bounds before rendering",
                "doc": "geometries are clipped to map bounds by default for best rendering performance. In some cases users may wish to disable this to avoid rendering artifacts."
            },
            "comp-op": {
                "css": "text-comp-op",
                "default-value": "src-over",
                "default-meaning": "add the current symbolizer on top of other symbolizer",
                "doc": "Composite operation. This defines how this symbolizer should behave relative to symbolizers atop or below it.",
                "type": ["clear",
                    "src",
                    "dst",
                    "src-over",
                    "dst-over",
                    "src-in",
                    "dst-in",
                    "src-out",
                    "dst-out",
                    "src-atop",
                    "dst-atop",
                    "xor",
                    "plus",
                    "minus",
                    "multiply",
                    "screen",
                    "overlay",
                    "darken",
                    "lighten",
                    "color-dodge",
                    "color-burn",
                    "hard-light",
                    "soft-light",
                    "difference",
                    "exclusion",
                    "contrast",
                    "invert",
                    "invert-rgb",
                    "grain-merge",
                    "grain-extract",
                    "hue",
                    "saturation",
                    "color",
                    "value"
                ]
            }
        },
        "building": {
            "fill": {
                "css": "building-fill",
                "default-value": "#FFFFFF",
                "doc": "The color of the buildings walls.",
                "type": "color"
            },
            "fill-opacity": {
                "css": "building-fill-opacity",
                "type": "float",
                "doc": "The opacity of the building as a whole, including all walls.",
                "default-value": 1
            },
            "height": {
                "css": "building-height",
                "doc": "The height of the building in pixels.",
                "type": "expression",
                "default-value": "0"
            }
        },
        "torque": {
          "-torque-frame-count": {
              "css": "-torque-frame-count",
              "default-value": "128",
              "type":"float",
              "default-meaning": "the data is broken into 128 time frames",
              "doc": "Number of animation steps/frames used in the animation. If the data contains a fewere number of total frames, the lesser value will be used."
          },
          "-torque-resolution": {
              "css": "-torque-resolution",
              "default-value": "2",
              "type":"float",
              "default-meaning": "",
              "doc": "Spatial resolution in pixels. A resolution of 1 means no spatial aggregation of the data. Any other resolution of N results in spatial aggregation into cells of NxN pixels. The value N must be power of 2"
          },
          "-torque-animation-duration": {
              "css": "-torque-animation-duration",
              "default-value": "30",
              "type":"float",
              "default-meaning": "the animation lasts 30 seconds",
              "doc": "Animation duration in seconds"
          },
          "-torque-aggregation-function": {
              "css": "-torque-aggregation-function",
              "default-value": "count(cartodb_id)",
              "type": "string",
              "default-meaning": "the value for each cell is the count of points in that cell",
              "doc": "A function used to calculate a value from the aggregate data for each cell. See -torque-resolution"
          },
          "-torque-time-attribute": {
              "css": "-torque-time-attribute",
              "default-value": "time",
              "type": "string",
              "default-meaning": "the data column in your table that is of a time based type",
              "doc": "The table column that contains the time information used create the animation"
          },
          "-torque-data-aggregation": {
              "css": "-torque-data-aggregation",
              "default-value": "linear",
              "type": [
                "linear",
                "cumulative"
              ],
              "default-meaning": "previous values are discarded",
              "doc": "A linear animation will discard previous values while a cumulative animation will accumulate them until it restarts"
          }
        }
    },
    "colors": {
        "aliceblue":  [240, 248, 255],
        "antiquewhite":  [250, 235, 215],
        "aqua":  [0, 255, 255],
        "aquamarine":  [127, 255, 212],
        "azure":  [240, 255, 255],
        "beige":  [245, 245, 220],
        "bisque":  [255, 228, 196],
        "black":  [0, 0, 0],
        "blanchedalmond":  [255,235,205],
        "blue":  [0, 0, 255],
        "blueviolet":  [138, 43, 226],
        "brown":  [165, 42, 42],
        "burlywood":  [222, 184, 135],
        "cadetblue":  [95, 158, 160],
        "chartreuse":  [127, 255, 0],
        "chocolate":  [210, 105, 30],
        "coral":  [255, 127, 80],
        "cornflowerblue":  [100, 149, 237],
        "cornsilk":  [255, 248, 220],
        "crimson":  [220, 20, 60],
        "cyan":  [0, 255, 255],
        "darkblue":  [0, 0, 139],
        "darkcyan":  [0, 139, 139],
        "darkgoldenrod":  [184, 134, 11],
        "darkgray":  [169, 169, 169],
        "darkgreen":  [0, 100, 0],
        "darkgrey":  [169, 169, 169],
        "darkkhaki":  [189, 183, 107],
        "darkmagenta":  [139, 0, 139],
        "darkolivegreen":  [85, 107, 47],
        "darkorange":  [255, 140, 0],
        "darkorchid":  [153, 50, 204],
        "darkred":  [139, 0, 0],
        "darksalmon":  [233, 150, 122],
        "darkseagreen":  [143, 188, 143],
        "darkslateblue":  [72, 61, 139],
        "darkslategrey":  [47, 79, 79],
        "darkturquoise":  [0, 206, 209],
        "darkviolet":  [148, 0, 211],
        "deeppink":  [255, 20, 147],
        "deepskyblue":  [0, 191, 255],
        "dimgray":  [105, 105, 105],
        "dimgrey":  [105, 105, 105],
        "dodgerblue":  [30, 144, 255],
        "firebrick":  [178, 34, 34],
        "floralwhite":  [255, 250, 240],
        "forestgreen":  [34, 139, 34],
        "fuchsia":  [255, 0, 255],
        "gainsboro":  [220, 220, 220],
        "ghostwhite":  [248, 248, 255],
        "gold":  [255, 215, 0],
        "goldenrod":  [218, 165, 32],
        "gray":  [128, 128, 128],
        "grey":  [128, 128, 128],
        "green":  [0, 128, 0],
        "greenyellow":  [173, 255, 47],
        "honeydew":  [240, 255, 240],
        "hotpink":  [255, 105, 180],
        "indianred":  [205, 92, 92],
        "indigo":  [75, 0, 130],
        "ivory":  [255, 255, 240],
        "khaki":  [240, 230, 140],
        "lavender":  [230, 230, 250],
        "lavenderblush":  [255, 240, 245],
        "lawngreen":  [124, 252, 0],
        "lemonchiffon":  [255, 250, 205],
        "lightblue":  [173, 216, 230],
        "lightcoral":  [240, 128, 128],
        "lightcyan":  [224, 255, 255],
        "lightgoldenrodyellow":  [250, 250, 210],
        "lightgray":  [211, 211, 211],
        "lightgreen":  [144, 238, 144],
        "lightgrey":  [211, 211, 211],
        "lightpink":  [255, 182, 193],
        "lightsalmon":  [255, 160, 122],
        "lightseagreen":  [32, 178, 170],
        "lightskyblue":  [135, 206, 250],
        "lightslategray":  [119, 136, 153],
        "lightslategrey":  [119, 136, 153],
        "lightsteelblue":  [176, 196, 222],
        "lightyellow":  [255, 255, 224],
        "lime":  [0, 255, 0],
        "limegreen":  [50, 205, 50],
        "linen":  [250, 240, 230],
        "magenta":  [255, 0, 255],
        "maroon":  [128, 0, 0],
        "mediumaquamarine":  [102, 205, 170],
        "mediumblue":  [0, 0, 205],
        "mediumorchid":  [186, 85, 211],
        "mediumpurple":  [147, 112, 219],
        "mediumseagreen":  [60, 179, 113],
        "mediumslateblue":  [123, 104, 238],
        "mediumspringgreen":  [0, 250, 154],
        "mediumturquoise":  [72, 209, 204],
        "mediumvioletred":  [199, 21, 133],
        "midnightblue":  [25, 25, 112],
        "mintcream":  [245, 255, 250],
        "mistyrose":  [255, 228, 225],
        "moccasin":  [255, 228, 181],
        "navajowhite":  [255, 222, 173],
        "navy":  [0, 0, 128],
        "oldlace":  [253, 245, 230],
        "olive":  [128, 128, 0],
        "olivedrab":  [107, 142, 35],
        "orange":  [255, 165, 0],
        "orangered":  [255, 69, 0],
        "orchid":  [218, 112, 214],
        "palegoldenrod":  [238, 232, 170],
        "palegreen":  [152, 251, 152],
        "paleturquoise":  [175, 238, 238],
        "palevioletred":  [219, 112, 147],
        "papayawhip":  [255, 239, 213],
        "peachpuff":  [255, 218, 185],
        "peru":  [205, 133, 63],
        "pink":  [255, 192, 203],
        "plum":  [221, 160, 221],
        "powderblue":  [176, 224, 230],
        "purple":  [128, 0, 128],
        "red":  [255, 0, 0],
        "rosybrown":  [188, 143, 143],
        "royalblue":  [65, 105, 225],
        "saddlebrown":  [139, 69, 19],
        "salmon":  [250, 128, 114],
        "sandybrown":  [244, 164, 96],
        "seagreen":  [46, 139, 87],
        "seashell":  [255, 245, 238],
        "sienna":  [160, 82, 45],
        "silver":  [192, 192, 192],
        "skyblue":  [135, 206, 235],
        "slateblue":  [106, 90, 205],
        "slategray":  [112, 128, 144],
        "slategrey":  [112, 128, 144],
        "snow":  [255, 250, 250],
        "springgreen":  [0, 255, 127],
        "steelblue":  [70, 130, 180],
        "tan":  [210, 180, 140],
        "teal":  [0, 128, 128],
        "thistle":  [216, 191, 216],
        "tomato":  [255, 99, 71],
        "turquoise":  [64, 224, 208],
        "violet":  [238, 130, 238],
        "wheat":  [245, 222, 179],
        "white":  [255, 255, 255],
        "whitesmoke":  [245, 245, 245],
        "yellow":  [255, 255, 0],
        "yellowgreen":  [154, 205, 50],
        "transparent":  [0, 0, 0, 0]
    },
    "filter": {
        "value": [
            "true",
            "false",
            "null",
            "point",
            "linestring",
            "polygon",
            "collection"
        ]
    }
}

window.carto['mapnik-reference'] =  {
  version: {
    latest: _mapnik_reference_latest,
    '2.1.1': _mapnik_reference_latest
  }
}
//
// Stub out `require` in the browser
//
window.carto = window.carto || {};
window.carto.underscore = window._;

function require(arg) {
    var mod = window.carto[arg];
    if(!mod) {
      mod = window.carto[arg.split('/')[1]];
    }
    if(!mod) {
      mod = window.carto[arg]
    }
    if(!mod) {
      mod = window[arg.split('/')[1]];
    }
    // try global scope
    if(!mod) {
      mod = window[arg]
    }
    return mod;
}

if (typeof(exports) !== 'undefined') {
    carto = exports;
    tree = require('./tree');
    _ = require('underscore');
} else {
    if (typeof(window.carto) === 'undefined') { window.carto = {}; }
    carto = window.carto;
    tree = window.carto.tree = {};
    _ = window._;
}

// carto.js - parser
//
//    A relatively straight-forward predictive parser.
//    There is no tokenization/lexing stage, the input is parsed
//    in one sweep.
//
//    To make the parser fast enough to run in the browser, several
//    optimization had to be made:
//
//    - Matching and slicing on a huge input is often cause of slowdowns.
//      The solution is to chunkify the input into smaller strings.
//      The chunks are stored in the `chunks` var,
//      `j` holds the current chunk index, and `current` holds
//      the index of the current chunk in relation to `input`.
//      This gives us an almost 4x speed-up.
//
//    - In many cases, we don't need to match individual tokens;
//      for example, if a value doesn't hold any variables, operations
//      or dynamic references, the parser can effectively 'skip' it,
//      treating it as a literal.
//      An example would be '1px solid #000' - which evaluates to itself,
//      we don't need to know what the individual components are.
//      The drawback, of course is that you don't get the benefits of
//      syntax-checking on the CSS. This gives us a 50% speed-up in the parser,
//      and a smaller speed-up in the code-gen.
//
//
//    Token matching is done with the `$` function, which either takes
//    a terminal string or regexp, or a non-terminal function to call.
//    It also takes care of moving all the indices forwards.

carto.Parser = function Parser(env) {
    var input,       // LeSS input string
        i,           // current index in `input`
        j,           // current chunk
        temp,        // temporarily holds a chunk's state, for backtracking
        memo,        // temporarily holds `i`, when backtracking
        furthest,    // furthest index the parser has gone to
        chunks,      // chunkified input
        current,     // index of current chunk, in `input`
        parser;

    var that = this;

    // This function is called after all files
    // have been imported through `@import`.
    var finish = function() {};

    var imports = this.imports = {
        paths: env && env.paths || [],  // Search paths, when importing
        queue: [],                      // Files which haven't been imported yet
        files: {},                      // Holds the imported parse trees
        mime: env && env.mime,         // MIME type of .carto files
        push: function(path, callback) {
            var that = this;
            this.queue.push(path);

            //
            // Import a file asynchronously
            //
            carto.Parser.importer(path, this.paths, function(root) {
                that.queue.splice(that.queue.indexOf(path), 1); // Remove the path from the queue
                that.files[path] = root;                        // Store the root

                callback(root);

                if (that.queue.length === 0) { finish(); }       // Call `finish` if we're done importing
            }, env);
        }
    };

    function save()    {
        temp = chunks[j];
        memo = i;
        current = i;
    }
    function restore() {
        chunks[j] = temp;
        i = memo;
        current = i;
    }

    function sync() {
        if (i > current) {
            chunks[j] = chunks[j].slice(i - current);
            current = i;
        }
    }
    //
    // Parse from a token, regexp or string, and move forward if match
    //
    function $(tok) {
        var match, args, length, c, index, endIndex, k;

        //
        // Non-terminal
        //
        if (tok instanceof Function) {
            return tok.call(parser.parsers);
        //
        // Terminal
        //
        //     Either match a single character in the input,
        //     or match a regexp in the current chunk (chunk[j]).
        //
        } else if (typeof(tok) === 'string') {
            match = input.charAt(i) === tok ? tok : null;
            length = 1;
            sync();
        } else {
            sync();

            match = tok.exec(chunks[j]);
            if (match) {
                length = match[0].length;
            } else {
                return null;
            }
        }

        // The match is confirmed, add the match length to `i`,
        // and consume any extra white-space characters (' ' || '\n')
        // which come after that. The reason for this is that LeSS's
        // grammar is mostly white-space insensitive.
        if (match) {
            var mem = i += length;
            endIndex = i + chunks[j].length - length;

            while (i < endIndex) {
                c = input.charCodeAt(i);
                if (! (c === 32 || c === 10 || c === 9)) { break; }
                i++;
            }
            chunks[j] = chunks[j].slice(length + (i - mem));
            current = i;

            if (chunks[j].length === 0 && j < chunks.length - 1) { j++; }

            if (typeof(match) === 'string') {
                return match;
            } else {
                return match.length === 1 ? match[0] : match;
            }
        }
    }

    // Same as $(), but don't change the state of the parser,
    // just return the match.
    function peek(tok) {
        if (typeof(tok) === 'string') {
            return input.charAt(i) === tok;
        } else {
            if (tok.test(chunks[j])) {
                return true;
            } else {
                return false;
            }
        }
    }

    function extractErrorLine(style, errorIndex) {
        return (style.slice(0, errorIndex).match(/\n/g) || '').length + 1;
    }


    // Make an error object from a passed set of properties.
    // Accepted properties:
    // - `message`: Text of the error message.
    // - `filename`: Filename where the error occurred.
    // - `index`: Char. index where the error occurred.
    function makeError(err) {
        var einput;

        _(err).defaults({
            index: furthest,
            filename: env.filename,
            message: 'Parse error.',
            line: 0,
            column: -1
        });

        if (err.filename && that.env.inputs && that.env.inputs[err.filename]) {
            einput = that.env.inputs[err.filename];
        } else {
            einput = input;
        }

        err.line = extractErrorLine(einput, err.index);
        for (var n = err.index; n >= 0 && einput.charAt(n) !== '\n'; n--) {
            err.column++;
        }

        return new Error(_('<%=filename%>:<%=line%>:<%=column%> <%=message%>').template(err));
    }

    this.env = env = env || {};
    this.env.filename = this.env.filename || null;
    this.env.inputs = this.env.inputs || {};

    // The Parser
    return parser = {

        imports: imports,
        extractErrorLine: extractErrorLine,
        //
        // Parse an input string into an abstract syntax tree.
        // Throws an error on parse errors.
        parse: function(str) {
            var root, start, end, zone, line, lines, buff = [], c, error = null;

            i = j = current = furthest = 0;
            chunks = [];
            input = str.replace(/\r\n/g, '\n');
            if (env.filename) {
                that.env.inputs[env.filename] = input;
            }

            var early_exit = false;
            // Split the input into chunks.
            chunks = (function(chunks) {
                var j = 0,
                    skip = /[^"'`\{\}\/]+/g,
                    comment = /\/\*(?:[^*]|\*+[^\/*])*\*+\/|\/\/.*/g,
                    level = 0,
                    match,
                    chunk = chunks[0],
                    inString;

                chunker: for (var i = 0, c, cc; i < input.length; i++) {
                    skip.lastIndex = i;
                    if (match = skip.exec(input)) {
                        if (match.index === i) {
                            i += match[0].length;
                            chunk.push(match[0]);
                        }
                    }
                    c = input.charAt(i);
                    comment.lastIndex = i;

                    if (!inString && c === '/') {
                        cc = input.charAt(i + 1);
                        if (cc === '/' || cc === '*') {
                            if (match = comment.exec(input)) {
                                if (match.index === i) {
                                    i += match[0].length - 1;
                                    chunk.push(match[0]);
                                    c = input.charAt(i);
                                    continue chunker;
                                }
                            }
                        }
                    }

                    if (c === '{' && !inString) { level++;
                        chunk.push(c);
                    } else if (c === '}' && !inString) { level--;
                        chunk.push(c);
                        chunks[++j] = chunk = [];
                    } else {
                        if (c === '"' || c === "'" || c === '`') {
                            if (! inString) {
                                inString = c;
                            } else {
                                inString = inString === c ? false : inString;
                            }
                        }
                        chunk.push(c);
                    }
                }
                if (level > 0) {
                    // TODO: make invalid instead
                    throw makeError({
                        message: 'Missing closing `}`',
                        index: i
                    });
                }

                return chunks.map(function(c) { return c.join(''); });
            })([[]]);

            // Start with the primary rule.
            // The whole syntax tree is held under a Ruleset node,
            // with the `root` property set to true, so no `{}` are
            // output. The callback is called when the input is parsed.
            root = new tree.Ruleset([], $(this.parsers.primary));
            root.root = true;

            // Get an array of Ruleset objects, flattened
            // and sorted according to specificitySort
            root.toList = (function() {
                var line, lines, column;
                return function(env) {
                    env.error = function(e) {
                        if (!env.errors) env.errors = new Error('');
                        if (env.errors.message) {
                            env.errors.message += '\n' + makeError(e).message;
                        } else {
                            env.errors.message = makeError(e).message;
                        }
                    };
                    env.frames = env.frames || [];

                    // call populates Invalid-caused errors
                    var definitions = this.flatten([], [], env);
                    definitions.sort(specificitySort);
                    return definitions;
                };
            })();

            // Sort rules by specificity: this function expects selectors to be
            // split already.
            //
            // Written to be used as a .sort(Function);
            // argument.
            //
            // [1, 0, 0, 467] > [0, 0, 1, 520]
            var specificitySort = function(a, b) {
                var as = a.specificity;
                var bs = b.specificity;

                if (as[0] != bs[0]) return bs[0] - as[0];
                if (as[1] != bs[1]) return bs[1] - as[1];
                if (as[2] != bs[2]) return bs[2] - as[2];
                return bs[3] - as[3];
            };

            // If `i` is smaller than the `input.length - 1`,
            // it means the parser wasn't able to parse the whole
            // string, so we've got a parsing error.
            //
            // We try to extract a \n delimited string,
            // showing the line where the parse error occured.
            // We split it up into two parts (the part which parsed,
            // and the part which didn't), so we can color them differently.
            if (i < input.length - 1) throw makeError({
                message:'Parse error.',
                index:i
            });

            return root;
        },

        //
        // Here in, the parsing rules/functions
        //
        // The basic structure of the syntax tree generated is as follows:
        //
        //   Ruleset ->  Rule -> Value -> Expression -> Entity
        //
        //  In general, most rules will try to parse a token with the `$()` function, and if the return
        //  value is truly, will return a new node, of the relevant type. Sometimes, we need to check
        //  first, before parsing, that's when we use `peek()`.
        //
        parsers: {
            //
            // The `primary` rule is the *entry* and *exit* point of the parser.
            // The rules here can appear at any level of the parse tree.
            //
            // The recursive nature of the grammar is an interplay between the `block`
            // rule, which represents `{ ... }`, the `ruleset` rule, and this `primary` rule,
            // as represented by this simplified grammar:
            //
            //     primary  →  (ruleset | rule)+
            //     ruleset  →  selector+ block
            //     block    →  '{' primary '}'
            //
            // Only at one point is the primary rule not called from the
            // block rule: at the root level.
            //
            primary: function() {
                var node, root = [];

                while ((node = $(this.rule) || $(this.ruleset) ||
                               $(this.comment)) ||
                               $(/^[\s\n]+/) || (node = $(this.invalid))) {
                    node && root.push(node);
                }
                return root;
            },

            invalid: function () {
                var chunk = $(/^[^;\n]*[;\n]/);

                // To fail gracefully, match everything until a semicolon or linebreak.
                if (chunk) {
                    return new(tree.Invalid)(chunk, memo);
                }
            },

            // We create a Comment node for CSS comments `/* */`,
            // but keep the LeSS comments `//` silent, by just skipping
            // over them.
            comment: function() {
                var comment;

                if (input.charAt(i) !== '/') return;

                if (input.charAt(i + 1) === '/') {
                    return new tree.Comment($(/^\/\/.*/), true);
                } else if (comment = $(/^\/\*(?:[^*]|\*+[^\/*])*\*+\/\n?/)) {
                    return new tree.Comment(comment);
                }
            },

            //
            // Entities are tokens which can be found inside an Expression
            //
            entities: {
                //
                // A string, which supports escaping " and '
                //
                //     "milky way" 'he\'s the one!'
                //
                quoted: function() {
                    if (input.charAt(i) !== '"' && input.charAt(i) !== "'") return;
                    var str = $(/^"((?:[^"\\\r\n]|\\.)*)"|'((?:[^'\\\r\n]|\\.)*)'/);
                    if (str) {
                        return new tree.Quoted(str[1] || str[2]);
                    }
                },

                // A reference to a Mapnik field, like
                //
                //     [NAME]
                //
                // Behind the scenes, this has the same representation, but Carto
                // needs to be careful to warn when unsupported operations are used.
                field: function() {
                    if (! $('[')) return;
                    var field_name = $(/(^[a-zA-Z0-9\-_]+)/);
                    if (! $(']')) return;
                    if (field_name) return new tree.Field(field_name[1]);
                },

                // This is a comparison operator
                comparison: function() {
                    var str = $(/^=~|=|!=|<=|>=|<|>/);
                    if (str) {
                        return str;
                    }
                },

                // A catch-all word, such as:
                //
                //     hard-light
                //
                //  These can start with either a letter or a dash (-),
                //  and then contain numbers, underscores, and letters.
                keyword: function() {
                    var k = $(/^[A-Za-z-]+[A-Za-z-0-9_]*/);
                    if (k) { return new tree.Keyword(k); }
                },

                // A function call
                //
                //     rgb(255, 0, 255)
                //
                // The arguments are parsed with the `entities.arguments` parser.
                call: function() {
                    var name, args;

                    if (! (name = /^([\w\-]+|%)\(/.exec(chunks[j]))) return;

                    name = name[1].toLowerCase();

                    if (name === 'url') {
                        return null;
                    } else {
                        i += name.length + 1;
                    }

                    args = $(this.entities.arguments);

                    if (!$(')')) return;

                    if (name) {
                        return new tree.Call(name, args, i); 
                    }
                },
                // Arguments are comma-separated expressions
                'arguments': function() {
                    var args = [], arg;

                    while (arg = $(this.expression)) {
                        args.push(arg);
                        if (! $(',')) { break; }
                    }

                    return args;
                },
                literal: function() {
                    return $(this.entities.dimension) ||
                           $(this.entities.color) ||
                           $(this.entities.quoted);
                },

                // Parse url() tokens
                //
                // We use a specific rule for urls, because they don't really behave like
                // standard function calls. The difference is that the argument doesn't have
                // to be enclosed within a string, so it can't be parsed as an Expression.
                url: function() {
                    var value;

                    if (input.charAt(i) !== 'u' || !$(/^url\(/)) return;
                    value = $(this.entities.quoted) || $(this.entities.variable) ||
                            $(/^[\-\w%@$\/.&=:;#+?~]+/) || '';
                    if (! $(')')) {
                        return new tree.Invalid(value, memo, 'Missing closing ) in URL.');
                    } else {
                        return new tree.URL((value.value || value instanceof tree.Variable) ?
                            value : new tree.Quoted(value), imports.paths);
                    }
                },

                // A Variable entity, such as `@fink`, in
                //
                //     width: @fink + 2px
                //
                // We use a different parser for variable definitions,
                // see `parsers.variable`.
                variable: function() {
                    var name, index = i;

                    if (input.charAt(i) === '@' && (name = $(/^@[\w-]+/))) {
                        return new tree.Variable(name, index, env.filename);
                    }
                },

                // A Hexadecimal color
                //
                //     #4F3C2F
                //
                // `rgb` and `hsl` colors are parsed through the `entities.call` parser.
                color: function() {
                    var rgb;

                    if (input.charAt(i) === '#' && (rgb = $(/^#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})/))) {
                        return new tree.Color(rgb[1]);
                    } else {
                        rgb = chunks[j].match(/^[a-z]+/);
                        if (rgb && rgb[0] in tree.Reference.data.colors) {
                            return new tree.Color(tree.Reference.data.colors[$(/^[a-z]+/)]);
                        }
                    }
                },

                // A Dimension, that is, a number and a unit. The only
                // unit that has an effect is %
                //
                //     0.5em 95%
                dimension: function() {
                    var c = input.charCodeAt(i);
                    if ((c > 57 || c < 45) || c === 47) return;
                    var value = $(/^(-?\d*\.?\d+)(\%|\w+)?/);
                    if (value) {
                        return new tree.Dimension(value[1], value[2], memo);
                    }
                }
            },

            // The variable part of a variable definition. Used in the `rule` parser
            //
            //     @fink:
            variable: function() {
                var name;

                if (input.charAt(i) === '@' && (name = $(/^(@[\w-]+)\s*:/))) {
                    return name[1];
                }
            },

            //
            // Entities are the smallest recognized token,
            // and can be found inside a rule's value.
            //
            entity: function() {
                return $(this.entities.literal) ||
                    $(this.entities.field) ||
                    $(this.entities.variable) ||
                    $(this.entities.url) ||
                    $(this.entities.call) ||
                    $(this.entities.keyword);
            },

            //
            // A Rule terminator. Note that we use `peek()` to check for '}',
            // because the `block` rule will be expecting it, but we still need to make sure
            // it's there, if ';' was ommitted.
            //
            end: function() {
                return $(';') || peek('}');
            },

            // Elements are the building blocks for Selectors. They consist of
            // an element name, such as a tag a class, or `*`.
            element: function() {
                var e = $(/^(?:[.#][\w\-]+|\*|Map)/);
                if (e) return new tree.Element(e);
            },

            // Attachments allow adding multiple lines, polygons etc. to an
            // object. There can only be one attachment per selector.
            attachment: function() {
                var s = $(/^::([\w\-]+(?:\/[\w\-]+)*)/);
                if (s) return s[1];
            },

            // Selectors are made out of one or more Elements, see above.
            selector: function() {
                var a, attachment;
                var e, elements = [];
                var f, filters = new tree.Filterset();
                var z, zoom = tree.Zoom.all;
                var fo, frame_offset = tree.FrameOffset.none;
                var segments = 0, conditions = 0;

                while (
                        (e = $(this.element)) ||
                        (z = $(this.zoom)) ||
                        (fo = $(this.frame_offset)) ||
                        (f = $(this.filter)) ||
                        (a = $(this.attachment))
                    ) {
                    segments++;
                    if (e) {
                        elements.push(e);
                    } else if (z) {
                        zoom &= z;
                        conditions++;
                    } else if (fo) {
                        frame_offset = fo;
                        conditions++;
                    } else if (f) {
                        filters.add(f);
                        conditions++;
                    } else if (attachment) {
                        throw makeError({
                            message:'Encountered second attachment name.',
                            index:i - 1
                        });
                    } else {
                        attachment = a;
                    }

                    var c = input.charAt(i);
                    if (c === '{' || c === '}' || c === ';' || c === ',') { break; }
                }

                if (segments) {
                    return new tree.Selector(filters, zoom, frame_offset, elements, attachment, conditions, memo);
                }
            },

            filter: function() {
                save();
                var key, op, val;
                if (! $('[')) return;
                if (key = $(/^[a-zA-Z0-9\-_]+/) || $(this.entities.quoted) || $(this.entities.variable)) {
                    if ((op = $(this.entities.comparison)) &&
                        (val = $(this.entities.quoted) || $(this.entities.variable) || $(/^[\w\-\.]+/))) {
                        if (! $(']')) return;
                        return new tree.Filter(key, op, val, memo, env.filename);
                    }
                }
            },

            frame_offset: function() {
                save();
                var op, val;
                if ($(/^\[\s*frame-offset/g) &&
                    (op = $(this.entities.comparison)) &&
                    (val = $(/^\d+/)) &&
                    $(']'))  {
                        return tree.FrameOffset(op, val, memo);
                }
            },

            zoom: function() {
                save();
                var op, val;
                if ($(/^\[\s*zoom/g) &&
                    (op = $(this.entities.comparison)) &&
                    (val = $(/^\d+/)) &&
                    $(']')) {
                        return tree.Zoom(op, val, memo);
                }
            },

            //
            // The `block` rule is used by `ruleset`
            // It's a wrapper around the `primary` rule, with added `{}`.
            //
            block: function() {
                var content;

                if ($('{') && (content = $(this.primary)) && $('}')) {
                    return content;
                }
            },

            //
            // div, .class, body > p {...}
            //
            ruleset: function() {
                var selectors = [], s, f, l, rules, filters = [];
                save();

                while (s = $(this.selector)) {
                    selectors.push(s);
                    if (! $(',')) { break }
                }
                if (s) $(this.comment);

                if (selectors.length > 0 && (rules = $(this.block))) {
                    if (selectors.length === 1 &&
                        selectors[0].elements.length &&
                        selectors[0].elements[0].value === 'Map') {
                        var rs = new tree.Ruleset(selectors, rules);
                        rs.isMap = true;
                        return rs;
                    }
                    return new tree.Ruleset(selectors, rules);
                } else {
                    // Backtrack
                    restore();
                }
            },
            rule: function() {
                var name, value, c = input.charAt(i);
                save();

                if (c === '.' || c === '#' || c === '&') { return }

                if (name = $(this.variable) || $(this.property)) {
                    value = $(this.value);

                    if (value && $(this.end)) {
                        return new tree.Rule(name, value, memo, env.filename);
                    } else {
                        furthest = i;
                        restore();
                    }
                }
            },

            font: function() {
                var value = [], expression = [], weight, font, e;

                while (e = $(this.entity)) {
                    expression.push(e);
                }

                value.push(new tree.Expression(expression));

                if ($(',')) {
                    while (e = $(this.expression)) {
                        value.push(e);
                        if (! $(',')) { break; }
                    }
                }
                return new tree.Value(value);
            },

            // A Value is a comma-delimited list of Expressions
            // In a Rule, a Value represents everything after the `:`,
            // and before the `;`.
            value: function() {
                var e, expressions = [];

                while (e = $(this.expression)) {
                    expressions.push(e);
                    if (! $(',')) { break; }
                }

                if (expressions.length > 0) {
                    return new tree.Value(expressions);
                }
            },
            // A sub-expression, contained by parenthensis
            sub: function() {
                var e;

                if ($('(') && (e = $(this.expression)) && $(')')) {
                    return e;
                }
            },
            // This is a misnomer because it actually handles multiplication
            // and division.
            multiplication: function() {
                var m, a, op, operation;
                if (m = $(this.operand)) {
                    while ((op = ($('/') || $('*') || $('%'))) && (a = $(this.operand))) {
                        operation = new tree.Operation(op, [operation || m, a], memo);
                    }
                    return operation || m;
                }
            },
            addition: function() {
                var m, a, op, operation;
                if (m = $(this.multiplication)) {
                    while ((op = $(/^[-+]\s+/) || (input.charAt(i - 1) != ' ' && ($('+') || $('-')))) &&
                           (a = $(this.multiplication))) {
                        operation = new tree.Operation(op, [operation || m, a], memo);
                    }
                    return operation || m;
                }
            },

            // An operand is anything that can be part of an operation,
            // such as a Color, or a Variable
            operand: function() {
                return $(this.sub) || $(this.entity);
            },

            // Expressions either represent mathematical operations,
            // or white-space delimited Entities.
            //
            //     1px solid black
            //     @var * 2
            expression: function() {
                var e, delim, entities = [], d;

                while (e = $(this.addition) || $(this.entity)) {
                    entities.push(e);
                }
                if (entities.length > 0) {
                    return new tree.Expression(entities);
                }
            },
            property: function() {
                var name = $(/^(([a-z][-a-z_0-9]*\/)?\*?-?[-a-z_0-9]+)\s*:/);
                if (name) return name[1];
            }
        }
    };
};

/**
 * TODO: document this. What does this do?
 */
if(typeof(module) !== "undefined") {
  module.exports.find = function (obj, fun) {
      for (var i = 0, r; i < obj.length; i++) {
          if (r = fun.call(obj, obj[i])) { return r; }
      }
      return null;
  };
}
(function(tree) {

tree.Anonymous = function Anonymous(string) {
    this.value = string.value || string;
};
tree.Anonymous.prototype = {
    toString: function() {
        return this.value;
    },
    eval: function() { return this; }
};

})(require('../tree'));
(function(tree) {

tree.Call = function Call(name, args, index) {
    this.is = 'call';

    this.name = name;
    this.args = args;
    this.index = index;
};

tree.Call.prototype = {
    //
    // When evaluating a function call,
    // we either find the function in `tree.functions` [1],
    // in which case we call it, passing the  evaluated arguments,
    // or we simply print it out as it appeared originally [2].
    //
    // The *functions.js* file contains the built-in functions.
    //
    // The reason why we evaluate the arguments, is in the case where
    // we try to pass a variable to a function, like: `saturate(@color)`.
    // The function should receive the value, not the variable.
    //
    eval: function(env) {
        var args = this.args.map(function(a) { return a.eval(env); });

        for (var i = 0; i < args.length; i++) {
            if (args[i].is === 'undefined') {
                return {
                    is: 'undefined',
                    value: 'undefined'
                };
            }
        }

        if (this.name in tree.functions) {
            if (tree.functions[this.name].length === args.length) {
                return tree.functions[this.name].apply(tree.functions, args);
            } else {
                env.error({
                    message: 'incorrect number of arguments for ' + this.name +
                        '(). ' + tree.functions[this.name].length + ' expected.',
                    index: this.index,
                    type: 'runtime',
                    filename: this.filename
                });
                return {
                    is: 'undefined',
                    value: 'undefined'
                };
            }
        } else {
            var fn = tree.Reference.mapnikFunction(this.name);
            if (!fn) {
                env.error({
                    message: 'unknown function ' + this.name,
                    index: this.index,
                    type: 'runtime',
                    filename: this.filename
                });
                return {
                    is: 'undefined',
                    value: 'undefined'
                };
            }
            if (fn[1] !== args.length) {
                env.error({
                    message: 'function ' + this.name + ' takes ' +
                        fn[1] + ' arguments and was given ' + args.length,
                    index: this.index,
                    type: 'runtime',
                    filename: this.filename
                });
                return {
                    is: 'undefined',
                    value: 'undefined'
                };
            } else {
                // Save the evaluated versions of arguments
                this.args = args;
                return this;
            }
        }
    },

    toString: function(env, format) {
        if (format === 'image-filter') {
            if (this.args.length) {
                return this.name + ':' + this.args.join(',');
            } else {
                return this.name;
            }
        } else {
            if (this.args.length) {
                return this.name + '(' + this.args.join(',') + ')';
            } else {
                return this.name;
            }
        }
    }
};

})(require('../tree'));
(function(tree) {
//
// RGB Colors - #ff0014, #eee
//
tree.Color = function Color(rgb, a) {
    //
    // The end goal here, is to parse the arguments
    // into an integer triplet, such as `128, 255, 0`
    //
    // This facilitates operations and conversions.
    //
    if (Array.isArray(rgb)) {
        this.rgb = rgb;
    } else if (rgb.length == 6) {
        this.rgb = rgb.match(/.{2}/g).map(function(c) {
            return parseInt(c, 16);
        });
    } else {
        this.rgb = rgb.split('').map(function(c) {
            return parseInt(c + c, 16);
        });
    }
    this.is = 'color';
    this.alpha = typeof(a) === 'number' ? a : 1;
};

tree.Color.prototype = {
    eval: function() { return this; },

    // If we have some transparency, the only way to represent it
    // is via `rgba`. Otherwise, we use the hex representation,
    // which has better compatibility with older browsers.
    // Values are capped between `0` and `255`, rounded and zero-padded.
    toString: function() {
        if (this.alpha < 1.0) {
            return 'rgba(' + this.rgb.map(function(c) {
                return Math.round(c);
            }).concat(this.alpha).join(', ') + ')';
        } else {
            return '#' + this.rgb.map(function(i) {
                i = Math.round(i);
                i = (i > 255 ? 255 : (i < 0 ? 0 : i)).toString(16);
                return i.length === 1 ? '0' + i : i;
            }).join('');
        }
    },

    // Operations have to be done per-channel, if not,
    // channels will spill onto each other. Once we have
    // our result, in the form of an integer triplet,
    // we create a new Color node to hold the result.
    operate: function(op, other) {
        var result = [];

        if (! (other instanceof tree.Color)) {
            other = other.toColor();
        }

        for (var c = 0; c < 3; c++) {
            result[c] = tree.operate(op, this.rgb[c], other.rgb[c]);
        }
        return new tree.Color(result);
    },

    toHSL: function() {
        var r = this.rgb[0] / 255,
            g = this.rgb[1] / 255,
            b = this.rgb[2] / 255,
            a = this.alpha;

        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2, d = max - min;

        if (max === min) {
            h = s = 0;
        } else {
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h: h * 360, s: s, l: l, a: a };
    }
};


})(require('../tree'));
(function(tree) {

tree.Comment = function Comment(value, silent) {
    this.value = value;
    this.silent = !!silent;
};

tree.Comment.prototype = {
    toString: function(env) {
        return '<!--' + this.value + '-->';
    },
    eval: function() { return this; }
};

})(require('../tree'));
(function(tree) {
var assert = require('assert');

tree.Definition = function Definition(selector, rules) {
    this.elements = selector.elements;
    assert.ok(selector.filters instanceof tree.Filterset);
    this.rules = rules;
    this.ruleIndex = [];
    for (var i = 0; i < this.rules.length; i++) {
        if ('zoom' in this.rules[i]) this.rules[i] = this.rules[i].clone();
        this.rules[i].zoom = selector.zoom;
        this.ruleIndex.push(this.rules[i].updateID());
    }
    this.filters = selector.filters;
    this.zoom = selector.zoom;
    this.frame_offset = selector.frame_offset;
    this.attachment = selector.attachment || '__default__';
    this.specificity = selector.specificity();
};

tree.Definition.prototype.toString = function() {
    var str = this.filters.toString();
    for (var i = 0; i < this.rules.length; i++) {
        str += '\n    ' + this.rules[i];
    }
    return str;
};

tree.Definition.prototype.clone = function(filters) {
    if (filters) assert.ok(filters instanceof tree.Filterset);
    var clone = Object.create(tree.Definition.prototype);
    clone.rules = this.rules.slice();
    clone.ruleIndex = this.ruleIndex.slice();
    clone.filters = filters ? filters : this.filters.clone();
    clone.attachment = this.attachment;
    return clone;
};

tree.Definition.prototype.addRules = function(rules) {
    var added = 0;

    // Add only unique rules.
    for (var i = 0; i < rules.length; i++) {
        if (this.ruleIndex.indexOf(rules[i].id) < 0) {
            this.rules.push(rules[i]);
            this.ruleIndex.push(rules[i].id);
            added++;
        }
    }

    return added;
};

/**
 * Determine whether this selector matches a given id
 * and array of classes, by determining whether
 * all elements it contains match.
 */
tree.Definition.prototype.appliesTo = function(id, classes) {
    for (var i = 0; i < this.elements.length; i++) {
        if (!this.elements[i].matches(id, classes)) {
            return false;
        }
    }
    return true;
};

tree.Definition.prototype.symbolizersToXML = function(env, symbolizers, zoom) {
    var xml = '  <Rule>\n';
    xml += tree.Zoom.toXML(zoom).join('');
    xml += this.filters.toXML(env);

    // Sort symbolizers by the index of their first property definition
    var sym_order = [], indexes = [];
    for (var key in symbolizers) {
        indexes = [];
        for (var prop in symbolizers[key]) {
            indexes.push(symbolizers[key][prop].index);
        }
        var min_idx = Math.min.apply(Math, indexes);
        sym_order.push([key, min_idx]);
    }

    // Get a simple list of the symbolizers, in order
    sym_order = sym_order.sort(function(a, b) {
        return a[1] - b[1];
    }).map(function(v) {
        return v[0];
    });

    for (var i = 0; i < sym_order.length; i++) {
        var attributes = symbolizers[sym_order[i]];
        var symbolizer = sym_order[i].split('/').pop();
        
        // Skip the magical * symbolizer which is used for universal properties
        // which are bubbled up to Style elements intead of Symbolizer elements.
        if (symbolizer === '*') continue;

        var fail = tree.Reference.requiredProperties(symbolizer, attributes);
        if (fail) {
            var rule = attributes[Object.keys(attributes).shift()];
            env.error({
                message: fail,
                index: rule.index,
                filename: rule.filename
            });
        }

        var name = symbolizer.charAt(0).toUpperCase() +
               symbolizer.slice(1).replace(/\-./, function(str) {
                   return str[1].toUpperCase();
               }) + 'Symbolizer';

        var selfclosing = true, tagcontent;
        xml += '    <' + name + ' ';
        for (var key in attributes) {
            if (symbolizer === 'map') env.error({
                message: 'Map properties are not permitted in other rules',
                index: attributes[key].index,
                filename: attributes[key].filename
            });
            var x = tree.Reference.selector(attributes[key].name);
            if (x && x.serialization && x.serialization === 'content') {
                selfclosing = false;
                tagcontent = attributes[key].eval(env).toXML(env, true);
            } else {
                xml += attributes[key].eval(env).toXML(env) + ' ';
            }
        }
        if (selfclosing) {
            xml += '/>\n';
        } else {
            xml += '><![CDATA[' + tagcontent + ']]></' + name + '>\n';
        }
    }
    xml += '  </Rule>\n';
    return xml;
};

tree.Definition.prototype.collectSymbolizers = function(zooms, i) {
    var symbolizers = {}, child;

    for (var j = i; j < this.rules.length; j++) {
        child = this.rules[j];
        var key = child.instance + '/' + child.symbolizer;
        if (zooms.current & child.zoom &&
           (!(key in symbolizers) ||
           (!(child.name in symbolizers[key])))) {
            zooms.current &= child.zoom;
            if (!(key in symbolizers)) {
                symbolizers[key] = {};
            }
            symbolizers[key][child.name] = child;
        }
    }

    if (Object.keys(symbolizers).length) {
        zooms.rule &= (zooms.available &= ~zooms.current);
        return symbolizers;
    }
};

tree.Definition.prototype.toXML = function(env, existing) {
    // The tree.Zoom.toString function ignores the holes in zoom ranges and outputs
    // scaledenominators that cover the whole range from the first to last bit set.
    // This algorithm can produces zoom ranges that may have holes. However,
    // when using the filter-mode="first", more specific zoom filters will always
    // end up before broader ranges. The filter-mode will pick those first before
    // resorting to the zoom range with the hole and stop processing further rules.
    var filter = this.filters.toString();
    if (!(filter in existing)) existing[filter] = tree.Zoom.all;

    var available = tree.Zoom.all, xml = '', zoom, symbolizers;
    var zooms = { available: tree.Zoom.all };
    for (var i = 0; i < this.rules.length && available; i++) {
        zooms.rule = this.rules[i].zoom;
        if (!(existing[filter] & zooms.rule)) continue;

        while (zooms.current = zooms.rule & available) {
            if (symbolizers = this.collectSymbolizers(zooms, i)) {
                if (!(existing[filter] & zooms.current)) continue;
                xml += this.symbolizersToXML(env, symbolizers, existing[filter] & zooms.current);
                existing[filter] &= ~zooms.current;
            }
        }
    }

    return xml;
};

})(require('../tree'));
(function(tree) {

//
// A number with a unit
//
tree.Dimension = function Dimension(value, unit, index) {
    this.value = parseFloat(value);
    this.unit = unit || null;
    this.is = 'float';
    this.index = index;
};

tree.Dimension.prototype = {
    eval: function (env) {
        if (this.unit && ['px', '%'].indexOf(this.unit) === -1) {
             env.error({
                message: "Invalid unit: '" + this.unit + "'",
                index: this.index
            });
        }

        return this;
    },
    round: function() {
        this.value = Math.round(this.value);
        return this;
    },
    toColor: function() {
        return new tree.Color([this.value, this.value, this.value]);
    },
    toString: function() {
        return this.value.toString();
    },

    // In an operation between two Dimensions,
    // we default to the first Dimension's unit,
    // so `1px + 2em` will yield `3px`.
    // In the future, we could implement some unit
    // conversions such that `100cm + 10mm` would yield
    // `101cm`.
    operate: function(op, other) {
        return new tree.Dimension(tree.operate(op, this.value, other.value),
                  this.unit || other.unit);
    }
};

})(require('../tree'));
(function(tree) {

tree.Directive = function Directive(name, value) {
    this.name = name;
    if (Array.isArray(value)) {
        this.ruleset = new tree.Ruleset([], value);
    } else {
        this.value = value;
    }
};
tree.Directive.prototype = {
    toString: function(ctx, env) {
        if (this.ruleset) {
            this.ruleset.root = true;
            return this.name + ' {\n  ' +
                   this.ruleset.toString(ctx, env).trim().replace(/\n/g, '\n  ') +
                               '\n}\n';
        } else {
            return this.name + ' ' + this.value.toString() + ';\n';
        }
    },
    eval: function(env) {
        env.frames.unshift(this);
        this.ruleset = this.ruleset && this.ruleset.eval(env);
        env.frames.shift();
        return this;
    },
    variable: function(name) {
        return tree.Ruleset.prototype.variable.call(this.ruleset, name);
    },
    find: function() {
        return tree.Ruleset.prototype.find.apply(this.ruleset, arguments);
    },
    rulesets: function() {
        return tree.Ruleset.prototype.rulesets.apply(this.ruleset);
    }
};

})(require('../tree'));
(function(tree) {

// An element is an id or class selector
tree.Element = function Element(value) {
    this.value = value.trim();
};

// Determine the 'specificity matrix' of this
// specific selector
tree.Element.prototype.specificity = function() {
    return [
        (this.value[0] == '#') ? 1 : 0, // a
        (this.value[0] == '.') ? 1 : 0  // b
    ];
};

tree.Element.prototype.toString = function() {
    return this.value;
};

// Determine whether this element matches an id or classes.
// An element is a single id or class, or check whether the given
// array of classes contains this, or the id is equal to this.
//
// Takes a plain string for id and plain strings in the array of
// classes.
tree.Element.prototype.matches = function(id, classes) {
    return (classes.indexOf(this.value.replace(/^\./, '')) !== -1) ||
        (this.value.replace(/^#/, '') === id) ||
        (this.value === '*');
};

})(require('../tree'));
(function(tree) {

tree.Expression = function Expression(value) {
    this.value = value;
};
tree.Expression.prototype = {
    eval: function(env) {
        if (this.value.length > 1) {
            return new tree.Expression(this.value.map(function(e) {
                return e.eval(env);
            }));
        } else {
            return this.value[0].eval(env);
        }
    },
    toString: function(env) {
        return this.value.map(function(e) {
            return e.toString(env);
        }).join(' ');
    }
};

})(require('../tree'));
(function(tree) {

tree.Field = function Field(content) {
    this.value = content || '';
    this.is = 'field';
};

tree.Field.prototype = {
    toString: function() {
        return '[' + this.value + ']';
    },
    'eval': function() {
        return this;
    }
};

})(require('../tree'));
(function(tree) {

tree.Filter = function Filter(key, op, val, index, filename) {
    if (key.is) {
        this.key = key.value;
        this._key = key;
    } else {
        this.key = key;
    }

    this.op = op;
    this.index = index;
    this.filename = filename;

    if (val.is) {
        this.val = val.value;
        this._val = val;
    } else {
        this.val = val;
    }

    if (ops[this.op][1] == 'numeric') {
        this.val = 1 * this.val;
    }

    this.id = this.key + this.op + this.val;
};


// xmlsafe, numeric, suffix
var ops = {
    '<': [' &lt; ', 'numeric'],
    '>': [' &gt; ', 'numeric'],
    '=': [' = ', 'both'],
    '!=': [' != ', 'both'],
    '<=': [' &lt;= ', 'numeric'],
    '>=': [' &gt;= ', 'numeric'],
    '=~': ['.match(', 'string', ')']
};

tree.Filter.prototype.toXML = function(env) {
    if (this.val.eval) this._val = this.val.eval(env);
    if (this.key.eval) this._key = this.key.eval(env);
    if (this._key) var key = this._key.toString(false);
    if (this._val) var val = this._val.toString(this._val.is == 'string');

    if (
        (ops[this.op][1] == 'numeric' && isNaN(this.val)) ||
        (ops[this.op][1] == 'string' && (val || this.val)[0] != "'")
    ) {
        env.error({
            message: 'Cannot use operator "' + this.op + '" with value ' + this.val,
            index: this.index,
            filename: this.filename
        });
    }

    return '[' + (key || this.key) + ']' + ops[this.op][0] + '' + (val || this.val) + (ops[this.op][2] || '');
};

tree.Filter.prototype.toString = function() {
    return '[' + this.id + ']';
};

})(require('../tree'));
var tree = require('../tree');

tree.Filterset = function Filterset() {};

Object.defineProperty(tree.Filterset.prototype, 'toXML', {
    enumerable: false,
    value: function(env) {
        var filters = [];
        for (var id in this) {
            filters.push('(' + this[id].toXML(env).trim() + ')');
        }

        if (filters.length) {
            return '    <Filter>' + filters.join(' and ') + '</Filter>\n';
        } else {
            return '';
        }
    }
});

Object.defineProperty(tree.Filterset.prototype, 'toString', {
    enumerable: false,
    value: function() {
        var arr = [];
        for (var id in this) arr.push(this[id].id);
        arr.sort();
        return arr.join('\t');
    }
});

Object.defineProperty(tree.Filterset.prototype, 'clone', {
    enumerable: false,
    value: function() {
        var clone = new tree.Filterset();
        for (var id in this) {
            clone[id] = this[id];
        }
        return clone;
    }
});

// Note: other has to be a tree.Filterset.
Object.defineProperty(tree.Filterset.prototype, 'cloneWith', {
    enumerable: false,
    value: function(other) {
        var additions;
        for (var id in other) {
            var status = this.addable(other[id]);
            if (status === false) {
                return false;
            }
            if (status === true) {
                // Adding the filter will override another value.
                if (!additions) additions = [];
                additions.push(other[id]);
            }
        }

        // Adding the other filters doesn't make this filterset invalid, but it
        // doesn't add anything to it either.
        if (!additions) return null;

        // We can successfully add all filters. Now clone the filterset and add the
        // new rules.
        var clone = new tree.Filterset();

        // We can add the rules that are already present without going through the
        // add function as a Filterset is always in it's simplest canonical form.
        for (var id in this) {
            clone[id] = this[id];
        }

        // Only add new filters that actually change the filter.
        while (id = additions.shift()) {
            clone.add(id);
        }

        return clone;
    }
});

/**
 * Returns true when the new filter can be added, false otherwise.
 */
Object.defineProperty(tree.Filterset.prototype, 'addable', {
    enumerable: false,
    value: function(filter) {
        var key = filter.key, value = filter.val;

        switch (filter.op) {
            case '=':
                if (key + '=' in this) return (this[key + '='].val != value) ? false : null;
                if (key + '!=' + value in this) return false;
                if (key + '>' in this  && this[key + '>'].val >= value) return false;
                if (key + '<' in this  && this[key + '<'].val <= value) return false;
                if (key + '>=' in this && this[key + '>='].val > value) return false;
                if (key + '<=' in this && this[key + '<='].val < value) return false;
                return true;

            case '!=':
                if (key + '=' in this) return (this[key + '='].val == value) ? false : null;
                if (key + '!=' + value in this) return null;
                if (key + '>' in this  && this[key + '>'].val >= value) return null;
                if (key + '<' in this  && this[key + '<'].val <= value) return null;
                if (key + '>=' in this && this[key + '>='].val > value) return null;
                if (key + '<=' in this && this[key + '<='].val < value) return null;
                return true;

            case '>':
                if (key + '=' in this) return (this[key + '='].val <= value) ? false : null;
                if (key + '<' in this && this[key + '<'].val <= value) return false;
                if (key + '<=' in this && this[key + '<='].val <= value) return false;
                if (key + '>' in this && this[key + '>'].val >= value) return null;
                if (key + '>=' in this && this[key + '>='].val > value) return null;
                return true;

            case '>=':
                if (key + '=' in this) return (this[key + '='].val < value) ? false : null;
                if (key + '<' in this && this[key + '<'].val <= value) return false;
                if (key + '<=' in this && this[key + '<='].val < value) return false;
                if (key + '>' in this && this[key + '>'].val >= value) return null;
                if (key + '>=' in this && this[key + '>='].val >= value) return null;
                return true;

            case '<':
                if (key + '=' in this) return (this[key + '='].val >= value) ? false : null;
                if (key + '>' in this && this[key + '>'].val >= value) return false;
                if (key + '>=' in this && this[key + '>='].val >= value) return false;
                if (key + '<' in this && this[key + '<'].val <= value) return null;
                if (key + '<=' in this && this[key + '<='].val < value) return null;
                return true;

            case '<=':
                if (key + '=' in this) return (this[key + '='].val > value) ? false : null;
                if (key + '>' in this && this[key + '>'].val >= value) return false;
                if (key + '>=' in this && this[key + '>='].val > value) return false;
                if (key + '<' in this && this[key + '<'].val <= value) return null;
                if (key + '<=' in this && this[key + '<='].val <= value) return null;
                return true;
        }
    }
});

/**
 * Only call this function for filters that have been cleared by .addable().
 */
Object.defineProperty(tree.Filterset.prototype, 'add', {
    enumerable: false,
    value: function(filter) {
        var key = filter.key;

        switch (filter.op) {
            case '=':
                for (var id in this) {
                    if (this[id].key == key) {
                        delete this[id];
                    }
                }
                this[key + '='] = filter;
                break;

            case '!=':
                this[key + '!=' + filter.val] = filter;
                break;

            case '=~':
                this[key + '=~' + filter.val] = filter;
                break;

            case '>':
                // If there are other filters that are also >
                // but are less than this one, they don't matter, so
                // remove them.
                for (var id in this) {
                    if (this[id].key == key && this[id].val <= filter.val) {
                        delete this[id];
                    }
                }
                this[key + '>'] = filter;
                break;

            case '>=':
                for (var id in this) {
                    if (this[id].key == key && this[id].val < filter.val) {
                        delete this[id];
                    }
                }
                if (key + '!=' + filter.val in this) {
                    delete this[key + '!=' + filter.val];
                    filter.op = '>';
                    this[key + '>'] = filter;
                }
                else {
                    this[key + '>='] = filter;
                }
                break;

            case '<':
                for (var id in this) {
                    if (this[id].key == key && this[id].val >= filter.val) {
                        delete this[id];
                    }
                }
                this[key + '<'] = filter;
                break;

            case '<=':
                for (var id in this) {
                    if (this[id].key == key && this[id].val > filter.val) {
                        delete this[id];
                    }
                }
                if (key + '!=' + filter.val in this) {
                    delete this[key + '!=' + filter.val];
                    filter.op = '<';
                    this[key + '<'] = filter;
                }
                else {
                    this[key + '<='] = filter;
                }
                break;
        }
    }
});
(function(tree) {

tree._getFontSet = function(env, fonts) {
    var find_existing = function(fonts) {
        var findFonts = fonts.join('');
        for (var i = 0; i < env.effects.length; i++) {
            if (findFonts == env.effects[i].fonts.join('')) {
                return env.effects[i];
            }
        }
    };

    var existing = false;
    if (existing = find_existing(fonts)) {
        return existing;
    } else {
        var new_fontset = new tree.FontSet(env, fonts);
        env.effects.push(new_fontset);
        return new_fontset;
    }
};

tree.FontSet = function FontSet(env, fonts) {
    this.fonts = fonts;
    this.name = 'fontset-' + env.effects.length;
};

tree.FontSet.prototype.toXML = function(env) {
    return '<FontSet name="' +
        this.name +
        '">\n' +
        this.fonts.map(function(f) {
            return '  <Font face-name="' + f +'"/>';
        }).join('\n') +
        '\n</FontSet>';
};

})(require('../tree'));
var tree = require('../tree');

// Storage for Frame offset value
// and stores them as bit-sequences so that they can be combined,
// inverted, and compared quickly.
tree.FrameOffset = function(op, value, index) {
    value = parseInt(value, 10);
    if (value > tree.FrameOffset.max || value <= 0) {
        throw {
            message: 'Only frame-offset levels between 1 and ' +
                tree.FrameOffset.max + ' supported.',
            index: index
        };
    }

    if (op !== '=') {
        throw {
            message: 'only = operator is supported for frame-offset',
            index: index
        };
    }
    return value;
};

tree.FrameOffset.max = 32;
tree.FrameOffset.none = 0;

(function(tree) {
//
// RGB Colors - #ff0014, #eee
//
tree.ImageFilter = function ImageFilter(filter, args) {
    this.is = 'imagefilter';
    this.filter = filter;
    this.args = args || null;
};
tree.ImageFilter.prototype = {
    eval: function() { return this; },

    toString: function() {
        if (this.args) {
            return this.filter + ':' + this.args.join(',');
        } else {
            return this.filter;
        }
    }
};


})(require('../tree'));
(function (tree) {
tree.Invalid = function Invalid(chunk, index, message) {
    this.chunk = chunk;
    this.index = index;
    this.type = 'syntax';
    this.message = message || "Invalid code: " + this.chunk;
};

tree.Invalid.prototype.eval = function(env) {
    env.error({
        chunk: this.chunk,
        index: this.index,
        type: 'syntax',
        message: this.message || "Invalid code: " + this.chunk
    });
    return {
        is: 'undefined'
    };
};
})(require('../tree'));
(function(tree) {

tree.Keyword = function Keyword(value) {
    this.value = value;
    var special = {
        'transparent': 'color',
        'true': 'boolean',
        'false': 'boolean'
    };
    this.is = special[value] ? special[value] : 'keyword';
};
tree.Keyword.prototype = {
    eval: function() { return this; },
    toString: function() { return this.value; }
};

})(require('../tree'));
(function(tree) {

tree.Layer = function Layer(obj) {
    this.name = obj.name;
    this.status = obj.status;
    this.styles = obj.styles;
    this.properties = obj.properties  || {};
    this.srs = obj.srs;
    this.datasource = obj.Datasource;
};

tree.Layer.prototype.toXML = function() {
    var dsoptions = [];
    for (var i in this.datasource) {
        dsoptions.push('<Parameter name="' + i + '"><![CDATA[' +
            this.datasource[i] + ']]></Parameter>');
    }

    var prop_string = '';
    for (var i in this.properties) {
        prop_string += '  ' + i + '="' + this.properties[i] + '"\n';
    }

    return '<Layer' +
        ' name="' + this.name + '"\n' +
        prop_string +
        ((typeof this.status === 'undefined') ? '' : '  status="' + this.status + '"\n') +
        '  srs="' + this.srs + '">\n    ' +
        this.styles.reverse().map(function(s) {
            return '<StyleName>' + s + '</StyleName>';
        }).join('\n    ') +
        '\n    <Datasource>\n       ' +
        dsoptions.join('\n       ') +
        '\n    </Datasource>\n' +
        '  </Layer>\n';
};

})(require('../tree'));
// A literal is a literal string for Mapnik - the
// result of the combination of a `tree.Field` with any
// other type.
(function(tree) {

tree.Literal = function Field(content) {
    this.value = content || '';
    this.is = 'field';
};

tree.Literal.prototype = {
    toString: function() {
        return this.value;
    },
    'eval': function() {
        return this;
    }
};

})(require('../tree'));
(function(tree) {

tree.Operation = function Operation(op, operands, index) {
    this.op = op.trim();
    this.operands = operands;
    this.index = index;
    this.is = 'operation';
};

tree.Operation.prototype.eval = function(env) {
    var a = this.operands[0].eval(env),
        b = this.operands[1].eval(env),
        temp;

    if (a.is === 'undefined' || b.is === 'undefined') {
        return {
            is: 'undefined',
            value: 'undefined'
        };
    }

    if (a instanceof tree.Dimension && b instanceof tree.Color) {
        if (this.op === '*' || this.op === '+') {
            temp = b, b = a, a = temp;
        } else {
            env.error({
                name: "OperationError",
                message: "Can't substract or divide a color from a number",
                index: this.index
            });
        }
    }

    // Only concatenate plain strings, because this is easily
    // pre-processed
    if (a instanceof tree.Quoted && b instanceof tree.Quoted && this.op !== '+') {
        env.error({
           message: "Can't subtract, divide, or multiply strings.",
           index: this.index,
           type: 'runtime',
           filename: this.filename
        });
        return {
            is: 'undefined',
            value: 'undefined'
        };
    }

    // Fields, literals, dimensions, and quoted strings can be combined.
    if (a instanceof tree.Field || b instanceof tree.Field ||
        a instanceof tree.Literal || b instanceof tree.Literal) {
        if (a.is === 'color' || b.is === 'color') {
            env.error({
               message: "Can't subtract, divide, or multiply colors in expressions.",
               index: this.index,
               type: 'runtime',
               filename: this.filename
            });
            return {
                is: 'undefined',
                value: 'undefined'
            };
        } else {
            return new tree.Literal(a.eval(env).toString(true) + this.op + b.eval(env).toString(true));
        }
    }

    return a.operate(this.op, b);
};

tree.operate = function(op, a, b) {
    switch (op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '%': return a % b;
        case '/': return a / b;
    }
};

})(require('../tree'));
(function(tree) {

tree.Quoted = function Quoted(content) {
    this.value = content || '';
    this.is = 'string';
};

tree.Quoted.prototype = {
    toString: function(quotes) {
        var xmlvalue = this.value.replace(/\'/g, '&apos;');
        return (quotes === true) ? "'" + xmlvalue + "'" : this.value;
    },

    'eval': function() {
        return this;
    },

    operate: function(op, other) {
        return new tree.Quoted(true,
            tree.operate(op, this.toString(), other.toString(this.contains_field)));
    }
};

})(require('../tree'));
/*
 * Carto pulls in a reference from the `mapnik-reference`
 * module. This file builds indexes from that file for its various
 * options, and provides validation methods for property: value
 * combinations.
 */
(function(tree) {


var _ = require('underscore');
var reference = require('mapnik-reference');

tree.Reference = {
    data: reference.version.latest
};

tree.Reference.set = function(ref, version) {
    reference = ref;
    tree.Reference.setVersion(version || 'latest');
};

tree.Reference.setVersion = function(version) {
    tree.Reference.data = reference.version[version];
};

tree.Reference.required_prop_list_cache = {};

tree.Reference.selectors = tree.Reference.selectors || (function() {
    var list = [];
    for (var i in tree.Reference.data.symbolizers) {
        for (var j in tree.Reference.data.symbolizers[i]) {
            if (tree.Reference.data.symbolizers[i][j].hasOwnProperty('css')) {
                list.push(tree.Reference.data.symbolizers[i][j].css);
            }
        }
    }
    return list;
})();

tree.Reference.validSelector = function(selector) {
    return tree.Reference.selectors.indexOf(selector) !== -1;
};

tree.Reference.selectorName = function(selector) {
    for (var i in tree.Reference.data.symbolizers) {
        for (var j in tree.Reference.data.symbolizers[i]) {
            if (selector == tree.Reference.data.symbolizers[i][j].css) {
                return j;
            }
        }
    }
};

tree.Reference.selector = function(selector) {
    for (var i in tree.Reference.data.symbolizers) {
        for (var j in tree.Reference.data.symbolizers[i]) {
            if (selector == tree.Reference.data.symbolizers[i][j].css) {
                return tree.Reference.data.symbolizers[i][j];
            }
        }
    }
};

tree.Reference.symbolizer = function(selector) {
    for (var i in tree.Reference.data.symbolizers) {
        for (var j in tree.Reference.data.symbolizers[i]) {
            if (selector == tree.Reference.data.symbolizers[i][j].css) {
                return i;
            }
        }
    }
};

/*
 * For transform properties and image-filters,
 * mapnik has its own functions.
 */
tree.Reference.mapnikFunction = function(name) {
    var functions = [];
    for (var i in tree.Reference.data.symbolizers) {
        for (var j in tree.Reference.data.symbolizers[i]) {
            if (tree.Reference.data.symbolizers[i][j].type === 'functions') {
                functions = functions.concat(tree.Reference.data.symbolizers[i][j].functions);
            }
        }
    }
    return _.find(functions, function(f) {
        return f[0] === name;
    });
};

tree.Reference.requiredPropertyList = function(symbolizer_name) {
    if (this.required_prop_list_cache[symbolizer_name]) {
        return this.required_prop_list_cache[symbolizer_name];
    }
    var properties = [];
    for (var j in tree.Reference.data.symbolizers[symbolizer_name]) {
        if (tree.Reference.data.symbolizers[symbolizer_name][j].required) {
            properties.push(tree.Reference.data.symbolizers[symbolizer_name][j].css);
        }
    }
    return this.required_prop_list_cache[symbolizer_name] = properties;
};

tree.Reference.requiredProperties = function(symbolizer_name, rules) {
    var req = tree.Reference.requiredPropertyList(symbolizer_name);
    for (var i in req) {
        if (!(req[i] in rules)) {
            return 'Property ' + req[i] + ' required for defining ' +
                symbolizer_name + ' styles.';
        }
    }
};

/**
 * TODO: finish implementation - this is dead code
 */
tree.Reference._validateValue = {
    'font': function(env, value) {
        if (env.validation_data && env.validation_data.fonts) {
            return env.validation_data.fonts.indexOf(value) != -1;
        } else {
            return true;
        }
    }
};

tree.Reference.isFont = function(selector) {
    return tree.Reference.selector(selector).validate == 'font';
};

tree.Reference.validValue = function(env, selector, value) {
    var i, j;
    // TODO: handle in reusable way
    if (!tree.Reference.selector(selector)) {
        return false;
    } else if (value.value[0].is == 'keyword') {
        return tree.Reference
            .selector(selector).type
            .indexOf(value.value[0].value) !== -1;
    } else if (value.value[0].is == 'undefined') {
        // caught earlier in the chain - ignore here so that
        // error is not overridden
        return true;
    } else if (tree.Reference.selector(selector).type == 'numbers') {
        for (i in value.value) {
            if (value.value[i].is !== 'float') {
                return false;
            }
        }
        return true;
    } else if (tree.Reference.selector(selector).type == 'functions') {
        // For backwards compatibility, you can specify a string for `functions`-compatible
        // values, though they will not be validated.
        if (value.value[0].is === 'string') {
            return true;
        } else {
            for (i in value.value) {
                for (j in value.value[i].value) {
                    if (value.value[i].value[j].is !== 'call') {
                        return false;
                    }
                    var f = _.find(tree.Reference
                        .selector(selector).functions, function(x) {
                            return x[0] == value.value[i].value[j].name;
                        });
                    // This filter is unknown
                    if (!f) return false;
                    // The filter has been given an incorrect number of arguments
                    if (f[1] !== value.value[i].value[j].args.length) return false;
                }
            }
            return true;
        }
    } else if (tree.Reference.selector(selector).type == 'expression') {
        return true;
    } else if (tree.Reference.selector(selector).type === 'unsigned') {
        if (value.value[0].is === 'float') {
            value.value[0].round();
            return true;
        } else {
            return false;
        }
    } else {
        if (tree.Reference.selector(selector).validate) {
            var valid = false;
            for (i = 0; i < value.value.length; i++) {
                if (tree.Reference.selector(selector).type == value.value[i].is &&
                    tree.Reference
                        ._validateValue
                            [tree.Reference.selector(selector).validate]
                            (env, value.value[i].value)) {
                    return true;
                }
            }
            return valid;
        } else {
            return tree.Reference.selector(selector).type == value.value[0].is;
        }
    }
};

})(require('../tree'));
(function(tree) {
tree.Rule = function Rule(name, value, index, filename) {
    var parts = name.split('/');
    this.name = parts.pop();
    this.instance = parts.length ? parts[0] : '__default__';
    this.value = (value instanceof tree.Value) ?
        value : new tree.Value([value]);
    this.index = index;
    this.symbolizer = tree.Reference.symbolizer(this.name);
    this.filename = filename;
    this.variable = (name.charAt(0) === '@');
};

tree.Rule.prototype.clone = function() {
    var clone = Object.create(tree.Rule.prototype);
    clone.name = this.name;
    clone.value = this.value;
    clone.index = this.index;
    clone.instance = this.instance;
    clone.symbolizer = this.symbolizer;
    clone.filename = this.filename;
    clone.variable = this.variable;
    return clone;
};

tree.Rule.prototype.updateID = function() {
    return this.id = this.zoom + '#' + this.name;
};

tree.Rule.prototype.toString = function() {
    return '[' + tree.Zoom.toString(this.zoom) + '] ' + this.name + ': ' + this.value;
};

// second argument, if true, outputs the value of this
// rule without the usual attribute="content" wrapping. Right
// now this is just for the TextSymbolizer, but applies to other
// properties in reference.json which specify serialization=content
tree.Rule.prototype.toXML = function(env, content, sep, format) {
    if (!tree.Reference.validSelector(this.name)) {
        return env.error({
            message: "Unrecognized rule: " + this.name,
            index: this.index,
            type: 'syntax',
            filename: this.filename
        });
    }

    if ((this.value instanceof tree.Value) &&
        !tree.Reference.validValue(env, this.name, this.value)) {
        if (!tree.Reference.selector(this.name)) {
            return env.error({
                message: 'Unrecognized property: ' +
                    this.name,
                index: this.index,
                type: 'syntax',
                filename: this.filename
            });
        } else {
            return env.error({
                message: 'Invalid value for ' +
                    this.name +
                    ', a valid ' +
                    (tree.Reference.selector(this.name).validate ||
                        tree.Reference.selector(this.name).type) +
                    ' is expected. ' + this.value +
                    ' was given.',
                index: this.index,
                type: 'syntax',
                filename: this.filename
            });
        }
    }

    if (this.variable) {
        return '';
    } else if (tree.Reference.isFont(this.name) && this.value.value.length > 1) {
        var f = tree._getFontSet(env, this.value.value);
        return 'fontset-name="' + f.name + '"';
    } else if (content) {
        return this.value.toString(env, this.name, sep);
    } else {
        return tree.Reference.selectorName(this.name) +
            '="' +
            this.value.toString(env, this.name) +
            '"';
    }
};

/**
 * TODO: Rule eval chain should add fontsets to env.frames
 */
tree.Rule.prototype['eval'] = function(context) {
    return new tree.Rule(this.name,
        this.value['eval'](context),
        this.index,
        this.filename);
};

})(require('../tree'));
(function(tree) {

tree.Ruleset = function Ruleset(selectors, rules) {
    this.selectors = selectors;
    this.rules = rules;
    // static cache of find() function
    this._lookups = {};
};
tree.Ruleset.prototype = {
    eval: function(env) {
        var ruleset = new tree.Ruleset(this.selectors, this.rules.slice(0));
        ruleset.root = this.root;

        // push the current ruleset to the frames stack
        env.frames.unshift(ruleset);

        // Evaluate imports
        if (ruleset.root) {
            for (var i = 0; i < ruleset.rules.length; i++) {
                if (ruleset.rules[i] instanceof tree.Import) {
                    Array.prototype.splice
                         .apply(ruleset.rules, [i, 1].concat(ruleset.rules[i].eval(env)));
                }
            }
        }

        // Evaluate everything else
        for (var i = 0, rule; i < ruleset.rules.length; i++) {
            rule = ruleset.rules[i];
            ruleset.rules[i] = rule.eval ? rule.eval(env) : rule;
        }

        // Pop the stack
        env.frames.shift();

        return ruleset;
    },
    match: function(args) {
        return !args || args.length === 0;
    },
    variables: function() {
        if (this._variables) { return this._variables; }
        else {
            return this._variables = this.rules.reduce(function(hash, r) {
                if (r instanceof tree.Rule && r.variable === true) {
                    hash[r.name] = r;
                }
                return hash;
            }, {});
        }
    },
    variable: function(name) {
        return this.variables()[name];
    },
    /**
     * Extend this rule by adding rules from another ruleset
     *
     * Currently this is designed to accept less specific
     * rules and add their values only if this ruleset doesn't
     * contain them.
     */

    rulesets: function() {
        if (this._rulesets) { return this._rulesets; }
        else {
            return this._rulesets = this.rules.filter(function(r) {
                return (r instanceof tree.Ruleset);
            });
        }
    },
    find: function(selector, self) {
        self = self || this;
        var rules = [], rule, match,
            key = selector.toString();

        if (key in this._lookups) { return this._lookups[key]; }

        this.rulesets().forEach(function(rule) {
            if (rule !== self) {
                for (var j = 0; j < rule.selectors.length; j++) {
                    if (match = selector.match(rule.selectors[j])) {
                        if (selector.elements.length > 1) {
                            Array.prototype.push.apply(rules, rule.find(
                                new tree.Selector(null, null, null, selector.elements.slice(1)), self));
                        } else {
                            rules.push(rule);
                        }
                        break;
                    }
                }
            }
        });
        return this._lookups[key] = rules;
    },
    flatten: function(result, parents, env) {
        var selectors = [];
        if (this.selectors.length === 0) {
            env.frames = env.frames.concat(this.rules);
        }
        for (var i = 0; i < this.selectors.length; i++) {
            var child = this.selectors[i];

            // This is an invalid filterset.
            if (!child.filters) continue;

            if (parents.length) {
                for (var j = 0; j < parents.length; j++) {
                    var parent = parents[j];

                    var mergedFilters = parent.filters.cloneWith(child.filters);
                    if (mergedFilters === null) {
                        // Filters could be added, but they didn't change the
                        // filters. This means that we only have to clone when
                        // the zoom levels or the attachment is different too.
                        if (parent.zoom === (parent.zoom & child.zoom) &&
                            parent.frame_offset === child.frame_offset &&
                            parent.attachment === child.attachment) {
                            continue;
                        } else {
                            mergedFilters = parent.filters;
                        }
                    } else if (!mergedFilters) {
                        // The merged filters are invalid, that means we don't
                        // have to clone.
                        continue;
                    }

                    var clone = Object.create(tree.Selector.prototype);
                    clone.filters = mergedFilters;
                    clone.zoom = parent.zoom & child.zoom;
                    clone.frame_offset = child.frame_offset;
                    clone.elements = parent.elements.concat(child.elements);
                    if (parent.attachment && child.attachment) {
                        clone.attachment = parent.attachment + '/' + child.attachment;
                    }
                    else clone.attachment = child.attachment || parent.attachment;
                    clone.conditions = parent.conditions + child.conditions;
                    clone.index = child.index;
                    selectors.push(clone);
                }
            } else {
                selectors.push(child);
            }
        }

        var rules = [];
        for (var i = 0; i < this.rules.length; i++) {
            var rule = this.rules[i];

            if (rule instanceof tree.Ruleset) {
                rule.flatten(result, selectors, env);
            } else if (rule instanceof tree.Rule) {
                rules.push(rule);
            } else if (rule instanceof tree.Invalid) {
                env.error(rule);
            }
        }

        var index = rules.length ? rules[0].index : false;
        for (var i = 0; i < selectors.length; i++) {
            // For specificity sort, use the position of the first rule to allow
            // defining attachments that are under current element as a descendant
            // selector.
            if (index !== false) {
                selectors[i].index = index;
            }
            result.push(new tree.Definition(selectors[i], rules.slice()));
        }

        return result;
    }
};
})(require('../tree'));
var assert = require('assert');

(function(tree) {

tree.Selector = function Selector(filters, zoom, frame_offset, elements, attachment, conditions, index) {
    this.elements = elements || [];
    this.attachment = attachment;
    this.filters = filters || {};
    this.frame_offset = frame_offset;
    this.zoom = typeof zoom !== 'undefined' ? zoom : tree.Zoom.all;
    this.conditions = conditions;
    this.index = index;
};

/**
 * Determine the specificity of this selector
 * based on the specificity of its elements - calling
 * Element.specificity() in order to do so
 *
 * [ID, Class, Filters, Position in document]
 */
tree.Selector.prototype.specificity = function() {
    return this.elements.reduce(function(memo, e) {
        var spec = e.specificity();
        memo[0] += spec[0];
        memo[1] += spec[1];
        return memo;
    }, [0, 0, this.conditions, this.index]);
};

})(require('../tree'));
(function(tree) {
var _ = require('underscore');

tree.Style = function Style(name, attachment, definitions) {
    this.attachment = attachment;
    this.definitions = definitions;
    this.name = name + (attachment !== '__default__' ? '-' + attachment : '');
};

tree.Style.prototype.toXML = function(env) {
    var existing = {};

    var image_filters = _.flatten(this.definitions.map(function(definition) {
        return definition.rules.filter(function(rule) {
            return (rule.name === 'image-filters');
        });
    }));

    var comp_op = _.flatten(this.definitions.map(function(definition) {
        return definition.rules.filter(function(rule) {
            return (rule.name === 'composite-operation');
        });
    }));

    var opacity = _.flatten(this.definitions.map(function(definition) {
        return definition.rules.filter(function(rule) {
            return (rule.name === 'opacity');
        });
    }));

    var rules = this.definitions.map(function(definition) {
        return definition.toXML(env, existing);
    });

    var attrs_xml = '';

    if (image_filters.length) {
        attrs_xml += ' image-filters="' + image_filters.map(function(f) {
            return f.eval(env).toXML(env, true, ' ', 'image-filter');
        }).join(' ') + '" ';
    }

    if (comp_op.length) {
        attrs_xml += ' comp-op="' + comp_op[0].value.eval(env).toString() + '" ';
    }

    if (opacity.length) {
        attrs_xml += ' opacity="' + opacity[0].value.eval(env).toString() + '" ';
    }

    return '<Style name="' + this.name + '" filter-mode="first" ' + attrs_xml + '>\n' + rules.join('') + '</Style>';
};

})(require('../tree'));
(function(tree) {

tree.URL = function URL(val, paths) {
    this.value = val;
    this.paths = paths;
    this.is = 'uri';
};
tree.URL.prototype = {
    toString: function() {
        return this.value.toString();
    },
    eval: function(ctx) {
        return new tree.URL(this.value.eval(ctx), this.paths);
    }
};

})(require('../tree'));
(function(tree) {

tree.Value = function Value(value) {
    this.value = value;
    this.is = 'value';
};
tree.Value.prototype = {
    eval: function(env) {
        if (this.value.length === 1) {
            return this.value[0].eval(env);
        } else {
            return new tree.Value(this.value.map(function(v) {
                return v.eval(env);
            }));
        }
    },
    toString: function(env, selector, sep, format) {
        return this.value.map(function(e) {
            return e.toString(env, format);
        }).join(sep || ', ');
    },
    clone: function() {
        var obj = Object.create(tree.Value.prototype);
        if (Array.isArray(obj)) obj.value = this.value.slice();
        else obj.value = this.value;
        obj.is = this.is;
        return obj;
    }
};

})(require('../tree'));
(function(tree) {

tree.Variable = function Variable(name, index, filename) {
    this.name = name;
    this.index = index;
    this.filename = filename;
};
tree.Variable.prototype = {
    eval: function(env) {
        var variable,
            v,
            that = this,
            name = this.name;

        if (this._css) return this._css;

        var thisframe = env.frames.filter(function(f) {
            return f.name == that.name;
        });
        if (thisframe.length) {
            return thisframe[0].value.eval(env);
        } else {
            env.error({
                message: 'variable ' + this.name + ' is undefined',
                index: this.index,
                type: 'runtime',
                filename: this.filename
            });
            return {
                is: 'undefined',
                value: 'undefined'
            };
        }
    }
};

})(require('../tree'));
var tree = require('../tree');

// Storage for zoom ranges. Only supports continuous ranges,
// and stores them as bit-sequences so that they can be combined,
// inverted, and compared quickly.
tree.Zoom = function(op, value, index) {
    value = parseInt(value, 10);
    if (value > tree.Zoom.maxZoom || value < 0) {
        throw {
            message: 'Only zoom levels between 0 and ' +
                tree.Zoom.maxZoom + ' supported.',
            index: index
        };
    }

    var start = 0,
        end = Infinity,
        zoom = 0;

    switch (op) {
        case '=':
            return 1 << value;
        case '>':
            start = value + 1;
            break;
        case '>=':
            start = value;
            break;
        case '<':
            end = value - 1;
            break;
        case '<=':
            end = value;
            break;
    }
    for (var i = 0; i <= tree.Zoom.maxZoom; i++) {
        if (i >= start && i <= end) {
            zoom |= (1 << i);
        }
    }
    return zoom;
};

// Covers all zoomlevels from 0 to 22
tree.Zoom.all = 0x7FFFFF;

tree.Zoom.maxZoom = 22;

tree.Zoom.ranges = {
     0: 1000000000,
     1: 500000000,
     2: 200000000,
     3: 100000000,
     4: 50000000,
     5: 25000000,
     6: 12500000,
     7: 6500000,
     8: 3000000,
     9: 1500000,
    10: 750000,
    11: 400000,
    12: 200000,
    13: 100000,
    14: 50000,
    15: 25000,
    16: 12500,
    17: 5000,
    18: 2500,
    19: 1500,
    20: 750,
    21: 500,
    22: 250,
    23: 100
};

// Only works for single range zooms. `[XXX....XXXXX.........]` is invalid.
tree.Zoom.toXML = function(zoom) {
    var conditions = [];
    if (zoom != tree.Zoom.all) {
        var start = null, end = null;
        for (var i = 0; i <= tree.Zoom.maxZoom; i++) {
            if (zoom & (1 << i)) {
                if (start === null) start = i;
                end = i;
            }
        }
        if (start > 0) conditions.push('    <MaxScaleDenominator>' +
            tree.Zoom.ranges[start] + '</MaxScaleDenominator>\n');
        if (end < 22) conditions.push('    <MinScaleDenominator>' +
            tree.Zoom.ranges[end + 1] + '</MinScaleDenominator>\n');
    }
    return conditions;
};


tree.Zoom.toString = function(zoom) {
    var str = '';
    for (var i = 0; i <= tree.Zoom.maxZoom; i++) {
        str += (zoom & (1 << i)) ? 'X' : '.';
    }
    return str;
};
(function (tree) {

tree.functions = {
    rgb: function (r, g, b) {
        return this.rgba(r, g, b, 1.0);
    },
    rgba: function (r, g, b, a) {
        var rgb = [r, g, b].map(function (c) { return number(c); });
        a = number(a);
        return new tree.Color(rgb, a);
    },
    hsl: function (h, s, l) {
        return this.hsla(h, s, l, 1.0);
    },
    hsla: function (h, s, l, a) {
        h = (number(h) % 360) / 360;
        s = number(s); l = number(l); a = number(a);

        var m2 = l <= 0.5 ? l * (s + 1) : l + s - l * s;
        var m1 = l * 2 - m2;

        return this.rgba(hue(h + 1/3) * 255,
                         hue(h)       * 255,
                         hue(h - 1/3) * 255,
                         a);

        function hue(h) {
            h = h < 0 ? h + 1 : (h > 1 ? h - 1 : h);
            if      (h * 6 < 1) return m1 + (m2 - m1) * h * 6;
            else if (h * 2 < 1) return m2;
            else if (h * 3 < 2) return m1 + (m2 - m1) * (2/3 - h) * 6;
            else                return m1;
        }
    },
    hue: function (color) {
        return new tree.Dimension(Math.round(color.toHSL().h));
    },
    saturation: function (color) {
        return new tree.Dimension(Math.round(color.toHSL().s * 100), '%');
    },
    lightness: function (color) {
        return new tree.Dimension(Math.round(color.toHSL().l * 100), '%');
    },
    alpha: function (color) {
        return new tree.Dimension(color.toHSL().a);
    },
    saturate: function (color, amount) {
        var hsl = color.toHSL();

        hsl.s += amount.value / 100;
        hsl.s = clamp(hsl.s);
        return hsla(hsl);
    },
    desaturate: function (color, amount) {
        var hsl = color.toHSL();

        hsl.s -= amount.value / 100;
        hsl.s = clamp(hsl.s);
        return hsla(hsl);
    },
    lighten: function (color, amount) {
        var hsl = color.toHSL();

        hsl.l += amount.value / 100;
        hsl.l = clamp(hsl.l);
        return hsla(hsl);
    },
    darken: function (color, amount) {
        var hsl = color.toHSL();

        hsl.l -= amount.value / 100;
        hsl.l = clamp(hsl.l);
        return hsla(hsl);
    },
    fadein: function (color, amount) {
        var hsl = color.toHSL();

        hsl.a += amount.value / 100;
        hsl.a = clamp(hsl.a);
        return hsla(hsl);
    },
    fadeout: function (color, amount) {
        var hsl = color.toHSL();

        hsl.a -= amount.value / 100;
        hsl.a = clamp(hsl.a);
        return hsla(hsl);
    },
    spin: function (color, amount) {
        var hsl = color.toHSL();
        var hue = (hsl.h + amount.value) % 360;

        hsl.h = hue < 0 ? 360 + hue : hue;

        return hsla(hsl);
    },
    replace: function (entity, a, b) {
        if (entity.is === 'field') {
            return entity.toString + '.replace(' + a.toString() + ', ' + b.toString() + ')';
        } else {
            return entity.replace(a, b);
        }
    },
    //
    // Copyright (c) 2006-2009 Hampton Catlin, Nathan Weizenbaum, and Chris Eppstein
    // http://sass-lang.com
    //
    mix: function (color1, color2, weight) {
        var p = weight.value / 100.0;
        var w = p * 2 - 1;
        var a = color1.toHSL().a - color2.toHSL().a;

        var w1 = (((w * a == -1) ? w : (w + a) / (1 + w * a)) + 1) / 2.0;
        var w2 = 1 - w1;

        var rgb = [color1.rgb[0] * w1 + color2.rgb[0] * w2,
                   color1.rgb[1] * w1 + color2.rgb[1] * w2,
                   color1.rgb[2] * w1 + color2.rgb[2] * w2];

        var alpha = color1.alpha * p + color2.alpha * (1 - p);

        return new tree.Color(rgb, alpha);
    },
    greyscale: function (color) {
        return this.desaturate(color, new tree.Dimension(100));
    },
    '%': function (quoted /* arg, arg, ...*/) {
        var args = Array.prototype.slice.call(arguments, 1),
            str = quoted.value;

        for (var i = 0; i < args.length; i++) {
            str = str.replace(/%s/,    args[i].value)
                     .replace(/%[da]/, args[i].toString());
        }
        str = str.replace(/%%/g, '%');
        return new tree.Quoted(str);
    }
};

var image_filter_functors = [
    'emboss', 'blur', 'gray', 'sobel', 'edge-detect',
    'x-gradient', 'y-gradient', 'sharpen'];

for (var i = 0; i < image_filter_functors.length; i++) {
    var f = image_filter_functors[i]; 
    tree.functions[f] = (function(f) {
        return function() {
            return new tree.ImageFilter(f);
        };
    })(f);
}

tree.functions['agg-stack-blur'] = function(x, y) {
    return new tree.ImageFilter('agg-stack-blur', [x, y]);
};

function hsla(hsla) {
    return tree.functions.hsla(hsla.h, hsla.s, hsla.l, hsla.a);
}

function number(n) {
    if (n instanceof tree.Dimension) {
        return parseFloat(n.unit == '%' ? n.value / 100 : n.value);
    } else if (typeof(n) === 'number') {
        return n;
    } else {
        throw new Error('Color functions take numbers as parameters.');
    }
}

function clamp(val) {
    return Math.min(1, Math.max(0, val));
}

})(require('./tree'));
(function(carto) {
var tree = require('./tree');
var _ = require('underscore');

// monkey patch less classes
tree.Value.prototype.toJS = function() {
  //var v = this.value[0].value[0];
  var val = this.eval()
  var v = val.toString();
  if(val.is === "color" || val.is === 'uri' || val.is === 'string' || val.is === 'keyword') {
    v = "'" + v + "'";
  } else if (val.is === 'field') {
    // replace [varuable] by ctx['variable']
    v = v.replace(/\[(.*)\]/g, "data['\$1']")
  }
  return "_value = " + v + ";";
};

Object.defineProperty(tree.Filterset.prototype, 'toJS', {
  enumerable: false,
  value: function(env) {
    var opMap = {
      '=': '==='
    };
    return _.map(this, function(filter) {
      var op = filter.op;
      if(op in opMap) {
        op = opMap[op];
      }
      var val = filter.val;
      if(filter._val !== undefined) {
        val = filter._val.toString(true);
      }

      var attrs = "data";
      return attrs + "." + filter.key  + " " + op + " " + val;
    }).join(' && ');
  }
});

tree.Definition.prototype.toJS = function() {
  var shaderAttrs = {};

  // merge conditions from filters with zoom condition of the
  // definition
  var zoom = "(" + this.zoom + " & (1 << ctx.zoom))";
  var frame_offset = this.frame_offset;
  var _if = this.filters.toJS();
  var filters = [zoom];
  if(_if) filters.push(_if);
  if(frame_offset) filters.push('ctx["frame-offset"] === ' + frame_offset);
  _if = filters.join(" && ");
  _.each(this.rules, function(rule) {
      if(rule instanceof tree.Rule) {
        shaderAttrs[rule.name] = shaderAttrs[rule.name] || [];
        if (_if) {
        shaderAttrs[rule.name].push(
          "if(" + _if + "){" + rule.value.toJS() + "}"
        );
        } else {
          shaderAttrs[rule.name].push(rule.value.toJS());
        }
      } else {
        if (rule instanceof tree.Ruleset) {
          var sh = rule.toJS();
          for(var v in sh) {
            shaderAttrs[v] = shaderAttrs[v] || [];
            for(var attr in sh[v]) {
              shaderAttrs[v].push(sh[v][attr]);
            }
          }
        }
      }
  });
  return shaderAttrs;
};


function CartoCSS(style, options) {
  this.options = options || {};
  if(style) {
    this.setStyle(style);
  }
}

CartoCSS.Layer = function(shader, options) {
  this.options = options;
  this.shader = shader;
};

CartoCSS.renderers = {};

CartoCSS.renderers['svg'] = {

  maps: {},

  transform: function(src) {
    var target = {};
    for(var i in src) {
      var t = this.maps[i];
      if(t) {
        target[t] = src[i];
      } else {
        // copy it
        target[i] = src[i];
      }
    }
    return target;
  }

};

CartoCSS.renderers['canvas-2d'] = {

  maps: {
    // marker
    'marker-width': 'point-radius',
    'marker-line-color': 'strokeStyle',
    'marker-line-width': 'lineWidth',
    'marker-line-opacity': 'strokeOpacity',
    'marker-fill-opacity': 'fillOpacity',
    'marker-opacity': 'fillOpacity',
    'marker-fill': 'fillStyle',
    'marker-file': function(attr) {
      var img = new Image();
      img.src = attr;
      return img;
    },
    // point
    'point-color': 'fillStyle',
    'point-file': function(attr) {
      var img = new Image();
      img.src = attr;
      return img;
    },
    // line
    'line-color': 'strokeStyle',
    'line-width': 'lineWidth',
    'line-opacity': 'globalAlpha',
    // polygon
    'polygon-fill': 'fillStyle',
    'polygon-opacity': 'globalAlpha',
    'comp-op': 'comp-op'
  },

  transform: function(src) {
    var target = {};
    for(var i in src) {
      var t = this.maps[i];
      if(t) {
        if(typeof(t) === 'function') {
          target[i] = t(src[i]);
        } else {
          target[t] = src[i];
        }
      } else {
        // copy it
        target[i] = src[i];
      }
    }
    return target;
  }
}

var renderer = CartoCSS.renderers['svg'];
var ref = require('mapnik-reference').version.latest;
var to_load = ['polygon', 'line', 'point', 'markers'];
for(var ss in to_load) {
  var s = to_load[ss];
  for(var i in ref.symbolizers[s]) {
    renderer.maps[ref.symbolizers[s][i].css] = i;
  }
}


CartoCSS.Layer.prototype = {

  fullName: function() {
    return this.shader.attachment;
  },

  name: function() {
    return this.fullName().split('::')[0];
  },

  // frames this layer need to be rendered
  frames: function() {
    return this.shader.frames;
  },

  attachment: function() {
    return this.fullName().split('::')[1];
  },

  eval: function(prop) {
    var p = this.shader[prop];
    if (!p) return;
    return p({}, { zoom: 0, 'frame-offset': 0 });
  },

  /*
   * `target`: style, 'svg', 'canvas-2d'...
   * `props`: feature properties
   * `context`: rendering properties, i.e zoom
   */
  getStyle: function(target, props, context) {
    var style = {};
    for(var i in this.shader) {
      if(i !== 'attachment' && i !== 'zoom' && i !== 'frames') {
        style[i] = this.shader[i](props, context);
      }
    }
    return CartoCSS.renderers[target].transform(style);
  },

  /**
   * returns true if a feature needs to be rendered
   */
  filter: function(featureType, props, context) {
    for(var i in this.shader) {
     var s = this.shader[i](props, context);
     if(s) {
       return true;
     }
    }
    return false;
  },

  //
  // given a geoemtry type returns the transformed one acording the CartoCSS
  // For points there are two kind of types: point and sprite, the first one 
  // is a circle, second one is an image sprite
  //
  // the other geometry types are the same than geojson (polygon, linestring...)
  //
  transformGeometry: function(type) {
    return type;
  },

  transformGeometries: function(geojson) {
    return geojson;
  }

};

CartoCSS.prototype = {

  setStyle: function(style) {
    var layers = this.parse(style);
    if(!layers) {
      throw new Error(this.parse_env.errors);
    }
    this.layers = layers.map(function(shader) {
        return new CartoCSS.Layer(shader);
    });
  },

  getLayers: function() {
    return this.layers;
  },

  getDefault: function() {
    return this.findLayer({ attachment: '__default__' });
  },

  findLayer: function(where) {
    return _.find(this.layers, function(value) {
      for (var key in where) {
        var v = value[key];
        if (typeof(v) === 'function') {
          v = v.call(value);
        }
        if (where[key] !== v) return false;
      }
      return true;
    });
  },

  _createFn: function(ops) {
    var body = ops.join('\n');
    if(this.options.debug) console.log(body);
    return Function("data","ctx", "var _value = null; " +  body + "; return _value; ");
  },

  _compile: function(shader) {
    if(typeof shader === 'string') {
        shader = eval("(function() { return " + shader +"; })()");
    }
    this.shader_src = shader;
    for(var attr in shader) {
        var c = mapper[attr];
        if(c) {
            this.compiled[c] = eval("(function() { return shader[attr]; })();");
        }
    }
  },

  parse: function(cartocss) {
    var parse_env = {
      frames: [],
      errors: [],
      error: function(obj) {
        this.errors.push(obj);
      }
    };
    this.parse_env = parse_env;

    var ruleset = null;
    try {
      ruleset = (new carto.Parser(parse_env)).parse(cartocss);
    } catch(e) {
      console.log(e.stack);
      // add the style.mss string to match the response from the server
      parse_env.errors.push(e.message);
      return;
    }
    if(ruleset) {
      var defs = ruleset.toList(parse_env);
      defs.reverse();
      // group by elements[0].value::attachment
      var layers = {};
      for(var i = 0; i < defs.length; ++i) {
        var def = defs[i];
        var key = def.elements[0] + "::" + def.attachment;
        var layer = layers[key] = (layers[key] || {});
        layer.frames = [];
        layer.zoom = tree.Zoom.all;
        var props = def.toJS();
        for(var v in props) {
          (layer[v] = (layer[v] || [])).push(props[v].join('\n'))
        }
      }

      var ordered_layers = [];

      var done = {};
      for(var i = 0; i < defs.length; ++i) {
        var def = defs[i];
        var k = def.elements[0] + "::" + def.attachment;
        var layer = layers[k];
        if(!done[k]) {
          for(var prop in layer) {
            if (prop !== 'zoom' && prop !== 'frames') {

              if(this.options.debug) console.log("****", prop);
              layer[prop] = this._createFn(layer[prop]);
            }
          }
          layer.attachment = k;
          ordered_layers.push(layer);
          done[k] = true;
        }
        layer.zoom |= def.zoom;
        layer.frames.push(def.frame_offset);
      }

      // uniq the frames
      for(i = 0; i < ordered_layers.length; ++i) {
        ordered_layers[i].frames = _.uniq(ordered_layers[i].frames);
      }

      return ordered_layers;

    }
    return null;
  }
};


carto.RendererJS = function (options) {
    this.options = options || {};
    this.options.mapnik_version = this.options.mapnik_version || 'latest';
};

// Prepare a javascript object which contains the layers
carto.RendererJS.prototype.render = function render(cartocss, callback) {
    tree.Reference.setVersion(this.options.mapnik_version);
    return new CartoCSS(cartocss, this.options);
}
if(typeof(module) !== 'undefined') {
  module.exports = carto.RendererJS;
}


})(require('../carto'));
(function(exports) {

  exports.torque = exports.torque || {};

  var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || function(c) { setTimeout(c, 16); }

  var cancelAnimationFrame = window.requestAnimationFrame || window.mozCancelAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || function(c) { };

  /**
   * options:
   *    animationDuration in seconds
   *    animationDelay in seconds
   */
  function Animator(callback, options) {
    if(!options.steps) {
      throw new Error("steps option missing")
    }
    this.options = options;
    this.running = false;
    this._tick = this._tick.bind(this);
    this._t0 = +new Date();
    this.callback = callback;
    this._time = 0.0;
    _.defaults(this.options, {
      animationDelay: 0,
      maxDelta: 0.2,
      loop: true
    });

    this.rescale();

  }


  Animator.prototype = {

    start: function() {
      this.running = true;
      requestAnimationFrame(this._tick);
    },

    isRunning: function() {
      return this.running;
    },

    stop: function() {
      this.pause();
      this.time(0);
    },

    // real animation time
    time: function(_) {
      if (!arguments.length) return this._time;
      this._time = _;
      var t = this.range(this.domain(this._time));
      this.callback(t);
    },

    toggle: function() {
      if (this.running) {
        this.pause()
      } else {
        this.start()
      }
    },

    rescale: function() {
      this.domainInv = torque.math.linear(this.options.animationDelay, this.options.animationDelay + this.options.animationDuration);
      this.domain = this.domainInv.invert();
      this.range = torque.math.linear(0, this.options.steps);
      this.rangeInv = this.range.invert();
      this.time(this._time);
      return this;
    },

    duration: function(_) {
      if (!arguments.length)  return this.options.animationDuration;
      this.options.animationDuration = _;
      if (this.time() > _) {
        this.time(0);
      }
      this.rescale();
      return this;
    },

    steps: function(_) {
      this.options.steps = _;
      return this.rescale();
    },

    step: function(s) {
      if(arguments.length === 0) return this.range(this.domain(this._time));
      this._time = this.domainInv(this.rangeInv(s));
    },

    pause: function() {
      this.running = false;
      cancelAnimationFrame(this._tick);
    },

    _tick: function() {
      var t1 = +new Date();
      var delta = (t1 - this._t0)*0.001;
      // if delta is really big means the tab lost the focus
      // at some point, so limit delta change
      delta = Math.min(this.options.maxDelta, delta);
      this._t0 = t1;
      this._time += delta;
      this.time(this._time);
      if(this.step() >= this.options.steps) {
        this._time = 0;
      }
      if(this.running) {
        requestAnimationFrame(this._tick);
      }
    }

  };

  exports.torque.Animator = Animator;



})(typeof exports === "undefined" ? this : exports);
(function(exports) {

exports.torque = exports.torque || {};

var _torque_reference_latest = {
    "version": "1.0.0",
    "style": {
        "comp-op": {
            "css": "comp-op",
            "default-value": "src-over",
            "default-meaning": "add the current layer on top of other layers",
            "doc": "Composite operation. This defines how this layer should behave relative to layers atop or below it.",
            "type": [
                "src", //
                "src-over", //
                "dst-over", //
                "src-in", //
                "dst-in", //
                "src-out", //
                "dst-out", //
                "src-atop", //
                "dst-atop", //
                "xor", //
                "darken", //
                "lighten" //
            ]
        }
    },
    "layer" : {
        "buffer-size": {
            "default-value": "0",
            "type":"float",
            "default-meaning": "No buffer will be used",
            "doc": "Extra tolerance around the Layer extent (in pixels) used to when querying and (potentially) clipping the layer data during rendering"
        },
        "-torque-frame-count": {
            "css": "-torque-frame-count",
            "default-value": "128",
            "type":"number",
            "default-meaning": "the data is broken into 128 time frames",
            "doc": "Number of animation steps/frames used in the animation. If the data contains a fewere number of total frames, the lesser value will be used."
        },
        "-torque-resolution": {
            "css": "-torque-resolution",
            "default-value": "2",
            "type":"number",
            "default-meaning": "",
            "doc": "Spatial resolution in pixels. A resolution of 1 means no spatial aggregation of the data. Any other resolution of N results in spatial aggregation into cells of NxN pixels. The value N must be power of 2"
        },
        "-torque-animation-duration": {
            "css": "-torque-animation-duration",
            "default-value": "30",
            "type":"number",
            "default-meaning": "the animation lasts 30 seconds",
            "doc": "Animation duration in seconds"
        },
        "-torque-aggregation-function": {
            "css": "-torque-aggregation-function",
            "default-value": "count(cartodb_id)",
            "type": "string",
            "default-meaning": "the value for each cell is the count of points in that cell",
            "doc": "A function used to calculate a value from the aggregate data for each cell. See -torque-resolution"
        },
        "-torque-time-attribute": {
            "css": "-torque-time-attribute",
            "default-value": "time",
            "type": "string",
            "default-meaning": "the data column in your table that is of a time based type",
            "doc": "The table column that contains the time information used create the animation"
        },
        "-torque-data-aggregation": {
            "css": "-torque-data-aggregation",
            "default-value": "linear",
            "type": [
              "cumulative"
            ],
            "default-meaning": "previous values are discarded",
            "doc": "A linear animation will discard previous values while a cumulative animation will accumulate them until it restarts"
        }
    },
    "symbolizers" : {
        "*": {
            "comp-op": {
                "css": "comp-op",
                "default-value": "src-over",
                "default-meaning": "add the current layer on top of other layers",
                "doc": "Composite operation. This defines how this layer should behave relative to layers atop or below it.",
                "type": [
                  "src", //
                  "src-over", //
                  "dst-over", //
                  "src-in", //
                  "dst-in", //
                  "src-out", //
                  "dst-out", //
                  "src-atop", //
                  "dst-atop", //
                  "xor", //
                  "darken", //
                  "lighten" //
                ]
            },
            "opacity": {
                "css": "opacity",
                "type": "float",
                "doc": "An alpha value for the style (which means an alpha applied to all features in separate buffer and then composited back to main buffer)",
                "default-value": 1,
                "default-meaning": "no separate buffer will be used and no alpha will be applied to the style after rendering"
            }
        },
        "trail": {
          "steps": {
            "css": "trail-steps",
            "type": "float",
            "default-value": 1,
            "default-meaning": "no trail steps",
            "doc": "How many steps of trails are going to be rendered"
          }
        },
        "polygon": {
            "fill": {
                "css": "polygon-fill",
                "type": "color",
                "default-value": "rgba(128,128,128,1)",
                "default-meaning": "gray and fully opaque (alpha = 1), same as rgb(128,128,128)",
                "doc": "Fill color to assign to a polygon"
            },
            "fill-opacity": {
                "css": "polygon-opacity",
                "type": "float",
                "doc": "The opacity of the polygon",
                "default-value": 1,
                "default-meaning": "opaque"
            }
        },
        "line": {
            "stroke": {
                "css": "line-color",
                "default-value": "rgba(0,0,0,1)",
                "type": "color",
                "default-meaning": "black and fully opaque (alpha = 1), same as rgb(0,0,0)",
                "doc": "The color of a drawn line"
            },
            "stroke-width": {
                "css": "line-width",
                "default-value": 1,
                "type": "float",
                "doc": "The width of a line in pixels"
            },
            "stroke-opacity": {
                "css": "line-opacity",
                "default-value": 1,
                "type": "float",
                "default-meaning": "opaque",
                "doc": "The opacity of a line"
            },
            "stroke-linejoin": {
                "css": "line-join",
                "default-value": "miter",
                "type": [
                    "miter",
                    "round",
                    "bevel"
                ],
                "doc": "The behavior of lines when joining"
            },
            "stroke-linecap": {
                "css": "line-cap",
                "default-value": "butt",
                "type": [
                    "butt",
                    "round",
                    "square"
                ],
                "doc": "The display of line endings"
            }
        },
        "markers": {
            "file": {
                "css": "marker-file",
                "doc": "An SVG file that this marker shows at each placement. If no file is given, the marker will show an ellipse.",
                "default-value": "",
                "default-meaning": "An ellipse or circle, if width equals height",
                "type": "uri"
            },
            "opacity": {
                "css": "marker-opacity",
                "doc": "The overall opacity of the marker, if set, overrides both the opacity of both the fill and stroke",
                "default-value": 1,
                "default-meaning": "The stroke-opacity and fill-opacity will be used",
                "type": "float"
            },
            "fill-opacity": {
                "css": "marker-fill-opacity",
                "doc": "The fill opacity of the marker",
                "default-value": 1,
                "default-meaning": "opaque",
                "type": "float"
            },
            "stroke": {
                "css": "marker-line-color",
                "doc": "The color of the stroke around a marker shape.",
                "default-value": "black",
                "type": "color"
            },
            "stroke-width": {
                "css": "marker-line-width",
                "doc": "The width of the stroke around a marker shape, in pixels. This is positioned on the boundary, so high values can cover the area itself.",
                "type": "float"
            },
            "stroke-opacity": {
                "css": "marker-line-opacity",
                "default-value": 1,
                "default-meaning": "opaque",
                "doc": "The opacity of a line",
                "type": "float"
            },
            "fill": {
                "css": "marker-fill",
                "default-value": "blue",
                "doc": "The color of the area of the marker.",
                "type": "color"
            },
            "marker-type": {
                "css": "marker-type",
                "type": [
                    "rectangle",
                    "ellipse"
                ],
                "default-value": "ellipse",
                "doc": "The default marker-type. If a SVG file is not given as the marker-file parameter, the renderer provides either an rectangle or an ellipse (a circle if height is equal to width)"
            }
        },
        "point": {
            "file": {
                "css": "point-file",
                "type": "uri",
                "required": false,
                "default-value": "none",
                "doc": "Image file to represent a point"
            },
            "opacity": {
                "css": "point-opacity",
                "type": "float",
                "default-value": 1.0,
                "default-meaning": "Fully opaque",
                "doc": "A value from 0 to 1 to control the opacity of the point"
            }
        }
    },
    "colors": {
        "aliceblue":  [240, 248, 255],
        "antiquewhite":  [250, 235, 215],
        "aqua":  [0, 255, 255],
        "aquamarine":  [127, 255, 212],
        "azure":  [240, 255, 255],
        "beige":  [245, 245, 220],
        "bisque":  [255, 228, 196],
        "black":  [0, 0, 0],
        "blanchedalmond":  [255,235,205],
        "blue":  [0, 0, 255],
        "blueviolet":  [138, 43, 226],
        "brown":  [165, 42, 42],
        "burlywood":  [222, 184, 135],
        "cadetblue":  [95, 158, 160],
        "chartreuse":  [127, 255, 0],
        "chocolate":  [210, 105, 30],
        "coral":  [255, 127, 80],
        "cornflowerblue":  [100, 149, 237],
        "cornsilk":  [255, 248, 220],
        "crimson":  [220, 20, 60],
        "cyan":  [0, 255, 255],
        "darkblue":  [0, 0, 139],
        "darkcyan":  [0, 139, 139],
        "darkgoldenrod":  [184, 134, 11],
        "darkgray":  [169, 169, 169],
        "darkgreen":  [0, 100, 0],
        "darkgrey":  [169, 169, 169],
        "darkkhaki":  [189, 183, 107],
        "darkmagenta":  [139, 0, 139],
        "darkolivegreen":  [85, 107, 47],
        "darkorange":  [255, 140, 0],
        "darkorchid":  [153, 50, 204],
        "darkred":  [139, 0, 0],
        "darksalmon":  [233, 150, 122],
        "darkseagreen":  [143, 188, 143],
        "darkslateblue":  [72, 61, 139],
        "darkslategrey":  [47, 79, 79],
        "darkturquoise":  [0, 206, 209],
        "darkviolet":  [148, 0, 211],
        "deeppink":  [255, 20, 147],
        "deepskyblue":  [0, 191, 255],
        "dimgray":  [105, 105, 105],
        "dimgrey":  [105, 105, 105],
        "dodgerblue":  [30, 144, 255],
        "firebrick":  [178, 34, 34],
        "floralwhite":  [255, 250, 240],
        "forestgreen":  [34, 139, 34],
        "fuchsia":  [255, 0, 255],
        "gainsboro":  [220, 220, 220],
        "ghostwhite":  [248, 248, 255],
        "gold":  [255, 215, 0],
        "goldenrod":  [218, 165, 32],
        "gray":  [128, 128, 128],
        "grey":  [128, 128, 128],
        "green":  [0, 128, 0],
        "greenyellow":  [173, 255, 47],
        "honeydew":  [240, 255, 240],
        "hotpink":  [255, 105, 180],
        "indianred":  [205, 92, 92],
        "indigo":  [75, 0, 130],
        "ivory":  [255, 255, 240],
        "khaki":  [240, 230, 140],
        "lavender":  [230, 230, 250],
        "lavenderblush":  [255, 240, 245],
        "lawngreen":  [124, 252, 0],
        "lemonchiffon":  [255, 250, 205],
        "lightblue":  [173, 216, 230],
        "lightcoral":  [240, 128, 128],
        "lightcyan":  [224, 255, 255],
        "lightgoldenrodyellow":  [250, 250, 210],
        "lightgray":  [211, 211, 211],
        "lightgreen":  [144, 238, 144],
        "lightgrey":  [211, 211, 211],
        "lightpink":  [255, 182, 193],
        "lightsalmon":  [255, 160, 122],
        "lightseagreen":  [32, 178, 170],
        "lightskyblue":  [135, 206, 250],
        "lightslategray":  [119, 136, 153],
        "lightslategrey":  [119, 136, 153],
        "lightsteelblue":  [176, 196, 222],
        "lightyellow":  [255, 255, 224],
        "lime":  [0, 255, 0],
        "limegreen":  [50, 205, 50],
        "linen":  [250, 240, 230],
        "magenta":  [255, 0, 255],
        "maroon":  [128, 0, 0],
        "mediumaquamarine":  [102, 205, 170],
        "mediumblue":  [0, 0, 205],
        "mediumorchid":  [186, 85, 211],
        "mediumpurple":  [147, 112, 219],
        "mediumseagreen":  [60, 179, 113],
        "mediumslateblue":  [123, 104, 238],
        "mediumspringgreen":  [0, 250, 154],
        "mediumturquoise":  [72, 209, 204],
        "mediumvioletred":  [199, 21, 133],
        "midnightblue":  [25, 25, 112],
        "mintcream":  [245, 255, 250],
        "mistyrose":  [255, 228, 225],
        "moccasin":  [255, 228, 181],
        "navajowhite":  [255, 222, 173],
        "navy":  [0, 0, 128],
        "oldlace":  [253, 245, 230],
        "olive":  [128, 128, 0],
        "olivedrab":  [107, 142, 35],
        "orange":  [255, 165, 0],
        "orangered":  [255, 69, 0],
        "orchid":  [218, 112, 214],
        "palegoldenrod":  [238, 232, 170],
        "palegreen":  [152, 251, 152],
        "paleturquoise":  [175, 238, 238],
        "palevioletred":  [219, 112, 147],
        "papayawhip":  [255, 239, 213],
        "peachpuff":  [255, 218, 185],
        "peru":  [205, 133, 63],
        "pink":  [255, 192, 203],
        "plum":  [221, 160, 221],
        "powderblue":  [176, 224, 230],
        "purple":  [128, 0, 128],
        "red":  [255, 0, 0],
        "rosybrown":  [188, 143, 143],
        "royalblue":  [65, 105, 225],
        "saddlebrown":  [139, 69, 19],
        "salmon":  [250, 128, 114],
        "sandybrown":  [244, 164, 96],
        "seagreen":  [46, 139, 87],
        "seashell":  [255, 245, 238],
        "sienna":  [160, 82, 45],
        "silver":  [192, 192, 192],
        "skyblue":  [135, 206, 235],
        "slateblue":  [106, 90, 205],
        "slategray":  [112, 128, 144],
        "slategrey":  [112, 128, 144],
        "snow":  [255, 250, 250],
        "springgreen":  [0, 255, 127],
        "steelblue":  [70, 130, 180],
        "tan":  [210, 180, 140],
        "teal":  [0, 128, 128],
        "thistle":  [216, 191, 216],
        "tomato":  [255, 99, 71],
        "turquoise":  [64, 224, 208],
        "violet":  [238, 130, 238],
        "wheat":  [245, 222, 179],
        "white":  [255, 255, 255],
        "whitesmoke":  [245, 245, 245],
        "yellow":  [255, 255, 0],
        "yellowgreen":  [154, 205, 50],
        "transparent":  [0, 0, 0, 0]
    }
};

exports.torque['torque-reference'] =  {
  version: {
    latest: _torque_reference_latest,
    '1.0.0': _torque_reference_latest
  }
}

})(typeof exports === "undefined" ? this : exports);
//
// common functionallity for torque layers
//

(function(exports) {

function TorqueLayer() {}

TorqueLayer.prototype = {
};

TorqueLayer.optionsFromLayer = function(mapConfig) {
  var opts = {};
  if (!mapConfig) return opts;
  var attrs = {
    'buffer-size': 'buffer-size',
    '-torque-frame-count': 'steps',
    '-torque-resolution': 'resolution',
    '-torque-animation-duration': 'animationDuration',
    '-torque-aggregation-function': 'countby',
    '-torque-time-attribute': 'column',
    '-torque-data-aggregation': 'data_aggregation'
  };
  for (var i in attrs) {
    var v = mapConfig.eval(i);
    if (v !== undefined) {
      var a = attrs[i];
      opts[a] = v;
    }
  }
  return opts;
};

TorqueLayer.optionsFromCartoCSS = function(cartocss) {
  var shader = new carto.RendererJS().render(cartocss);
  var mapConfig = shader.findLayer({ name: 'Map' });
  return TorqueLayer.optionsFromLayer(mapConfig);
};

exports.torque.common = torque.common || {};
exports.torque.common.TorqueLayer = TorqueLayer;

})(typeof exports === "undefined" ? this : exports);
(function(exports) {

  exports.torque = exports.torque || {};

  var Event = {};
  Event.on = function(evt, callback) {
      var cb = this._evt_callbacks = this._evt_callbacks || {};
      var l = cb[evt] || (cb[evt] = []);
      l.push(callback);
      return this;
  };

  Event.trigger = function(evt) {
      var c = this._evt_callbacks && this._evt_callbacks[evt];
      for(var i = 0; c && i < c.length; ++i) {
          c[i].apply(this, Array.prototype.slice.call(arguments, 1));
      }
      return this;
  };

  Event.fire = Event.trigger;

  Event.off = function (evt, callback) {
      var c = this._evt_callbacks && this._evt_callbacks[evt];
      if (c && !callback) {
        delete this._evt_callbacks[evt];
        return this;
     }
     var remove = [];
     for(var i = 0; c && i < c.length; ++i) {
       if(c[i] === callback) remove.push(i);
     }
     while((i = remove.pop()) !== undefined) c.splice(i, 1);
    return this;
  };

  Event.callbacks = function(evt) {
    return (this._evt_callbacks && this._evt_callbacks[evt]) || [];
  };

  exports.torque.Event = Event;


  // types
  exports.torque.types = {
    Uint8Array: typeof(window['Uint8Array']) !== 'undefined' ? window.Uint8Array : Array,
    Uint32Array: typeof(window['Uint32Array']) !== 'undefined' ? window.Uint32Array : Array,
    Int32Array: typeof(window['Int32Array']) !== 'undefined' ? window.Int32Array: Array
  };

  exports.torque.isBrowserSupported = function() {
    return !!document.createElement('canvas');
  };

})(typeof exports === "undefined" ? this : exports);

if (typeof module !== "undefined") {
  module.exports = {
    cartocss_reference: require('./cartocss_reference').torque['torque-reference']
  };
}
(function(exports) {

  exports.torque = exports.torque || {};

  function clamp(a, b) {
    return function(t) {
      return Math.max(Math.min(t, b), a);
    };
  }

  function invLinear(a, b) {
    var c = clamp(0, 1.0);
    return function(t) {
      return c((t - a)/(b - a));
    };
  }

  function linear(a, b) {
    var c = clamp(a, b);
    function _linear(t) {
      return c(a*(1.0 - t) + t*b);
    }

    _linear.invert = function() {
      return invLinear(a, b);
    };

    return _linear;
  }

  exports.torque.math = {
    clamp: clamp,
    linear: linear,
    invLinear: invLinear
  };

})(typeof exports === "undefined" ? this : exports);

/*
# metrics profiler

## timing

```
 var timer = Profiler.metric('resource:load')
 time.start();
 ...
 time.end();
```

## counters

```
 var counter = Profiler.metric('requests')
 counter.inc();   // 1
 counter.inc(10); // 11
 counter.dec()    // 10
 counter.dec(10)  // 0
```

## Calls per second
```
  var fps = Profiler.metric('fps')
  function render() {
    fps.mark();
  }
```
*/
(function(exports) {

var MAX_HISTORY = 1024;
function Profiler() {}
Profiler.metrics = {};

Profiler.get = function(name) {
  return Profiler.metrics[name] || {
    max: 0,
    min: Number.MAX_VALUE,
    avg: 0,
    total: 0,
    count: 0,
    history: typeof(Float32Array) !== 'undefined' ? new Float32Array(MAX_HISTORY) : []
  };
};

Profiler.new_value = function (name, value) {
  var t = Profiler.metrics[name] = Profiler.get(name);

  t.max = Math.max(t.max, value);
  t.min = Math.min(t.min, value);
  t.total += value;
  ++t.count;
  t.avg = t.total / t.count;
  t.history[t.count%MAX_HISTORY] = value;
};

Profiler.print_stats = function () {
  for (k in Profiler.metrics) {
    var t = Profiler.metrics[k];
    console.log(" === " + k + " === ");
    console.log(" max: " + t.max);
    console.log(" min: " + t.min);
    console.log(" avg: " + t.avg);
    console.log(" count: " + t.count);
    console.log(" total: " + t.total);
  }
};

function Metric(name) {
  this.t0 = null;
  this.name = name;
  this.count = 0;
}

Metric.prototype = {

  //
  // start a time measurement
  //
  start: function() {
    this.t0 = +new Date();
    return this;
  },

  // elapsed time since start was called
  _elapsed: function() {
    return +new Date() - this.t0;
  },

  //
  // finish a time measurement and register it
  // ``start`` should be called first, if not this 
  // function does not take effect
  //
  end: function() {
    if (this.t0 !== null) {
      Profiler.new_value(this.name, this._elapsed());
      this.t0 = null;
    }
  },

  //
  // increments the value 
  // qty: how many, default = 1
  //
  inc: function(qty) {
    qty = qty === undefined ? 1: qty;
    Profiler.new_value(this.name, Profiler.get(this.name).count + (qty ? qty: 0));
  },

  //
  // decrements the value 
  // qty: how many, default = 1
  //
  dec: function(qty) {
    qty = qty === undefined ? 1: qty;
    this.inc(-qty);
  },

  //
  // measures how many times per second this function is called
  //
  mark: function() {
    ++this.count;
    if(this.t0 === null) {
      this.start();
      return;
    }
    var elapsed = this._elapsed();
    if(elapsed > 1) {
      Profiler.new_value(this.name, this.count);
      this.count = 0;
      this.start();
    }
  }
};

Profiler.metric = function(name) {
  return new Metric(name);
};

exports.Profiler = Profiler;

})(typeof exports === "undefined" ? this : exports);
(function(exports) {

  var torque = exports.torque = exports.torque || {};
  var providers = exports.torque.providers = exports.torque.providers || {};

  var Uint8Array = torque.types.Uint8Array;
  var Int32Array = torque.types.Int32Array;
  var Uint32Array = torque.types.Uint32Array;

  // format('hello, {0}', 'rambo') -> "hello, rambo"
  function format(str) {
    for(var i = 1; i < arguments.length; ++i) {
      var attrs = arguments[i];
      for(var attr in attrs) {
        str = str.replace(RegExp('\\{' + attr + '\\}', 'g'), attrs[attr]);
      }
    }
    return str;
  }

  var json = function (options) {
    this._ready = false;
    this._tileQueue = [];
    this.options = options;

    this.options.is_time = this.options.is_time === undefined ? true: this.options.is_time;
    this.options.tiler_protocol = options.tiler_protocol || 'http';
    this.options.tiler_domain = options.tiler_domain || 'cartodb.com';
    this.options.tiler_port = options.tiler_port || 80;

    if (this.options.data_aggregation) {
      this.options.cumulative = this.options.data_aggregation === 'cumulative';
    }

    // check options
    if (options.resolution === undefined ) throw new Error("resolution should be provided");
    if (options.steps === undefined ) throw new Error("steps should be provided");
    if(options.start === undefined) {
      this._fetchKeySpan();
    } else {
      this._setReady(true);
    }
  };

  json.prototype = {

    /**
     * return the torque tile encoded in an efficient javascript
     * structure:
     * {
     *   x:Uint8Array x coordinates in tile reference system, normally from 0-255
     *   y:Uint8Array y coordinates in tile reference system
     *   Index: Array index to the properties
     * }
     */
    proccessTile: function(rows, coord, zoom) {
      var r;
      var x = new Uint8Array(rows.length);
      var y = new Uint8Array(rows.length);

      var prof_mem = Profiler.metric('ProviderJSON:mem');
      var prof_point_count = Profiler.metric('ProviderJSON:point_count');
      var prof_process_time = Profiler.metric('ProviderJSON:process_time').start()

      // count number of dates
      var dates = 0;
      var maxDateSlots = -1;
      for (r = 0; r < rows.length; ++r) {
        var row = rows[r];
        dates += row.dates__uint16.length;
        for(var d = 0; d < row.dates__uint16.length; ++d) {
          maxDateSlots = Math.max(maxDateSlots, row.dates__uint16[d]);
        }
      }

      if(this.options.cumulative) {
        dates = (1 + maxDateSlots) * rows.length;
      }

      var type = this.options.cumulative ? Uint32Array: Uint8Array;

      // reserve memory for all the dates
      var timeIndex = new Int32Array(maxDateSlots + 1); //index-size
      var timeCount = new Int32Array(maxDateSlots + 1);
      var renderData = new (this.options.valueDataType || type)(dates);
      var renderDataPos = new Uint32Array(dates);

      prof_mem.inc(
        4 * maxDateSlots + // timeIndex
        4 * maxDateSlots + // timeCount
        dates + //renderData
        dates * 4
      ); //renderDataPos

      prof_point_count.inc(rows.length);

      var rowsPerSlot = {};

      // precache pixel positions
      for (var r = 0; r < rows.length; ++r) {
        var row = rows[r];
        x[r] = row.x__uint8 * this.options.resolution;
        // fix value when it's in the tile EDGE
        // TODO: this should be fixed in SQL query
        if (row.y__uint8 === -1) {
          y[r] = 0;
        } else {
          y[r] = row.y__uint8 * this.options.resolution;
        }

        var dates = row.dates__uint16;
        var vals = row.vals__uint8;
        if (!this.options.cumulative) {
          for (var j = 0, len = dates.length; j < len; ++j) {
              var rr = rowsPerSlot[dates[j]] || (rowsPerSlot[dates[j]] = []);
              if(this.options.cumulative) {
                  vals[j] += prev_val;
              }
              prev_val = vals[j];
              rr.push([r, vals[j]]);
          }
        } else {
          var valByDate = {}
          for (var j = 0, len = dates.length; j < len; ++j) {
            valByDate[dates[j]] = vals[j];
          }
          var accum = 0;

          // extend the latest to the end
          for (var j = dates[0]; j <= maxDateSlots; ++j) {
              var rr = rowsPerSlot[j] || (rowsPerSlot[j] = []);
              var v = valByDate[j];
              if (v) {
                accum += v;
              }
              rr.push([r, accum]);
          }

          /*var lastDateSlot = dates[dates.length - 1];
          for (var j = lastDateSlot + 1; j <= maxDateSlots; ++j) {
            var rr = rowsPerSlot[j] || (rowsPerSlot[j] = []);
            rr.push([r, prev_val]);
          }
          */
        }

      }

      // for each timeslot search active buckets
      var renderDataIndex = 0;
      var timeSlotIndex = 0;
      var i = 0;
      for(var i = 0; i <= maxDateSlots; ++i) {
        var c = 0;
        var slotRows = rowsPerSlot[i]
        if(slotRows) {
          for (var r = 0; r < slotRows.length; ++r) {
            var rr = slotRows[r];
            ++c;
            renderDataPos[renderDataIndex] = rr[0]
            renderData[renderDataIndex] = rr[1];
            ++renderDataIndex;
          }
        }
        timeIndex[i] = timeSlotIndex;
        timeCount[i] = c;
        timeSlotIndex += c;
      }

      prof_process_time.end();

      return {
        x: x,
        y: y,
        z: zoom,
        coord: {
          x: coord.x,
          y: coord.y,
          z: zoom
        },
        timeCount: timeCount,
        timeIndex: timeIndex,
        renderDataPos: renderDataPos,
        renderData: renderData,
        maxDate: maxDateSlots
      };
    },

    _host: function() {
      var opts = this.options;
      var port = opts.sql_api_port;
      var domain = ((opts.user_name || opts.user) + '.' + (opts.sql_api_domain || 'cartodb.com')) + (port ? ':' + port: '');
      var protocol = opts.sql_api_protocol || 'http';
      return this.options.url || protocol + '://' + domain + '/api/v2/sql';
    },

    url: function(subhost) {
      var opts = this.options;
      var protocol = opts.sql_api_protocol || 'http';
      if (!this.options.cdn_url) {
        return this._host();
      }
      var h = protocol+ "://";
      if (subhost) {
        h += subhost + ".";
      }
      var cdn_host = opts.cdn_url;
      if(!cdn_host.http && !cdn_host.https) {
        throw new Error("cdn_host should contain http and/or https entries");
      }
      h += cdn_host[protocol] + "/" + (opts.user_name || opts.user) + '/api/v2/sql';
      return h;
    },

    _hash: function(str) {
      var hash = 0;
      if (!str || str.length == 0) return hash;
      for (var i = 0, l = str.length; i < l; ++i) {
          hash = (( (hash << 5 ) - hash ) + str.charCodeAt(i)) | 0;
      }
      return hash;
    },

    _extraParams: function() {
      if (this.options.extra_params) {
        var p = [];
        for(var k in this.options.extra_params) {
          var v = this.options.extra_params[k];
          if (v) {
            p.push(k + "=" + encodeURIComponent(v));
          }
        }
        return p.join('&');
      }
      return null;
    },

    isHttps: function() {
      return this.options.sql_api_protocol && this.options.sql_api_protocol === 'https';
    },

    // execute actual query
    sql: function(sql, callback, options) {
      options = options || {};
      var subdomains = this.options.subdomains || '0123';
      if(this.isHttps()) {
        subdomains = [null]; // no subdomain
      }


      var url;
      if (options.no_cdn) {
        url = this._host();
      } else {
        url = this.url(subdomains[Math.abs(this._hash(sql))%subdomains.length]);
      }
      var extra = this._extraParams();
      torque.net.get( url + "?q=" + encodeURIComponent(sql) + (extra ? "&" + extra: ''), function (data) {
          if(options.parseJSON) {
            data = JSON.parse(data && data.responseText);
          }
          callback && callback(data);
      });
    },

    getTileData: function(coord, zoom, callback) {
      if(!this._ready) {
        this._tileQueue.push([coord, zoom, callback]);
      } else {
        this._getTileData(coord, zoom, callback);
      }
    },

    _setReady: function(ready) {
      this._ready = true;
      this._processQueue();
      this.options.ready && this.options.ready();
    },

    _processQueue: function() {
      var item;
      while (item = this._tileQueue.pop()) {
        this._getTileData.apply(this, item);
      }
    },

    /**
     * `coord` object like {x : tilex, y: tiley }
     * `zoom` quadtree zoom level
     */
    _getTileData: function(coord, zoom, callback) {
      var prof_fetch_time = Profiler.metric('ProviderJSON:tile_fetch_time').start()
      this.table = this.options.table;
      var numTiles = 1 << zoom;

      var column_conv = this.options.column;

      if(this.options.is_time) {
        column_conv = format("date_part('epoch', {column})", this.options);
      }

      var sql = "" +
        "WITH " +
        "par AS (" +
        "  SELECT CDB_XYZ_Resolution({zoom})*{resolution} as res" +
        ",  256/{resolution} as tile_size" +
        ", CDB_XYZ_Extent({x}, {y}, {zoom}) as ext "  +
        ")," +
        "cte AS ( "+
        "  SELECT ST_SnapToGrid(i.the_geom_webmercator, p.res) g" +
        ", {countby} c" +
        ", floor(({column_conv} - {start})/{step}) d" +
        "  FROM ({_sql}) i, par p " +
        "  WHERE i.the_geom_webmercator && p.ext " +
        "  GROUP BY g, d" +
        ") " +
        "" +
        "SELECT (st_x(g)-st_xmin(p.ext))/p.res x__uint8, " +
        "       (st_y(g)-st_ymin(p.ext))/p.res y__uint8," +
        " array_agg(c) vals__uint8," +
        " array_agg(d) dates__uint16" +
        // the tile_size where are needed because the overlaps query in cte subquery includes the points
        // in the left and bottom borders of the tile
        " FROM cte, par p where (st_y(g)-st_ymin(p.ext))/p.res < tile_size and (st_x(g)-st_xmin(p.ext))/p.res < tile_size GROUP BY x__uint8, y__uint8";


      var query = format(sql, this.options, {
        zoom: zoom,
        x: coord.x,
        y: coord.y,
        column_conv: column_conv,
        _sql: this.getSQL()
      });

      var self = this;
      this.sql(query, function (data) {
        if (data) {
          var rows = JSON.parse(data.responseText).rows;
          callback(self.proccessTile(rows, coord, zoom));
        } else {
          callback(null);
        }
        prof_fetch_time.end();
      });
    },

    getKeySpan: function() {
      return {
        start: this.options.start * 1000,
        end: this.options.end * 1000,
        step: this.options.step,
        steps: this.options.steps,
        columnType: this.options.is_time ? 'date': 'number'
      };
    },

    setColumn: function(column, isTime) {
      this.options.column = column;
      this.options.is_time = isTime === undefined ? true: false;
      this.reload();
    },

    setResolution: function(res) {
      this.options.resolution = res;
    },

    // return true if tiles has been changed
    setOptions: function(opt) {
      var refresh = false;

      if(opt.resolution !== undefined && opt.resolution !== this.options.resolution) {
        this.options.resolution = opt.resolution;
        refresh = true;
      }

      if(opt.steps !== undefined && opt.steps !== this.options.steps) {
        this.setSteps(opt.steps, { silent: true });
        refresh = true;
      }

      if(opt.column !== undefined && opt.column !== this.options.column) {
        this.options.column = opt.column;
        refresh = true;
      }

      if(opt.countby !== undefined && opt.countby !== this.options.countby) {
        this.options.countby = opt.countby;
        refresh = true;
      }

      if(opt.data_aggregation !== undefined) {
        var c = opt.data_aggregation === 'cumulative';
        if (this.options.cumulative !== c) {
          this.options.cumulative = c;
          refresh = true;
        }
      }

      if (refresh) this.reload();
      return refresh;

    },

    reload: function() {
      this._ready = false;
      this._fetchKeySpan();
    },

    setSQL: function(sql) {
      if (this.options.sql != sql) {
        this.options.sql = sql;
        this.reload();
      }
    },

    getSteps: function() {
      return Math.min(this.options.steps, this.options.data_steps);
    },

    setSteps: function(steps, opt) {
      opt = opt || {};
      if (this.options.steps !== steps) {
        this.options.steps = steps;
        this.options.step = (this.options.end - this.options.start)/this.getSteps();
        this.options.step = this.options.step || 1;
        if (!opt.silent) this.reload();
      }
    },

    getBounds: function() {
      return this.options.bounds;
    },

    getSQL: function() {
      return this.options.sql || "select * from " + this.options.table;
    },

    _tilerHost: function() {
      var opts = this.options;
      var user = (opts.user_name || opts.user);
      return opts.tiler_protocol +
           "://" + (user ? user + "." : "")  +
           opts.tiler_domain +
           ((opts.tiler_port != "") ? (":" + opts.tiler_port) : "");
    },

    _fetchUpdateAt: function(callback) {
      var self = this;
      var layergroup = {
        "version": "1.0.1",
        "stat_tag": this.options.stat_tag || 'torque',
        "layers": [{
          "type": "cartodb",
          "options": {
            "cartocss_version": "2.1.1", 
            "cartocss": "#layer {}",
            "sql": this.getSQL()
          }
        }]
      };
      var url = this._tilerHost() + "/tiles/layergroup";
      var extra = this._extraParams();

      // tiler needs map_key instead of api_key
      // so replace it
      if (extra) {
        extra = extra.replace('api_key=', 'map_key=');
      }

      url = url +
        "?config=" + encodeURIComponent(JSON.stringify(layergroup)) +
        "&callback=?" + (extra ? "&" + extra: '');

      torque.net.jsonp(url, function (data) {
        var query = format("select * from ({sql}) __torque_wrap_sql limit 0", { sql: self.getSQL() });
        self.sql(query, function (queryData) {
          if (data) {
            callback({
              updated_at: data.last_updated,
              fields: queryData.fields
            });
          }
        }, { parseJSON: true });
      });
    },

    //
    // the data range could be set by the user though ``start``
    // option. It can be fecthed from the table when the start
    // is not specified.
    //
    _fetchKeySpan: function() {
      var self = this;
      var max_col, min_col, max_tmpl, min_tmpl;

      this._fetchUpdateAt(function(data) {
        if (!data) return;
        self.options.extra_params = self.options.extra_params || {};
        self.options.extra_params.last_updated = data.updated_at || 0;
        self.options.extra_params.cache_policy = 'persist';
        self.options.is_time = data.fields[self.options.column].type === 'date';

        var column_conv = self.options.column;
        if (self.options.is_time){
          max_tmpl = "date_part('epoch', max({column}))";
          min_tmpl = "date_part('epoch', min({column}))";
          column_conv = format("date_part('epoch', {column})", self.options);
        } else {
          max_tmpl = "max({column})";
          min_tmpl = "min({column})";
        }

        max_col = format(max_tmpl, { column: self.options.column });
        min_col = format(min_tmpl, { column: self.options.column });

        /*var sql_stats = "" +
        "WITH summary_groups as ( " +
          "WITH summary as ( " +
           "select   (row_number() over (order by __time_col asc nulls last)+1)/2 as rownum, __time_col " +
            "from (select *, {column} as __time_col from ({sql}) __s) __torque_wrap_sql " +
            "order by __time_col asc " +
          ") " +
          "SELECT " +
          "max(__time_col) OVER(PARTITION BY rownum) -  " +
          "min(__time_col) OVER(PARTITION BY rownum) diff " +
          "FROM summary " +
        "), subq as ( " +
        " SELECT " +
            "st_xmax(st_envelope(st_collect(the_geom))) xmax, " +
            "st_ymax(st_envelope(st_collect(the_geom))) ymax, " +
            "st_xmin(st_envelope(st_collect(the_geom))) xmin, " +
            "st_ymin(st_envelope(st_collect(the_geom))) ymin, " +
            "{max_col} max, " +
            "{min_col} min FROM  ({sql}) __torque_wrap_sql " +
        ")" +
        "SELECT " +
        "xmax, xmin, ymax, ymin, a.max as max_date, a.min as min_date, " +
        "avg(diff) as diffavg," +
        "(a.max - a.min)/avg(diff) as num_steps " +
        "FROM summary_groups, subq a  " +
        "WHERE diff > 0 group by xmax, xmin, ymax, ymin, max_date, min_date";
        */
        var sql_stats = " SELECT " +
            "st_xmax(st_envelope(st_collect(the_geom))) xmax, " +
            "st_ymax(st_envelope(st_collect(the_geom))) ymax, " +
            "st_xmin(st_envelope(st_collect(the_geom))) xmin, " +
            "st_ymin(st_envelope(st_collect(the_geom))) ymin, " +
            "count(*) as num_steps, " +
            "{max_col} max_date, " +
            "{min_col} min_date FROM  ({sql}) __torque_wrap_sql ";

        var sql = format(sql_stats, {
          max_col: max_col,
          min_col: min_col,
          column: column_conv,
          sql: self.getSQL()
        });

        self.sql(sql, function(data) {
          //TODO: manage bounds
          data = data.rows[0];
          self.options.start = data.min_date;
          self.options.end = data.max_date;
          self.options.step = (data.max_date - data.min_date)/Math.min(self.options.steps, data.num_steps>>0);
          self.options.data_steps = data.num_steps >> 0;
          // step can't be 0
          self.options.step = self.options.step || 1;
          self.options.bounds = [
            [data.ymin, data.xmin],
            [data.ymax, data.xmax]
          ];
          self._setReady(true);
        }, { parseJSON: true, no_cdn: true });
      }, { parseJSON: true, no_cdn: true})
    }

  };

  torque.providers.json = json;


})(typeof exports === "undefined" ? this : exports);
(function(exports) {


  var torque = exports.torque = exports.torque || {};
  var providers = exports.torque.providers = exports.torque.providers || {};

  var Uint8Array = torque.types.Uint8Array;
  var Int32Array = torque.types.Int32Array;
  var Uint32Array = torque.types.Uint32Array;

  // format('hello, {0}', 'rambo') -> "hello, rambo"
  function format(str, attrs) {
    for(var i = 1; i < arguments.length; ++i) {
      var attrs = arguments[i];
      for(var attr in attrs) {
        str = str.replace(RegExp('\\{' + attr + '\\}', 'g'), attrs[attr]);
      }
    }
    return str;
  }

  var json = function (options) {
    // check options
    this.options = options;
  };


  json.prototype = {

    //
    // return the data aggregated by key:
    // {
    //  key0: 12,
    //  key1: 32
    //  key2: 25
    // }
    //
    aggregateByKey: function(rows) {
      function getKeys(row) {
        var HEADER_SIZE = 3;
        var valuesCount = row.data[2];
        var keys = {};
        for (var s = 0; s < valuesCount; ++s) {
          keys[row.data[HEADER_SIZE + s]] = row.data[HEADER_SIZE + valuesCount + s];
        }
        return keys;
      }
      var keys = {};
      for (r = 0; r < rows.length; ++r) {
        var rowKeys = getKeys(rows[r]);
        for(var k in rowKeys) {
          keys[k] = keys[k] || 0;
          keys[k] += rowKeys[k];
        }
      }
      return keys;
    },
    



    /**
     *
     */
    proccessTile: function(rows, coord, zoom) {
      var r;
      var x = new Uint8Array(rows.length);
      var y = new Uint8Array(rows.length);
      var self = this;

      // decode into a javascript strcuture the array
      function decode_row(row) {
        var HEADER_SIZE = 3;
        var o = {
          x: row.data[0] * self.options.resolution,
          y: row.data[1] * self.options.resolution,
          valuesCount: row.data[2],
          times: [],
          values: []
        };
        for (var s = 0; s < o.valuesCount; ++s) {
           o.times.push(row.data[HEADER_SIZE + s]);
           o.values.push(row.data[HEADER_SIZE + o.valuesCount + s]);
        }
        if(self.options.cumulative) {
          for (var s = 1; s < o.valuesCount; ++s) {
           o.values[s] += o.values[s - 1];
          }
        }
        return o
      }

      // decode all the rows
      for (r = 0; r < rows.length; ++r) {
        rows[r] = decode_row(rows[r]);
      }

      // count number of dates
      var dates = 0;
      var maxDateSlots = 0;
      for (r = 0; r < rows.length; ++r) {
        var row = rows[r];
        dates += row.times.length;
        for(var d = 0; d < row.times.length; ++d) {
          maxDateSlots = Math.max(maxDateSlots, row.times[d]);
        }
      }

      // reserve memory for all the dates
      var timeIndex = new Int32Array(maxDateSlots + 1); //index-size
      var timeCount = new Int32Array(maxDateSlots + 1);
      var renderData = new (this.options.valueDataType || Uint8Array)(dates);
      var renderDataPos = new Uint32Array(dates);

      var rowsPerSlot = {};

      // precache pixel positions
      for (var r = 0; r < rows.length; ++r) {
        var row = rows[r];
        x[r] = row.x;
        y[r] = row.y;

        var dates = row.times;
        var vals = row.values;
        for (var j = 0, len = dates.length; j < len; ++j) {
            var rr = rowsPerSlot[dates[j]] || (rowsPerSlot[dates[j]] = []);
            rr.push([r, vals[j]]);
        }
      }

      // for each timeslot search active buckets
      var renderDataIndex = 0;
      var timeSlotIndex = 0;
      var i = 0;
      for(var i = 0; i <= maxDateSlots; ++i) {
        var c = 0;
        var slotRows = rowsPerSlot[i]
        if(slotRows) {
          for (var r = 0; r < slotRows.length; ++r) {
            var rr = slotRows[r];
            ++c;
            renderDataPos[renderDataIndex] = rr[0]
            renderData[renderDataIndex] = rr[1];
            ++renderDataIndex;
          }
        }
        timeIndex[i] = timeSlotIndex;
        timeCount[i] = c;
        timeSlotIndex += c;
      }

      return {
        x: x,
        y: y,
        coord: {
          x: coord.x,
          y: coord.y,
          z: zoom
        },
        timeCount: timeCount,
        timeIndex: timeIndex,
        renderDataPos: renderDataPos,
        renderData: renderData
      };
    },

    url: function() {
      return this.options.url;
    },


    tileUrl: function(coord, zoom) {
      var template = this.url();
      var s = (this.options.subdomains || 'abcd')[(coord.x + coord.y + zoom) % 4];
      return template
        .replace('{x}', coord.x)
        .replace('{y}', coord.y)
        .replace('{z}', zoom)
        .replace('{s}', s);
    },

    getTile: function(coord, zoom, callback) {
      var template = this.tileUrl(coord, zoom);

      var self = this;
      var fetchTime = Profiler.metric('jsonarray:fetch time');
      fetchTime.start();
      torque.net.get(template, function (data) {
        fetchTime.end();
        if(data) {
          data = JSON.parse(data.responseText);
        }
        callback(data);
      });
    },

    /**
     * `coord` object like {x : tilex, y: tiley } 
     * `zoom` quadtree zoom level
     */
    getTileData: function(coord, zoom, callback) {
      var template = this.tileUrl(coord, zoom);

      var self = this;
      var fetchTime = Profiler.metric('jsonarray:fetch time');
      fetchTime.start();
      torque.net.get(template, function (data) {
        fetchTime.end();
        var processed = null;
        
        var processingTime = Profiler.metric('jsonarray:processing time');
        var parsingTime = Profiler.metric('jsonarray:parsing time');
        try {
          processingTime.start();
          parsingTime.start();
          var rows = JSON.parse(data.responseText || data.response).rows;
          parsingTime.end();
          processed = self.proccessTile(rows, coord, zoom);
          processingTime.end();
        } catch(e) {
          console.error("problem parsing JSON on ", coord, zoom);
        }

        callback(processed);

      });
    }

  };

  torque.providers.JsonArray = json


})(typeof exports === "undefined" ? this : exports);
(function(exports) {

  var torque = exports.torque = exports.torque || {};
  var providers = exports.torque.providers = exports.torque.providers || {};

  var Uint8Array = torque.types.Uint8Array;
  var Int32Array = torque.types.Int32Array;
  var Uint32Array = torque.types.Uint32Array;

  // format('hello, {0}', 'rambo') -> "hello, rambo"
  function format(str) {
    for(var i = 1; i < arguments.length; ++i) {
      var attrs = arguments[i];
      for(var attr in attrs) {
        str = str.replace(RegExp('\\{' + attr + '\\}', 'g'), attrs[attr]);
      }
    }
    return str;
  }

  var json = function (options) {
    this._ready = false;
    this._tileQueue = [];
    this.options = options;

    this.options.is_time = this.options.is_time === undefined ? true: this.options.is_time;
    this.options.tiler_protocol = options.tiler_protocol || 'http';
    this.options.tiler_domain = options.tiler_domain || 'cartodb.com';
    this.options.tiler_port = options.tiler_port || 80;

    if (this.options.data_aggregation) {
      this.options.cumulative = this.options.data_aggregation === 'cumulative';
    }
    if (this.options.auth_token) {
      var e = this.options.extra_params || (this.options.extra_params = {});
      e.auth_token = this.options.auth_token;
    }

    this._fetchMap();
  };

  json.prototype = {

    /**
     * return the torque tile encoded in an efficient javascript
     * structure:
     * {
     *   x:Uint8Array x coordinates in tile reference system, normally from 0-255
     *   y:Uint8Array y coordinates in tile reference system
     *   Index: Array index to the properties
     * }
     */
    proccessTile: function(rows, coord, zoom) {
      var r;
      var x = new Uint8Array(rows.length);
      var y = new Uint8Array(rows.length);

      var prof_mem = Profiler.metric('torque.provider.windshaft.mem');
      var prof_point_count = Profiler.metric('torque.provider.windshaft.points');
      var prof_process_time = Profiler.metric('torque.provider.windshaft.process_time').start();

      // count number of dates
      var dates = 0;
      var maxDateSlots = -1;
      for (r = 0; r < rows.length; ++r) {
        var row = rows[r];
        dates += row.dates__uint16.length;
        for(var d = 0; d < row.dates__uint16.length; ++d) {
          maxDateSlots = Math.max(maxDateSlots, row.dates__uint16[d]);
        }
      }

      if(this.options.cumulative) {
        dates = (1 + maxDateSlots) * rows.length;
      }

      var type = this.options.cumulative ? Uint32Array: Uint8Array;

      // reserve memory for all the dates
      var timeIndex = new Int32Array(maxDateSlots + 1); //index-size
      var timeCount = new Int32Array(maxDateSlots + 1);
      var renderData = new (this.options.valueDataType || type)(dates);
      var renderDataPos = new Uint32Array(dates);

      prof_mem.inc(
        4 * maxDateSlots + // timeIndex
        4 * maxDateSlots + // timeCount
        dates + //renderData
        dates * 4
      ); //renderDataPos

      prof_point_count.inc(rows.length);

      var rowsPerSlot = {};

      // precache pixel positions
      for (var r = 0; r < rows.length; ++r) {
        var row = rows[r];
        x[r] = row.x__uint8 * this.options.resolution;
        // fix value when it's in the tile EDGE
        // TODO: this should be fixed in SQL query
        if (row.y__uint8 === -1) {
          y[r] = 0;
        } else {
          y[r] = row.y__uint8 * this.options.resolution;
        }

        var dates = row.dates__uint16;
        var vals = row.vals__uint8;
        if (!this.options.cumulative) {
          for (var j = 0, len = dates.length; j < len; ++j) {
              var rr = rowsPerSlot[dates[j]] || (rowsPerSlot[dates[j]] = []);
              if(this.options.cumulative) {
                  vals[j] += prev_val;
              }
              prev_val = vals[j];
              rr.push([r, vals[j]]);
          }
        } else {
          var valByDate = {}
          for (var j = 0, len = dates.length; j < len; ++j) {
            valByDate[dates[j]] = vals[j];
          }
          var accum = 0;

          // extend the latest to the end
          for (var j = dates[0]; j <= maxDateSlots; ++j) {
              var rr = rowsPerSlot[j] || (rowsPerSlot[j] = []);
              var v = valByDate[j];
              if (v) {
                accum += v;
              }
              rr.push([r, accum]);
          }

          /*var lastDateSlot = dates[dates.length - 1];
          for (var j = lastDateSlot + 1; j <= maxDateSlots; ++j) {
            var rr = rowsPerSlot[j] || (rowsPerSlot[j] = []);
            rr.push([r, prev_val]);
          }
          */
        }

      }

      // for each timeslot search active buckets
      var renderDataIndex = 0;
      var timeSlotIndex = 0;
      var i = 0;
      for(var i = 0; i <= maxDateSlots; ++i) {
        var c = 0;
        var slotRows = rowsPerSlot[i]
        if(slotRows) {
          for (var r = 0; r < slotRows.length; ++r) {
            var rr = slotRows[r];
            ++c;
            renderDataPos[renderDataIndex] = rr[0]
            renderData[renderDataIndex] = rr[1];
            ++renderDataIndex;
          }
        }
        timeIndex[i] = timeSlotIndex;
        timeCount[i] = c;
        timeSlotIndex += c;
      }

      prof_process_time.end();

      return {
        x: x,
        y: y,
        z: zoom,
        coord: {
          x: coord.x,
          y: coord.y,
          z: zoom
        },
        timeCount: timeCount,
        timeIndex: timeIndex,
        renderDataPos: renderDataPos,
        renderData: renderData,
        maxDate: maxDateSlots
      };
    },

    /*setCartoCSS: function(c) {
      this.options.cartocss = c;
    },*/

    setSteps: function(steps, opt) { 
      opt = opt || {};
      if (this.options.steps !== steps) {
        this.options.steps = steps;
        this.options.step = (this.options.end - this.options.start)/this.getSteps();
        this.options.step = this.options.step || 1;
        if (!opt.silent) this.reload();
      }
    },

    setOptions: function(opt) {
      var refresh = false;

      if(opt.resolution !== undefined && opt.resolution !== this.options.resolution) {
        this.options.resolution = opt.resolution;
        refresh = true;
      }

      if(opt.steps !== undefined && opt.steps !== this.options.steps) {
        this.setSteps(opt.steps, { silent: true });
        refresh = true;
      }

      if(opt.column !== undefined && opt.column !== this.options.column) {
        this.options.column = opt.column;
        refresh = true;
      }

      if(opt.countby !== undefined && opt.countby !== this.options.countby) {
        this.options.countby = opt.countby;
        refresh = true;
      }

      if(opt.data_aggregation !== undefined) {
        var c = opt.data_aggregation === 'cumulative';
        if (this.options.cumulative !== c) {
          this.options.cumulative = c;
          refresh = true;
        }
      }

      if (refresh) this.reload();
      return refresh;
    },

    _extraParams: function() {
      if (this.options.extra_params) {
        var p = [];
        for(var k in this.options.extra_params) {
          var v = this.options.extra_params[k];
          if (v) {
            p.push(k + "=" + encodeURIComponent(v));
          }
        }
        return p.join('&');
      }
      return null;
    },

    getTileData: function(coord, zoom, callback) {
      if(!this._ready) {
        this._tileQueue.push([coord, zoom, callback]);
      } else {
        this._getTileData(coord, zoom, callback);
      }
    },

    _setReady: function(ready) {
      this._ready = true;
      this._processQueue();
      this.options.ready && this.options.ready();
    },

    _processQueue: function() {
      var item;
      while (item = this._tileQueue.pop()) {
        this._getTileData.apply(this, item);
      }
    },

    /**
     * `coord` object like {x : tilex, y: tiley }
     * `zoom` quadtree zoom level
     */
    _getTileData: function(coord, zoom, callback) {
      var self = this;
      var prof_fetch_time = Profiler.metric('torque.provider.windshaft.tile.fetch').start();
      var subdomains = this.options.subdomains || '0123';
      var index = Math.abs(coord.x + coord.y) % subdomains.length;
      var url = this.templateUrl
                .replace('{x}', coord.x)
                .replace('{y}', coord.y)
                .replace('{z}', zoom)
                .replace('{s}', subdomains[index])

      var extra = this._extraParams();
      torque.net.get( url + (extra ? "?" + extra: ''), function (data) {
        prof_fetch_time.end();
        if (data && data.responseText) {
          var rows = JSON.parse(data.responseText);
          callback(self.proccessTile(rows, coord, zoom));
        } else {
          Profiler.metric('torque.provider.windshaft.tile.error').inc();
          callback(null);
        }
      });
    },

    getKeySpan: function() {
      return {
        start: this.options.start,
        end: this.options.end,
        step: this.options.step,
        steps: this.options.steps,
        columnType: this.options.column_type
      };
    },

    setColumn: function(column, isTime) {
      this.options.column = column;
      this.options.is_time = isTime === undefined ? true: false;
      this.reload();
    },

    reload: function() {
      this._ready = false;
      this._fetchMap();
    },

    getSteps: function() {
      return Math.min(this.options.steps, this.options.data_steps);
    },

    getBounds: function() {
      return this.options.bounds;
    },

    getSQL: function() {
      return this.options.sql || "select * from " + this.options.table;
    },

    setSQL: function(sql) {
      if (this.options.sql != sql) {
        this.options.sql = sql;
        this.reload();
      }
    },

    _tilerHost: function() {
      var opts = this.options;
      var user = (opts.user_name || opts.user);
      return opts.tiler_protocol +
           "://" + (user ? user + "." : "")  +
           opts.tiler_domain +
           ((opts.tiler_port != "") ? (":" + opts.tiler_port) : "");
    },

    url: function() {
      var opts = this.options;
      var protocol = opts.tiler_protocol || 'http';
      if (!this.options.cdn_url) {
        return this._tilerHost();
      }
      var h = protocol + "://"
      if (protocol === 'http') {
        h += "{s}.";
      }
      var cdn_host = opts.cdn_url;
      if(!cdn_host.http && !cdn_host.https) {
        throw new Error("cdn_host should contain http and/or https entries");
      }
      h += cdn_host[protocol] + "/" + (opts.user_name || opts.user);
      return h;
    },

    _generateCartoCSS: function() {
      var attr = {
        '-torque-frame-count': this.options.steps,
        '-torque-resolution': this.options.resolution,
        '-torque-aggregation-function': "'" + this.options.countby + "'",
        '-torque-time-attribute': "'" + this.options.column + "'",
        '-torque-data-aggregation': this.options.cumulative ? 'cumulative': 'linear',
      };
      var st = 'Map{';
      for (var k in attr) {
        st += k + ":" + attr[k] + ";";
      }
      return st + "}";
    },

    _fetchMap: function(callback) {
      var self = this;
      var layergroup = {};
      var url = this._tilerHost() + "/api/v1/map";
      var named = this.options.named_map;

      if(named) {
        //tiles/template
        url = this._tilerHost() + "/api/v1/map/named/" + named.name + "/jsonp"
        //url = this._tilerHost() + "/map/" + named.name + "/jsonp"
      } else {
        layergroup = {
          "version": "1.0.1",
          "stat_tag": this.options.stat_tag || 'torque',
          "layers": [{
            "type": "torque",
            "options": {
              "cartocss_version": "1.0.0",
              "cartocss": this._generateCartoCSS(),
              "sql": this.getSQL()
            }
          }]
        };
      }
      var extra = this._extraParams();

      // tiler needs map_key instead of api_key
      // so replace it
      if (extra) {
        extra = extra.replace('api_key=', 'map_key=');
      }

      url = url +
        "?config=" + encodeURIComponent(JSON.stringify(layergroup)) +
        "&callback=?" + (extra ? "&" + extra: '');

      var map_instance_time = Profiler.metric('torque.provider.windshaft.layergroup.time').start();
      torque.net.jsonp(url, function (data) {
        map_instance_time.end();
        if (data) {
          var torque_key = Object.keys(data.metadata.torque)[0]
          var opt = data.metadata.torque[torque_key];
          for(var k in opt) {
            self.options[k] = opt[k];
          }
          self.templateUrl = self.url() + "/api/v1/map/" + data.layergroupid + "/" + torque_key + "/{z}/{x}/{y}.json.torque";
          self._setReady(true);
        } else {
          Profiler.metric('torque.provider.windshaft.layergroup.error').inc();
        }
      });
    }

  };

  torque.providers.windshaft = json;


})(typeof exports === "undefined" ? this : exports);
(function(exports) {
  var torque = exports.torque = exports.torque || {};
  torque.net = torque.net || {};

  var lastCall = null;

  function jsonp(url, callback, options) {
     options = options || { timeout: 10000 };
     var head = document.getElementsByTagName('head')[0];
     var script = document.createElement('script');

     // function name
     var fnName = 'torque_' + Date.now();

     function clean() {
       head.removeChild(script);
       clearTimeout(timeoutTimer);
       delete window[fnName];
     }

     window[fnName] = function() {
       clean();
       callback.apply(window, arguments);
     };

     // timeout for errors
     var timeoutTimer = setTimeout(function() { 
       clean();
       callback.call(window, null); 
     }, options.timeout);

     // setup url
     url = url.replace('callback=\?', 'callback=' + fnName);
     script.type = 'text/javascript';
     script.src = url;
     script.async = true;
     // defer the loading because IE9 loads in the same frame the script
     // so Loader._script is null
     setTimeout(function() { head.appendChild(script); }, 0);
  }

  function get(url, callback, options) {
    options = options || {
      method: 'GET',
      data: null,
      responseType: 'text'
    };
    lastCall = { url: url, callback: callback };
    var request = XMLHttpRequest;
    // from d3.js
    if (window.XDomainRequest
        && !("withCredentials" in request)
        && /^(http(s)?:)?\/\//.test(url)) request = XDomainRequest;

    var req = new request();
    req.open(options.method, url, true);


    function respond() {
      var status = req.status, result;
      var r = options.responseType === 'arraybuffer' ? req.response: req.responseText;
      if (!status && r || status >= 200 && status < 300 || status === 304) {
        callback(req);
      } else {
        callback(null);
      }
    }

    "onload" in req
      ? req.onload = req.onerror = respond
      : req.onreadystatechange = function() { req.readyState > 3 && respond(); };

    req.onprogress = function() {};

    req.responseType = options.responseType; //'arraybuffer';
    if (options.data) {
      req.setRequestHeader("Content-type", "application/json");
      //req.setRequestHeader("Content-type", "application/x-www-form-urlencoded")
      req.setRequestHeader("Accept", "*");
    }
    req.send(options.data);
    return req;
  }

  function post(url, data, callback) {
    return get(url, callback, {
      data: data,
      method: "POST"
    });
  }

  torque.net = {
    get: get,
    post: post,
    jsonp: jsonp,
    lastCall: function() { return lastCall; }
  };

})(typeof exports === "undefined" ? this : exports);
(function(exports) {

  exports.torque = exports.torque || {};

  var TAU = Math.PI*2;
  function renderPoint(ctx, st) {
    ctx.fillStyle = st.fillStyle;
    ctx.strokStyle = st.strokStyle;
    var pixel_size = st['point-radius'];

    // render a circle

    // fill
    ctx.beginPath();
    ctx.arc(0, 0, pixel_size, 0, TAU, true, true);
    ctx.closePath();
    if (st.fillStyle) {
      if (st.fillOpacity) {
        ctx.globalAlpha = st.fillOpacity;
      }
      ctx.fill();
    }

    // stroke
    ctx.globalAlpha = 1.0;
    if (st.strokeStyle && st.lineWidth) {
      if (st.strokeOpacity) {
        ctx.globalAlpha = st.strokeOpacity;
      }
      if (st.lineWidth) {
        ctx.lineWidth = st.lineWidth;
      }
      ctx.strokeStyle = st.strokeStyle;

      // do not render for alpha = 0
      if (ctx.globalAlpha > 0) {
        ctx.stroke();
      }
    }
  }

  function renderRectangle(ctx, st) {
    ctx.fillStyle = st.fillStyle;
    ctx.strokStyle = st.strokStyle;
    var pixel_size = st['point-radius'];
    var w = pixel_size * 2;

    // fill
    if (st.fillStyle && st.fillOpacity) {
      ctx.globalAlpha = st.fillOpacity;
    }
    ctx.fillRect(-pixel_size, -pixel_size, w, w)

    // stroke
    ctx.globalAlpha = 1.0;
    if (st.strokeStyle && st.lineWidth) {
      if (st.strokeOpacity) {
        ctx.globalAlpha = st.strokeOpacity;
      }
      if (st.lineWidth) {
        ctx.lineWidth = st.lineWidth;
      }
      ctx.strokeStyle = st.strokeStyle;

      // do not render for alpha = 0
      if (ctx.globalAlpha > 0) {
        ctx.strokeRect(-pixel_size, -pixel_size, w, w)
      }
    }
  }

  function renderSprite(ctx, st) {
    var img = st['point-file'] || st['marker-file'];
    var ratio = img.height/img.width;
    var w = st['point-radius'] || img.width;
    var h = st['point-radius'] || st['marker-height'] || w*ratio;
    ctx.drawImage(img, 0, 0, w, h);
  }

  exports.torque.cartocss = exports.torque.cartocss || {};
  exports.torque.cartocss = {
    renderPoint: renderPoint,
    renderSprite: renderSprite,
    renderRectangle: renderRectangle
  };

})(typeof exports === "undefined" ? this : exports);
(function(exports) {
  exports.torque = exports.torque || {};
  exports.torque.renderer = exports.torque.renderer || {};

  var TAU = Math.PI * 2;
  var DEFAULT_CARTOCSS = [
    '#layer {',
    '  marker-fill: #662506;',
    '  marker-width: 4;',
    '  [value > 1] { marker-fill: #FEE391; }',
    '  [value > 2] { marker-fill: #FEC44F; }',
    '  [value > 3] { marker-fill: #FE9929; }',
    '  [value > 4] { marker-fill: #EC7014; }',
    '  [value > 5] { marker-fill: #CC4C02; }',
    '  [value > 6] { marker-fill: #993404; }',
    '  [value > 7] { marker-fill: #662506; }',
    '}'
  ].join('\n');

  //
  // this renderer just render points depending of the value
  //
  function PointRenderer(canvas, options) {
    if (!canvas) {
      throw new Error("canvas can't be undefined");
    }
    this.options = options;
    this._canvas = canvas;
    this._ctx = canvas.getContext('2d');
    this._sprites = []; // sprites per layer
    this._shader = null;
    this.setCartoCSS(this.options.cartocss || DEFAULT_CARTOCSS);
  }

  PointRenderer.prototype = {

    setCanvas: function(canvas) {
      this._canvas = canvas;
      this._ctx = canvas.getContext('2d');
    },

    //
    // sets the cartocss style to render stuff
    //
    setCartoCSS: function(cartocss) {
      // clean sprites
      this.setShader(new carto.RendererJS().render(cartocss));
    },

    setShader: function(shader) {
      // clean sprites
      this._sprites = [];
      this._shader = shader;
    },

    clearSpriteCache: function() {
      this._sprites = [];
    },

    //
    // generate sprite based on cartocss style
    //
    generateSprite: function(shader, value, shaderVars) {
      var prof = Profiler.metric('torque.renderer.point.generateSprite').start();
      var st = shader.getStyle('canvas-2d', {
        value: value
      }, shaderVars);

      var pointSize = st['point-radius'];
      if (!pointSize) {
        throw new Error("marker-width property should be set");
      }

      var canvas = document.createElement('canvas');

      // take into account the exterior ring to calculate the size
      var canvasSize = (st.lineWidth || 0) + pointSize*2;
      var ctx = canvas.getContext('2d');
      var w = ctx.width = canvas.width = ctx.height = canvas.height = Math.ceil(canvasSize);
      ctx.translate(w/2, w/2);

      if(st['point-file'] || st['marker-file']) {
        torque.cartocss.renderSprite(ctx, st);
      } else {
        var mt = st['marker-type'];
        if (mt && mt === 'rectangle') {
          torque.cartocss.renderRectangle(ctx, st);
        } else {
          torque.cartocss.renderPoint(ctx, st);
        }
      }
      prof.end(true);
      return canvas;
    },

    //
    // renders all the layers (and frames for each layer) from cartocss
    //
    renderTile: function(tile, key) {
      var prof = Profiler.metric('torque.renderer.point.renderLayers').start();
      var layers = this._shader.getLayers();
      for(var i = 0, n = layers.length; i < n; ++i ) {
        var layer = layers[i];
        if (layer.name() !== "Map") {
          var sprites = this._sprites[i] || (this._sprites[i] = {});
          // frames for each layer
          for(var fr = 0; fr < layer.frames().length; ++fr) {
            var frame = layer.frames()[fr];
            var fr_sprites = sprites[frame] || (sprites[frame] = []);
            this._renderTile(tile, key - frame, frame, fr_sprites, layer);
          }
        }
      }
      prof.end(true);
    },

    //
    // renders a tile in the canvas for key defined in 
    // the torque tile
    //
    _renderTile: function(tile, key, frame_offset, sprites, shader, shaderVars) {
      if(!this._canvas) return;

      var prof = Profiler.metric('torque.renderer.point.renderTile').start();
      var ctx = this._ctx;
      var blendMode = shader.eval('comp-op') || this.options.blendmode;
      if(blendMode) {
        ctx.globalCompositeOperation = blendMode;
      }
      if (this.options.cumulative && key > tile.maxDate) {
        //TODO: precache because this tile is not going to change
        key = tile.maxDate;
      }
      var tileMax = this.options.resolution * (256/this.options.resolution - 1)
      var activePixels = tile.timeCount[key];
      if(activePixels) {
        var pixelIndex = tile.timeIndex[key];
        for(var p = 0; p < activePixels; ++p) {
          var posIdx = tile.renderDataPos[pixelIndex + p];
          var c = tile.renderData[pixelIndex + p];
          if(c) {
           var sp = sprites[c];
           if(!sp) {
             sp = sprites[c] = this.generateSprite(shader, c, _.extend({ zoom: tile.z, 'frame-offset': frame_offset }, shaderVars));
           }
           //var x = tile.x[posIdx]*res - (sp.width >> 1);
           //var y = (256 - res - res*tile.y[posIdx]) - (sp.height >> 1);
           var x = tile.x[posIdx]- (sp.width >> 1);
           var y = tileMax - tile.y[posIdx]; // flip mercator
           ctx.drawImage(sp, x, y - (sp.height >> 1));
          }
        }
      }
      prof.end(true);
    },

    setBlendMode: function(b) {
      this.options.blendmode = b;
    }

  };


  // exports public api
  exports.torque.renderer.Point = PointRenderer;

})(typeof exports === "undefined" ? this : exports);
(function(exports) {
  exports.torque = exports.torque || {};
  exports.torque.renderer = exports.torque.renderer || {};

  var DEFAULT_CARTOCSS = [
    '#layer {',
    '  polygon-fill: #FFFF00;',
    '  [value > 10] { polygon-fill: #FFFF00; }',
    '  [value > 100] { polygon-fill: #FFCC00; }',
    '  [value > 1000] { polygon-fill: #FE9929; }',
    '  [value > 10000] { polygon-fill: #FF6600; }',
    '  [value > 100000] { polygon-fill: #FF3300; }',
    '}'
  ].join('\n');

  var TAU = Math.PI * 2;

  //
  // this renderer just render points depending of the value
  // 
  function RectanbleRenderer(canvas, options) {
    this.options = options;
    carto.tree.Reference.set(torque['torque-reference']);
    this.setCanvas(canvas);
    this.setCartoCSS(this.options.cartocss || DEFAULT_CARTOCSS);
  }

  RectanbleRenderer.prototype = {

    //
    // sets the cartocss style to render stuff
    //
    setCartoCSS: function(cartocss) {
      this._cartoCssStyle = new carto.RendererJS().render(cartocss);
      if(this._cartoCssStyle.getLayers().length > 1) {
        throw new Error("only one CartoCSS layer is supported");
      }
      this._shader = this._cartoCssStyle.getLayers()[0].shader;
    },

    setCanvas: function(canvas) {
      if(!canvas) return;
      this._canvas = canvas;
      this._ctx = canvas.getContext('2d');
    },

    accumulate: function(tile, keys) {
      var prof = Profiler.metric('RectangleRender:accumulate').start();
      var x, y, posIdx, p, k, key, activePixels, pixelIndex;
      var res = this.options.resolution;
      var s = 256/res;
      var accum = new Float32Array(s*s);

      if(typeof(keys) !== 'object') {
        keys = [keys];
      }

      for(k = 0; k < keys.length; ++k) {
        key = keys[k];
        activePixels = tile.timeCount[key];
        if(activePixels) {
          pixelIndex = tile.timeIndex[key];
          for(p = 0; p < activePixels; ++p) {
            posIdx = tile.renderDataPos[pixelIndex + p];
            x = tile.x[posIdx]/res;
            y = tile.y[posIdx]/res;
            accum[x*s + y] += tile.renderData[pixelIndex + p];
          }
        }
      }

      prof.end();
      return accum;
    },

    renderTileAccum: function(accum, px, py) {
      var prof = Profiler.metric('RectangleRender:renderTileAccum').start();
      var color, x, y, alpha;
      var res = this.options.resolution;
      var ctx = this._ctx;
      var s = (256/res) | 0;
      var s2 = s*s;
      var colors = this._colors;
      if(this.options.blendmode) {
        ctx.globalCompositeOperation = this.options.blendmode;
      }
      var polygon_alpha = this._shader['polygon-opacity'] || function() { return 1.0; };
      for(var i = 0; i < s2; ++i) {
        var xy = i;
        var value = accum[i];
        if(value) {
          x = (xy/s) | 0;
          y = xy % s;
          // by-pass the style generation for improving performance
          color = this._shader['polygon-fill']({ value: value }, { zoom: 0 });
          ctx.fillStyle = color;
          //TODO: each function should have a default value for each 
          //property defined in the cartocss
          alpha = polygon_alpha({ value: value }, { zoom: 0 });
          if(alpha === null) {
            alpha = 1.0;
          }
          ctx.globalAlpha = alpha;
          ctx.fillRect(x * res, 256 - res - y * res, res, res);
        }
      }
      prof.end();
    },

    //
    // renders a tile in the canvas for key defined in 
    // the torque tile
    //
    renderTile: function(tile, key, px, py) {
      if(!this._canvas) return;

      var res = this.options.resolution;

      //var prof = Profiler.get('render').start();
      var ctx = this._ctx;
      var colors = this._colors;
      var activepixels = tile.timeCount[key];
      if(activepixels) {
        var w = this._canvas.width;
        var h = this._canvas.height;
        //var imageData = ctx.getImageData(0, 0, w, h);
        //var pixels = imageData.data;
        var pixelIndex = tile.timeIndex[key];
        for(var p = 0; p < activePixels; ++p) {
          var posIdx = tile.renderDataPos[pixelIndex + p];
          var c = tile.renderData[pixelIndex + p];
          if(c) {
           var color = colors[Math.min(c, colors.length - 1)];
           var x = tile.x[posIdx];// + px;
           var y = tile.y[posIdx]; //+ py;

           ctx.fillStyle = color;
           ctx.fillRect(x, y, res, res);
           /*

           for(var xx = 0; xx < res; ++xx) {
            for(var yy = 0; yy < res; ++yy) {
              var idx = 4*((x+xx) + w*(y + yy));
              pixels[idx + 0] = color[0];
              pixels[idx + 1] = color[1];
              pixels[idx + 2] = color[2];
              pixels[idx + 3] = color[3];
            }
           }
           */
          }
        }
        //ctx.putImageData(imageData, 0, 0);
      }
      //prof.end();
    }
  };


  // exports public api
  exports.torque.renderer.Rectangle = RectanbleRenderer;

})(typeof exports === "undefined" ? this : exports);
/**
 * @license
 * Copyright 2013 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Extends OverlayView to provide a canvas "Layer".
 * @author Brendan Kenny
 */

/**
 * A map layer that provides a canvas over the slippy map and a callback
 * system for efficient animation. Requires canvas and CSS 2D transform
 * support.
 * @constructor
 * @extends google.maps.OverlayView
 * @param {CanvasLayerOptions=} opt_options Options to set in this CanvasLayer.
 */

if(typeof(google) !== 'undefined' && typeof(google.maps) !== 'undefined') {
function CanvasLayer(opt_options) {
  /**
   * If true, canvas is in a map pane and the OverlayView is fully functional.
   * See google.maps.OverlayView.onAdd for more information.
   * @type {boolean}
   * @private
   */
  this.isAdded_ = false;

  /**
   * If true, each update will immediately schedule the next.
   * @type {boolean}
   * @private
   */
  this.isAnimated_ = false;

  /**
   * The name of the MapPane in which this layer will be displayed.
   * @type {string}
   * @private
   */
  this.paneName_ = CanvasLayer.DEFAULT_PANE_NAME_;

  /**
   * A user-supplied function called whenever an update is required. Null or
   * undefined if a callback is not provided.
   * @type {?function=}
   * @private
   */
  this.updateHandler_ = null;

  /**
   * A user-supplied function called whenever an update is required and the
   * map has been resized since the last update. Null or undefined if a
   * callback is not provided.
   * @type {?function}
   * @private
   */
  this.resizeHandler_ = null;

  /**
   * The LatLng coordinate of the top left of the current view of the map. Will
   * be null when this.isAdded_ is false.
   * @type {google.maps.LatLng}
   * @private
   */
  this.topLeft_ = null;

  /**
   * The map-pan event listener. Will be null when this.isAdded_ is false. Will
   * be null when this.isAdded_ is false.
   * @type {?function}
   * @private
   */
  this.centerListener_ = null;

  /**
   * The map-resize event listener. Will be null when this.isAdded_ is false.
   * @type {?function}
   * @private
   */
  this.resizeListener_ = null;

  /**
   * If true, the map size has changed and this.resizeHandler_ must be called
   * on the next update.
   * @type {boolean}
   * @private
   */
  this.needsResize_ = true;

  /**
   * A browser-defined id for the currently requested callback. Null when no
   * callback is queued.
   * @type {?number}
   * @private
   */
  this.requestAnimationFrameId_ = null;

  var canvas = document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.top = 0;
  canvas.style.left = 0;
  canvas.style.pointerEvents = 'none';

  /**
   * The canvas element.
   * @type {!HTMLCanvasElement}
   */
  this.canvas = canvas;

  /**
   * Simple bind for functions with no args for bind-less browsers (Safari).
   * @param {Object} thisArg The this value used for the target function.
   * @param {function} func The function to be bound.
   */
  function simpleBindShim(thisArg, func) {
    return function() { func.apply(thisArg); };
  }

  /**
   * A reference to this.repositionCanvas_ with this bound as its this value.
   * @type {function}
   * @private
   */
  this.repositionFunction_ = simpleBindShim(this, this.repositionCanvas_);

  /**
   * A reference to this.resize_ with this bound as its this value.
   * @type {function}
   * @private
   */
  this.resizeFunction_ = simpleBindShim(this, this.resize_);

  /**
   * A reference to this.update_ with this bound as its this value.
   * @type {function}
   * @private
   */
  this.requestUpdateFunction_ = simpleBindShim(this, this.update_);

  // set provided options, if any
  if (opt_options) {
    this.setOptions(opt_options);
  }
}

CanvasLayer.prototype = new google.maps.OverlayView();

/**
 * The default MapPane to contain the canvas.
 * @type {string}
 * @const
 * @private
 */
CanvasLayer.DEFAULT_PANE_NAME_ = 'overlayLayer';

/**
 * Transform CSS property name, with vendor prefix if required. If browser
 * does not support transforms, property will be ignored.
 * @type {string}
 * @const
 * @private
 */
CanvasLayer.CSS_TRANSFORM_ = (function() {
  var div = document.createElement('div');
  var transformProps = [
    'transform',
    'WebkitTransform',
    'MozTransform',
    'OTransform',
    'msTransform'
  ];
  for (var i = 0; i < transformProps.length; i++) {
    var prop = transformProps[i];
    if (div.style[prop] !== undefined) {
      return prop;
    }
  }

  // return unprefixed version by default
  return transformProps[0];
})();

/**
 * The requestAnimationFrame function, with vendor-prefixed or setTimeout-based
 * fallbacks. MUST be called with window as thisArg.
 * @type {function}
 * @param {function} callback The function to add to the frame request queue.
 * @return {number} The browser-defined id for the requested callback.
 * @private
 */
CanvasLayer.prototype.requestAnimFrame_ =
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function(callback) {
      return window.setTimeout(callback, 1000 / 60);
    };

/**
 * The cancelAnimationFrame function, with vendor-prefixed fallback. Does not
 * fall back to clearTimeout as some platforms implement requestAnimationFrame
 * but not cancelAnimationFrame, and the cost is an extra frame on onRemove.
 * MUST be called with window as thisArg.
 * @type {function}
 * @param {number=} requestId The id of the frame request to cancel.
 * @private
 */
CanvasLayer.prototype.cancelAnimFrame_ =
    window.cancelAnimationFrame ||
    window.webkitCancelAnimationFrame ||
    window.mozCancelAnimationFrame ||
    window.oCancelAnimationFrame ||
    window.msCancelAnimationFrame ||
    function(requestId) {};

/**
 * Sets any options provided. See CanvasLayerOptions for more information.
 * @param {CanvasLayerOptions} options The options to set.
 */
CanvasLayer.prototype.setOptions = function(options) {
  if (options.animate !== undefined) {
    this.setAnimate(options.animate);
  }

  if (options.paneName !== undefined) {
    this.setPane(options.paneName);
  }

  if (options.updateHandler !== undefined) {
    this.setUpdateHandler(options.updateHandler);
  }

  if (options.resizeHandler !== undefined) {
    this.setResizeHandler(options.resizeHandler);
  }

  if(options.readyHandler) {
    this.readyHandler = options.readyHandler;
  }

};

/**
 * Set the animated state of the layer. If true, updateHandler will be called
 * repeatedly, once per frame. If false, updateHandler will only be called when
 * a map property changes that could require the canvas content to be redrawn.
 * @param {boolean} animate Whether the canvas is animated.
 */
CanvasLayer.prototype.setAnimate = function(animate) {
  this.isAnimated_ = !!animate;

  if (this.isAnimated_) {
    this.scheduleUpdate();
  }
};

/**
 * @return {boolean} Whether the canvas is animated.
 */
CanvasLayer.prototype.isAnimated = function() {
  return this.isAnimated_;
};

/**
 * Set the MapPane in which this layer will be displayed, by name. See
 * {@code google.maps.MapPanes} for the panes available.
 * @param {string} paneName The name of the desired MapPane.
 */
CanvasLayer.prototype.setPaneName = function(paneName) {
  this.paneName_ = paneName;

  this.setPane_();
};

/**
 * @return {string} The name of the current container pane.
 */
CanvasLayer.prototype.getPaneName = function() {
  return this.paneName_;
};

/**
 * Adds the canvas to the specified container pane. Since this is guaranteed to
 * execute only after onAdd is called, this is when paneName's existence is
 * checked (and an error is thrown if it doesn't exist).
 * @private
 */
CanvasLayer.prototype.setPane_ = function() {
  if (!this.isAdded_) {
    return;
  }

  // onAdd has been called, so panes can be used
  var panes = this.getPanes();
  if (!panes[this.paneName_]) {
    throw new Error('"' + this.paneName_ + '" is not a valid MapPane name.');
  }

  panes[this.paneName_].appendChild(this.canvas);
};

/**
 * Set a function that will be called whenever the parent map and the overlay's
 * canvas have been resized. If opt_resizeHandler is null or unspecified, any
 * existing callback is removed.
 * @param {?function=} opt_resizeHandler The resize callback function.
 */
CanvasLayer.prototype.setResizeHandler = function(opt_resizeHandler) {
  this.resizeHandler_ = opt_resizeHandler;
};

/**
 * Set a function that will be called when a repaint of the canvas is required.
 * If opt_updateHandler is null or unspecified, any existing callback is
 * removed.
 * @param {?function=} opt_updateHandler The update callback function.
 */
CanvasLayer.prototype.setUpdateHandler = function(opt_updateHandler) {
  this.updateHandler_ = opt_updateHandler;
};

/**
 * @inheritDoc
 */
CanvasLayer.prototype.onAdd = function() {
  if (this.isAdded_) {
    return;
  }

  this.isAdded_ = true;
  this.setPane_();

  this.resizeListener_ = google.maps.event.addListener(this.getMap(),
      'resize', this.resizeFunction_);
  this.centerListener_ = google.maps.event.addListener(this.getMap(),
      'center_changed', this.repositionFunction_);

  this.resize_();
  this.repositionCanvas_();
  this.readyHandler && this.readyHandler();
};

/**
 * @inheritDoc
 */
CanvasLayer.prototype.onRemove = function() {
  if (!this.isAdded_) {
    return;
  }

  this.isAdded_ = false;
  this.topLeft_ = null;

  // remove canvas and listeners for pan and resize from map
  this.canvas.parentElement.removeChild(this.canvas);
  if (this.centerListener_) {
    google.maps.event.removeListener(this.centerListener_);
    this.centerListener_ = null;
  }
  if (this.resizeListener_) {
    google.maps.event.removeListener(this.resizeListener_);
    this.resizeListener_ = null;
  }

  // cease canvas update callbacks
  if (this.requestAnimationFrameId_) {
    this.cancelAnimFrame_.call(window, this.requestAnimationFrameId_);
    this.requestAnimationFrameId_ = null;
  }
};

/**
 * The internal callback for resize events that resizes the canvas to keep the
 * map properly covered.
 * @private
 */
CanvasLayer.prototype.resize_ = function() {
  // TODO(bckenny): it's common to use a smaller canvas but use CSS to scale
  // what is drawn by the browser to save on fill rate. Add an option to do
  // this.

  if (!this.isAdded_) {
    return;
  }

  var map = this.getMap();
  var width = map.getDiv().offsetWidth;
  var height = map.getDiv().offsetHeight;
  var oldWidth = this.canvas.width;
  var oldHeight = this.canvas.height;

  // resizing may allocate a new back buffer, so do so conservatively
  if (oldWidth !== width || oldHeight !== height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';

    this.needsResize_ = true;
    this.scheduleUpdate();
  }
};

/**
 * @inheritDoc
 */
CanvasLayer.prototype.draw = function() {
  this.repositionCanvas_();
};

/**
 * Internal callback for map view changes. Since the Maps API moves the overlay
 * along with the map, this function calculates the opposite translation to
 * keep the canvas in place.
 * @private
 */
CanvasLayer.prototype.repositionCanvas_ = function() {
  // TODO(bckenny): *should* only be executed on RAF, but in current browsers
  //     this causes noticeable hitches in map and overlay relative
  //     positioning.

  var bounds = this.getMap().getBounds();
  this.topLeft_ = new google.maps.LatLng(bounds.getNorthEast().lat(),
      bounds.getSouthWest().lng());

  // canvas position relative to draggable map's conatainer depends on
  // overlayView's projection, not the map's
  var projection = this.getProjection();
  var divTopLeft = projection.fromLatLngToDivPixel(this.topLeft_);

  // when the zoom level is low, more than one map can be shown in the screen
  // so the canvas should be attach to the map with more are in the screen
  var mapSize = (1 << this.getMap().getZoom())*256;
  if (Math.abs(divTopLeft.x) > mapSize) {
    divTopLeft.x -= mapSize;
  }
  this.canvas.style[CanvasLayer.CSS_TRANSFORM_] = 'translate(' +
      Math.round(divTopLeft.x) + 'px,' + Math.round(divTopLeft.y) + 'px)';

  this.scheduleUpdate();
};

/**
 * Internal callback that serves as main animation scheduler via
 * requestAnimationFrame. Calls resize and update callbacks if set, and
 * schedules the next frame if overlay is animated.
 * @private
 */
CanvasLayer.prototype.update_ = function() {
  this.requestAnimationFrameId_ = null;

  if (!this.isAdded_) {
    return;
  }

  if (this.isAnimated_) {
    this.scheduleUpdate();
  }

  if (this.needsResize_ && this.resizeHandler_) {
    this.needsResize_ = false;
    this.resizeHandler_();
  }

  if (this.updateHandler_) {
    this.updateHandler_();
  }
};

/**
 * A convenience method to get the current LatLng coordinate of the top left of
 * the current view of the map.
 * @return {google.maps.LatLng} The top left coordinate.
 */
CanvasLayer.prototype.getTopLeft = function() {
  return this.topLeft_;
};

/**
 * Schedule a requestAnimationFrame callback to updateHandler. If one is
 * already scheduled, there is no effect.
 */
CanvasLayer.prototype.scheduleUpdate = function() {
  if (this.isAdded_ && !this.requestAnimationFrameId_) {
    this.requestAnimationFrameId_ =
        this.requestAnimFrame_.call(window, this.requestUpdateFunction_);
  }
};
}
/*
 ====================
 canvas setup for drawing tiles
 ====================
 */

if(typeof(google) !== 'undefined' && typeof(google.maps) !== 'undefined') {

function CanvasTileLayer(canvas_setup, render) {
  this.tileSize = new google.maps.Size(256, 256);
  this.maxZoom = 19;
  this.name = "Tile #s";
  this.alt = "Canvas tile layer";
  this.tiles = {};
  this.canvas_setup = canvas_setup;
  this.render = render;
  if (!render) {
      this.render = canvas_setup;
  }
}


// create a tile with a canvas element
CanvasTileLayer.prototype.create_tile_canvas = function (coord, zoom, ownerDocument) {

  // create canvas and reset style
  var canvas = ownerDocument.createElement('canvas');
  var hit_canvas = ownerDocument.createElement('canvas');
  canvas.style.border = hit_canvas.style.border = "none";
  canvas.style.margin = hit_canvas.style.margin = "0";
  canvas.style.padding = hit_canvas.style.padding = "0";

  // prepare canvas and context sizes
  var ctx = canvas.getContext('2d');
  ctx.width = canvas.width = this.tileSize.width;
  ctx.height = canvas.height = this.tileSize.height;

  var hit_ctx = hit_canvas.getContext('2d');
  hit_canvas.width = hit_ctx.width = this.tileSize.width;
  hit_canvas.height = hit_ctx.height = this.tileSize.height;

  //set unique id
  var tile_id = coord.x + '_' + coord.y + '_' + zoom;

  canvas.setAttribute('id', tile_id);
  hit_canvas.setAttribute('id', tile_id);

  if (tile_id in this.tiles)
      delete this.tiles[tile_id];

  this.tiles[tile_id] = {canvas:canvas, ctx:ctx, hit_canvas:hit_canvas, hit_ctx:hit_ctx, coord:coord, zoom:zoom, primitives:null};

  // custom setup
  //if (tile_id == '19295_24654_16'){
  if (this.canvas_setup)
      this.canvas_setup(this.tiles[tile_id], coord, zoom);
  //}
  return canvas;

}


CanvasTileLayer.prototype.each = function (callback) {
  for (var t in this.tiles) {
      var tile = this.tiles[t];
      callback(tile);
  }
}

CanvasTileLayer.prototype.recreate = function () {
  for (var t in this.tiles) {
      var tile = this.tiles[t];
      this.canvas_setup(tile, tile.coord, tile.zoom);
  }
};

CanvasTileLayer.prototype.redraw_tile = function (tile) {
  this.render(tile, tile.coord, tile.zoom);
};

CanvasTileLayer.prototype.redraw = function () {
  for (var t in this.tiles) {
      var tile = this.tiles[t];
      this.render(tile, tile.coord, tile.zoom);
  }
};

// could be called directly...
CanvasTileLayer.prototype.getTile = function (coord, zoom, ownerDocument) {
  return this.create_tile_canvas(coord, zoom, ownerDocument);
};

CanvasTileLayer.prototype.releaseTile = function (tile) {
  var id = tile.getAttribute('id');
  delete this.tiles[id];
};

}
(function(exports) {

if(typeof(google) === 'undefined' || typeof(google.maps) === 'undefined') return;

function GMapsTileLoader() {
}


GMapsTileLoader.prototype = {

  _initTileLoader: function(map, projection) {
    this._map = map;
    this._projection = projection;
    this._tiles = {};
    this._tilesLoading = {};
    this._tilesToLoad = 0;
    this._updateTiles = this._updateTiles.bind(this);
    this._listeners = [];
    this._listeners.push(
      google.maps.event.addListener(this._map, 'dragend', this._updateTiles),
      google.maps.event.addListener(this._map, 'zoom_changed', this._updateTiles)
    );
    this.tileSize = 256;
    this._updateTiles();
  },

  _removeTileLoader: function() {
    for(var i in this._listeners) {
      google.maps.event.removeListener(this._listeners[i]);
    }
    this._removeTiles();
  },

  _removeTiles: function () {
      for (var key in this._tiles) {
        this._removeTile(key);
      }
  },

  _reloadTiles: function() {
    this._removeTiles();
    this._updateTiles();
  },

  _updateTiles: function () {

      if (!this._map) { return; }

      var bounds = this._map.getBounds();
      var zoom = this._map.getZoom();
      var tileSize = this.tileSize;
      var mzoom = (1 << zoom);

      var topLeft = new google.maps.LatLng(
        bounds.getNorthEast().lat(),
        bounds.getSouthWest().lng()
      );

      var bottomRigth = new google.maps.LatLng(
        bounds.getSouthWest().lat(),
        bounds.getNorthEast().lng()
      );


      this._projection = this._map.getProjection();
      var divTopLeft = this._projection.fromLatLngToPoint(topLeft);
      var divBottomRight = this._projection.fromLatLngToPoint(bottomRigth);


      var nwTilePoint = new google.maps.Point(
              Math.floor(divTopLeft.x*mzoom / tileSize),
              Math.floor(divTopLeft.y*mzoom / tileSize)),
          seTilePoint = new google.maps.Point(
              Math.floor(divBottomRight.x*mzoom / tileSize),
              Math.floor(divBottomRight.y*mzoom / tileSize));


      this._addTilesFromCenterOut(nwTilePoint, seTilePoint);
      this._removeOtherTiles(nwTilePoint, seTilePoint);
  },

  _removeOtherTiles: function (nwTilePoint, seTilePoint) {
      var kArr, x, y, key;

      var zoom = this._map.getZoom();
      for (key in this._tiles) {
          if (this._tiles.hasOwnProperty(key)) {
              kArr = key.split(':');
              x = parseInt(kArr[0], 10);
              y = parseInt(kArr[1], 10);
              z = parseInt(kArr[2], 10);

              // remove tile if it's out of bounds
              if (z !== zoom || x < nwTilePoint.x || x > seTilePoint.x || y < nwTilePoint.y || y > seTilePoint.y) {
                  this._removeTile(key);
              }
          }
      }
  },

  _removeTile: function (key) {
      this.onTileRemoved && this.onTileRemoved(this._tiles[key]); 
      delete this._tiles[key];
      delete this._tilesLoading[key];
  },

  _tileKey: function(tilePoint) {
    return tilePoint.x + ':' + tilePoint.y + ':' + tilePoint.zoom;
  },

  _tileShouldBeLoaded: function (tilePoint) {
      var k = this._tileKey(tilePoint);
      return !(k in this._tiles) && !(k in this._tilesLoading);
  },

  _tileLoaded: function(tilePoint, tileData) {
    this._tilesToLoad--;
    var k = tilePoint.x + ':' + tilePoint.y + ':' + tilePoint.zoom
    this._tiles[k] = tileData;
    delete this._tilesLoading[k];
    if(this._tilesToLoad === 0) {
      this.onTilesLoaded && this.onTilesLoaded();
    }
  },

  getTilePos: function (tilePoint) {
    var limit = (1 << this._map.getZoom());
    // wrap tile
    tilePoint = {
      x: ((tilePoint.x % limit) + limit) % limit,
      y: tilePoint.y
    };

    tilePoint = new google.maps.Point(
      tilePoint.x * this.tileSize, 
      tilePoint.y * this.tileSize
    );

    var bounds = this._map.getBounds();
    var topLeft = new google.maps.LatLng(
      bounds.getNorthEast().lat(),
      bounds.getSouthWest().lng()
    );

    var divTopLeft = this._map.getProjection().fromLatLngToPoint(topLeft);
    zoom = (1 << this._map.getZoom());
    divTopLeft.x = divTopLeft.x * zoom;
    divTopLeft.y = divTopLeft.y * zoom;

    return new google.maps.Point(
      tilePoint.x - divTopLeft.x,
      tilePoint.y - divTopLeft.y
    );
  },

  _addTilesFromCenterOut: function (nwTilePoint, seTilePoint) {
      var queue = [],
          center = new google.maps.Point(
            (nwTilePoint.x + seTilePoint.x) * 0.5,
            (nwTilePoint.y + seTilePoint.y) * 0.5
          ),
          zoom = this._map.getZoom();

      var j, i, point;

      for (j = nwTilePoint.y; j <= seTilePoint.y; j++) {
          for (i = nwTilePoint.x; i <= seTilePoint.x; i++) {
              point = new google.maps.Point (i, j);
              point.zoom = zoom;

              if (this._tileShouldBeLoaded(point)) {
                  queue.push(point);
              }
          }
      }

      var tilesToLoad = queue.length;

      if (tilesToLoad === 0) { return; }

      function distanceToCenterSq(point) {
        var dx = point.x - center.x;
        var dy = point.y - center.y;
        return dx * dx + dy * dy;
      }

      // load tiles in order of their distance to center
      queue.sort(function (a, b) {
          return distanceToCenterSq(a) - distanceToCenterSq(b);
      });

      this._tilesToLoad += tilesToLoad;

        for (i = 0; i < tilesToLoad; i++) {
          var t = queue[i];
          var k = this._tileKey(t);
          this._tilesLoading[k] = t;
          // events
          if (this.onTileAdded) {
            this.onTileAdded(t);
          }
        }

      this.onTilesLoading && this.onTilesLoading();
  }

}

torque.GMapsTileLoader = GMapsTileLoader;

})(typeof exports === "undefined" ? this : exports);
(function(exports) {

if(typeof(google) === 'undefined' || typeof(google.maps) === 'undefined') return;

function GMapsTorqueLayer(options) {
  var self = this;
  if (!torque.isBrowserSupported()) {
    throw new Error("browser is not supported by torque");
  }
  this.key = 0;
  this.shader = null;
  this.ready = false;
  this.options = _.extend({}, options);
  _.defaults(this.options, {
    provider: 'windshaft',
    renderer: 'point',
    resolution: 2,
    steps: 100,
    visible: true
  });
  if (options.cartocss) {
    _.extend(this.options, 
        torque.common.TorqueLayer.optionsFromCartoCSS(options.cartocss));
  }

  this.hidden = !this.options.visible;

  this.animator = new torque.Animator(function(time) {
    var k = time | 0;
    if(self.key !== k) {
      self.setKey(k);
    }
  }, this.options);

  this.play = this.animator.start.bind(this.animator);
  this.stop = this.animator.stop.bind(this.animator);
  this.pause = this.animator.pause.bind(this.animator);
  this.toggle = this.animator.toggle.bind(this.animator);
  this.setDuration = this.animator.duration.bind(this.animator);
  this.isRunning = this.animator.isRunning.bind(this.animator);


  CanvasLayer.call(this, {
    map: this.options.map,
    //resizeHandler: this.redraw,
    animate: false,
    updateHandler: this.render,
    readyHandler: this.initialize
  });

}

/**
 * torque layer
 */
GMapsTorqueLayer.prototype = _.extend({}, 
  CanvasLayer.prototype,
  torque.GMapsTileLoader.prototype,
  torque.Event,
  {

  providers: {
    'sql_api': torque.providers.json,
    'url_template': torque.providers.jsonarray,
    'windshaft': torque.providers.windshaft
  },

  renderers: {
    'point': torque.renderer.Point,
    'pixel': torque.renderer.Rectangle
  },

  initialize: function() {
    var self = this;

    this.onTileAdded = this.onTileAdded.bind(this);

    this.options.ready = function() {
      self.fire("change:bounds", {
        bounds: self.provider.getBounds()
      });
      self.animator.steps(self.provider.getSteps());
      self.animator.rescale();
      self.fire('change:steps', {
        steps: self.provider.getSteps()
      });
      self.setKey(self.key);
    };

    this.provider = new this.providers[this.options.provider](this.options);
    this.renderer = new this.renderers[this.options.renderer](this.getCanvas(), this.options);

    // this listener should be before tile loader
    this._cacheListener = google.maps.event.addListener(this.options.map, 'zoom_changed', function() {
      self.renderer && self.renderer.clearSpriteCache();
    });

    this._initTileLoader(this.options.map, this.getProjection());

    if (this.shader) {
      this.renderer.setShader(this.shader);
    }

  },

  hide: function() {
    if(this.hidden) return this;
    this.pause();
    this.clear();
    this.hidden = true;
    return this;
  },

  show: function() {
    if(!this.hidden) return this;
    this.hidden = false;
    this.play();
    return this;
  },

  setSQL: function(sql) {
    if (!this.provider || !this.provider.setSQL) {
      throw new Error("this provider does not support SQL");
    }
    this.provider.setSQL(sql);
    this._reloadTiles();
    return this;
  },

  setBlendMode: function(_) {
    this.renderer && this.renderer.setBlendMode(_);
    this.redraw();
  },

  setSteps: function(steps) {
    this.provider && this.provider.setSteps(steps);
    this.animator && this.animator.steps(steps);
    this._reloadTiles();
  },

  setColumn: function(column, isTime) {
    this.provider && this.provider.setColumn(column, isTime);
    this._reloadTiles();
  },

  getTimeBounds: function() {
    return this.provider && this.provider.getKeySpan();
  },

  getCanvas: function() {
    return this.canvas;
  },

    // for each tile shown on the map request the data
  onTileAdded: function(t) {
    var self = this;
    this.provider.getTileData(t, t.zoom, function(tileData) {
      // don't load tiles that are not being shown
      if (t.zoom !== self.options.map.getZoom()) return;
      self._tileLoaded(t, tileData);
      if (tileData) {
        self.redraw();
      }
    });
  },

  clear: function() {
    var canvas = this.canvas;
    canvas.width = canvas.width;
  },

  /**
   * render the selectef key
   * don't call this function directly, it's called by
   * requestAnimationFrame. Use redraw to refresh it
   */
  render: function() {
    if(this.hidden) return;
    var t, tile, pos;
    var canvas = this.canvas;
    canvas.width = canvas.width;
    var ctx = canvas.getContext('2d');

    // renders only a "frame"
    for(t in this._tiles) {
      tile = this._tiles[t];
      if (tile) {
        pos = this.getTilePos(tile.coord);
        ctx.setTransform(1, 0, 0, 1, pos.x, pos.y);
        this.renderer.renderTile(tile, this.key, pos.x, pos.y);
      }
    }
  },

  /**
   * set key to be shown. If it's a single value
   * it renders directly, if it's an array it renders
   * accumulated
   */
  setKey: function(key) {
    this.key = key;
    this.animator.step(key);
    this.redraw();
    this.fire('change:time', { time: this.getTime(), step: this.key });
  },

  /**
   * helper function, does the same than ``setKey`` but only 
   * accepts scalars.
   */
  setStep: function(time) {
    if(time === undefined || time.length !== undefined) {
      throw new Error("setTime only accept scalars");
    }
    this.setKey(time);
  },

  /**
   * transform from animation step to Date object 
   * that contains the animation time
   *
   * ``step`` should be between 0 and ``steps - 1`` 
   */
  stepToTime: function(step) {
    if (!this.provider) return 0;
    var times = this.provider.getKeySpan();
    var time = times.start + (times.end - times.start)*(step/this.provider.getSteps());
    return new Date(time);
  },

  getStep: function() {
    return this.key;
  },

  /**
   * returns the animation time defined by the data
   * in the defined column. Date object
   */
  getTime: function() {
    return this.stepToTime(this.key);
  },

  /**
   * set the cartocss for the current renderer
   */
  setCartoCSS: function(cartocss) {
    var shader = new carto.RendererJS().render(cartocss);
    this.shader = shader;
    if (this.renderer) {
      this.renderer.setShader(shader);
    }

    // provider options
    var options = torque.common.TorqueLayer.optionsFromLayer(shader.findLayer({ name: 'Map' }));
    this.provider && this.provider.setCartoCSS && this.provider.setCartoCSS(cartocss);
    if(this.provider && this.provider.setOptions(options)) {
      this._reloadTiles();
    }
    _.extend(this.options, options);

    // animator options
    if (options.animationDuration) {
      this.animator.duration(options.animationDuration);
    }

    this.redraw();
    return this;
  },

  redraw: function() {
    this.scheduleUpdate();
  },

  onRemove: function() {
    CanvasLayer.prototype.onRemove.call(this);
    this.animator.stop();
    this._removeTileLoader();
    google.maps.event.removeListener(this._cacheListener);
  }

});



function GMapsTiledTorqueLayer(options) {
  this.options = _.extend({}, options);
  CanvasTileLayer.call(this, this._loadTile.bind(this), this.drawTile.bind(this));
  this.initialize(options);
}

GMapsTiledTorqueLayer.prototype = _.extend({}, CanvasTileLayer.prototype, {

  providers: {
    'sql_api': torque.providers.json,
    'url_template': torque.providers.JsonArray
  },

  renderers: {
    'point': torque.renderer.Point,
    'pixel': torque.renderer.Rectangle
  },

  initialize: function(options) {
    var self = this;
    this.key = 0;

    this.options.renderer = this.options.renderer || 'pixel';
    this.options.provider = this.options.provider || 'sql_api';

    this.provider = new this.providers[this.options.provider](options);
    this.renderer = new this.renderers[this.options.renderer](null, options);

  },

  _tileLoaded: function(tile, tileData) {
    tile.data = tileData;
    this.drawTile(tile);
  },

  _loadTile: function(tile, coord, zoom) {
    var self = this;
    var limit = 1 << zoom;
    // wrap tile
    var wrappedCoord = {
      x: ((coord.x % limit) + limit) % limit,
      y: coord.y
    };

    this.provider.getTileData(wrappedCoord, zoom, function(tileData) {
      self._tileLoaded(tile, tileData);
    });
  },

  drawTile: function (tile) {
    var canvas = tile.canvas;
    if(!tile.data) return;
    canvas.width = canvas.width;

    this.renderer.setCanvas(canvas);

    var accum = this.renderer.accumulate(tile.data, this.key);
    this.renderer.renderTileAccum(accum, 0, 0);
  },

  setKey: function(key) {
    this.key = key;
    this.redraw();
  },

  /**
   * set the cartocss for the current renderer
   */
  setCartoCSS: function(cartocss) {
    if (!this.renderer) throw new Error('renderer is not valid');
    return this.renderer.setCartoCSS(cartocss);
  }

});

exports.torque.GMapsTiledTorqueLayer = GMapsTiledTorqueLayer;
exports.torque.GMapsTorqueLayer = GMapsTorqueLayer;

})(typeof exports === "undefined" ? this : exports);
if(typeof(L) !== 'undefined') {

L.Mixin.TileLoader = {

  _initTileLoader: function() {
    this._tiles = {}
    this._tilesLoading = {};
    this._tilesToLoad = 0;
    this._map.on({
        'moveend': this._updateTiles
    }, this);
    this._updateTiles();
  },

  _removeTileLoader: function() {
    this._map.off({
        'moveend': this._updateTiles
    }, this);
    this._removeTiles();
  },

  _updateTiles: function () {

      if (!this._map) { return; }

      var bounds = this._map.getPixelBounds(),
          zoom = this._map.getZoom(),
          tileSize = this.options.tileSize;

      if (zoom > this.options.maxZoom || zoom < this.options.minZoom) {
          return;
      }

      var nwTilePoint = new L.Point(
              Math.floor(bounds.min.x / tileSize),
              Math.floor(bounds.min.y / tileSize)),

          seTilePoint = new L.Point(
              Math.floor(bounds.max.x / tileSize),
              Math.floor(bounds.max.y / tileSize)),

          tileBounds = new L.Bounds(nwTilePoint, seTilePoint);

      this._addTilesFromCenterOut(tileBounds);
      this._removeOtherTiles(tileBounds);
  },

  _removeTiles: function (bounds) {
      for (var key in this._tiles) {
        this._removeTile(key);
      }
  },

  _reloadTiles: function() {
    this._removeTiles();
    this._updateTiles();
  },

  _removeOtherTiles: function (bounds) {
      var kArr, x, y, z, key;
      var zoom = this._map.getZoom();

      for (key in this._tiles) {
          if (this._tiles.hasOwnProperty(key)) {
              kArr = key.split(':');
              x = parseInt(kArr[0], 10);
              y = parseInt(kArr[1], 10);
              z = parseInt(kArr[2], 10);

              // remove tile if it's out of bounds
              if (zoom !== z || x < bounds.min.x || x > bounds.max.x || y < bounds.min.y || y > bounds.max.y) {
                  this._removeTile(key);
              }
          }
      }
  },

  _removeTile: function (key) {
      this.fire('tileRemoved', this._tiles[key]);
      delete this._tiles[key];
      delete this._tilesLoading[key];
  },

  _tileKey: function(tilePoint) {
    return tilePoint.x + ':' + tilePoint.y + ':' + tilePoint.zoom;
  },

  _tileShouldBeLoaded: function (tilePoint) {
      var k = this._tileKey(tilePoint);
      return !(k in this._tiles) && !(k in this._tilesLoading);
  },

  _tileLoaded: function(tilePoint, tileData) {
    this._tilesToLoad--;
    var k = tilePoint.x + ':' + tilePoint.y + ':' + tilePoint.zoom
    this._tiles[k] = tileData;
    delete this._tilesLoading[k];
    if(this._tilesToLoad === 0) {
      this.fire("tilesLoaded");
    }
  },

  getTilePos: function (tilePoint) {
    tilePoint = new L.Point(tilePoint.x, tilePoint.y);
    var origin = this._map._getNewTopLeftPoint(this._map.getCenter()),
        tileSize = this.options.tileSize;

    return tilePoint.multiplyBy(tileSize).subtract(origin);
  },

  _addTilesFromCenterOut: function (bounds) {
      var queue = [],
          center = bounds.getCenter(),
          zoom = this._map.getZoom();

      var j, i, point;

      for (j = bounds.min.y; j <= bounds.max.y; j++) {
          for (i = bounds.min.x; i <= bounds.max.x; i++) {
              point = new L.Point(i, j);
              point.zoom =  zoom;

              if (this._tileShouldBeLoaded(point)) {
                  queue.push(point);
              }
          }
      }

      var tilesToLoad = queue.length;

      if (tilesToLoad === 0) { return; }

      // load tiles in order of their distance to center
      queue.sort(function (a, b) {
          return a.distanceTo(center) - b.distanceTo(center);
      });

      this._tilesToLoad += tilesToLoad;

      for (i = 0; i < tilesToLoad; i++) {
        var t = queue[i];
        var k = this._tileKey(t);
        this._tilesLoading[k] = t;
        this.fire('tileAdded', t);
      }
      this.fire("tilesLoading");

  }
}

} //L defined
if(typeof(L) !== 'undefined') {
/**
 * full canvas layer implementation for Leaflet
 */

L.CanvasLayer = L.Class.extend({

  includes: [L.Mixin.Events, L.Mixin.TileLoader],

  options: {
      minZoom: 0,
      maxZoom: 28,
      tileSize: 256,
      subdomains: 'abc',
      errorTileUrl: '',
      attribution: '',
      zoomOffset: 0,
      opacity: 1,
      unloadInvisibleTiles: L.Browser.mobile,
      updateWhenIdle: L.Browser.mobile,
      tileLoader: false, // installs tile loading events
      zoomAnimation: true
  },

  initialize: function (options) {
    var self = this;
    options = options || {};
    //this.project = this._project.bind(this);
    this.render = this.render.bind(this);
    L.Util.setOptions(this, options);
    this._canvas = this._createCanvas();
    // backCanvas for zoom animation
    if (this.options.zoomAnimation) {
      this._backCanvas = this._createCanvas();
    }
    this._ctx = this._canvas.getContext('2d');
    this.currentAnimationFrame = -1;
    this.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                                window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || function(callback) {
                                    return window.setTimeout(callback, 1000 / 60);
                                };
    this.cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame ||
                                window.webkitCancelAnimationFrame || window.msCancelAnimationFrame || function(id) { clearTimeout(id); };
  },

  _createCanvas: function() {
    var canvas;
    canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = 0;
    canvas.style.left = 0;
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = this.options.zIndex || 0;
    var className = 'leaflet-tile-container';
    if (this.options.zoomAnimation) {
      className += ' leaflet-zoom-animated';
    }
    canvas.setAttribute('class', className);
    return canvas;
  },

  onAdd: function (map) {
    this._map = map;

    // add container with the canvas to the tile pane
    // the container is moved in the oposite direction of the 
    // map pane to keep the canvas always in (0, 0)
    var tilePane = this._map._panes.tilePane;
    var _container = L.DomUtil.create('div', 'leaflet-layer');
    _container.appendChild(this._canvas);
    if (this.options.zoomAnimation) {
      _container.appendChild(this._backCanvas);
      this._backCanvas.style.display = 'none';
    }
    tilePane.appendChild(_container);

    this._container = _container;

    // hack: listen to predrag event launched by dragging to
    // set container in position (0, 0) in screen coordinates
    map.dragging._draggable.on('predrag', function() {
      var d = map.dragging._draggable;
      L.DomUtil.setPosition(this._canvas, { x: -d._newPos.x, y: -d._newPos.y });
    }, this);

    map.on({ 'viewreset': this._reset }, this);
    map.on('move', this.render, this);
    map.on('resize', this._reset, this);

    if (this.options.zoomAnimation) {
      map.on({
        'zoomanim': this._animateZoom,
        'zoomend': this._endZoomAnim,
        'moveend': this._reset
      }, this);
    }

    if(this.options.tileLoader) {
      this._initTileLoader();
    }

    this._reset();
  },

  _animateZoom: function (e) {
    if (!this._animating) {
        this._animating = true;
    }
    var back = this._backCanvas;

    back.width = this._canvas.width;
    back.height = this._canvas.height;

    // paint current canvas in back canvas with trasnformation
    var pos = this._canvas._leaflet_pos || { x: 0, y: 0 };
    back.getContext('2d').drawImage(this._canvas, 0, 0);

    L.DomUtil.setPosition(back, L.DomUtil.getPosition(this._canvas));

    // hide original
    this._canvas.style.display = 'none';
    back.style.display = 'block';
    var map = this._map;
    var scale = map.getZoomScale(e.zoom);
    var newCenter = map._latLngToNewLayerPoint(map.getCenter(), e.zoom, e.center);
    var oldCenter = map._latLngToNewLayerPoint(e.center, e.zoom, e.center);

    var origin = {
      x:  newCenter.x - oldCenter.x + pos.x,
      y:  newCenter.y - oldCenter.y + pos.y,
    };

    var bg = back;
    var transform = L.DomUtil.TRANSFORM;
    setTimeout(function() {
      bg.style[transform] = L.DomUtil.getTranslateString(origin) + ' scale(' + e.scale + ') ';
    }, 0)
  },

  _endZoomAnim: function () {
    this._animating = false;
    this._canvas.style.display = 'block';
    this._backCanvas.style.display = 'none';
    this._backCanvas.style[L.DomUtil.TRANSFORM] = '';
  },

  getCanvas: function() {
    return this._canvas;
  },

  getAttribution: function() {
    return this.options.attribution;
  },

  draw: function() {
    return this._reset();
  },

  onRemove: function (map) {
    this._container.parentNode.removeChild(this._container);
    map.off({
      'viewreset': this._reset,
      'move': this._render,
      'moveend': this._reset,
      'resize': this._reset,
      'zoomanim': this._animateZoom,
      'zoomend': this._endZoomAnim
    }, this);
  },

  addTo: function (map) {
    map.addLayer(this);
    return this;
  },

  setOpacity: function (opacity) {
    this.options.opacity = opacity;
    this._updateOpacity();
    return this;
  },

  setZIndex: function(zIndex) {
    this._canvas.style.zIndex = zIndex;
    if (this.options.zoomAnimation) {
      this._backCanvas.style.zIndex = zIndex;
    }
  },

  bringToFront: function () {
    return this;
  },

  bringToBack: function () {
    return this;
  },

  _reset: function () {
    var size = this._map.getSize();
    this._canvas.width = size.x;
    this._canvas.height = size.y;

    // fix position
    var pos = L.DomUtil.getPosition(this._map.getPanes().mapPane);
    if (pos) {
      L.DomUtil.setPosition(this._canvas, { x: -pos.x, y: -pos.y });
    }
    this.onResize();
    this._render();
  },

  /*
  _project: function(x) {
    var point = this._map.latLngToLayerPoint(new L.LatLng(x[1], x[0]));
    return [point.x, point.y];
  },
  */

  _updateOpacity: function () { },

  _render: function() {
    if (this.currentAnimationFrame >= 0) {
      this.cancelAnimationFrame.call(window, this.currentAnimationFrame);
    }
    this.currentAnimationFrame = this.requestAnimationFrame.call(window, this.render);
  },

  // use direct: true if you are inside an animation frame call
  redraw: function(direct) {
    if (direct) {
      this.render();
    } else {
      this._render();
    }
  },

  onResize: function() {
  },

  render: function() {
    throw new Error('render function should be implemented');
  }

});

} //L defined
if(typeof(L) !== 'undefined') {
/**
 * torque layer
 */
L.TorqueLayer = L.CanvasLayer.extend({

  providers: {
    'sql_api': torque.providers.json,
    'url_template': torque.providers.jsonarray,
    'windshaft': torque.providers.windshaft
  },

  renderers: {
    'point': torque.renderer.Point,
    'pixel': torque.renderer.Rectangle
  },

  initialize: function(options) {
    var self = this;
    if (!torque.isBrowserSupported()) {
      throw new Error("browser is not supported by torque");
    }
    options.tileLoader = true;
    this.key = 0;
    if (options.cartocss) {
      _.extend(options, torque.common.TorqueLayer.optionsFromCartoCSS(options.cartocss));
    }

    options.resolution = options.resolution || 2;
    options.steps = options.steps || 100;
    options.visible = options.visible === undefined ? true: options.visible;
    this.hidden = !options.visible;

    this.animator = new torque.Animator(function(time) {
      var k = time | 0;
      if(self.key !== k) {
        self.setKey(k, { direct: true });
      }
    }, options);

    this.play = this.animator.start.bind(this.animator);
    this.stop = this.animator.stop.bind(this.animator);
    this.pause = this.animator.pause.bind(this.animator);
    this.toggle = this.animator.toggle.bind(this.animator);
    this.setDuration = this.animator.duration.bind(this.animator);
    this.isRunning = this.animator.isRunning.bind(this.animator);


    L.CanvasLayer.prototype.initialize.call(this, options);

    this.options.renderer = this.options.renderer || 'point';
    this.options.provider = this.options.provider || 'windshaft';

    options.ready = function() {
      self.fire("change:bounds", {
        bounds: self.provider.getBounds()
      });
      self.animator.steps(self.provider.getSteps());
      self.animator.rescale();
      self.fire('change:steps', {
        steps: self.provider.getSteps()
      });
      self.setKey(self.key);
    };

    this.provider = new this.providers[this.options.provider](options);
    this.renderer = new this.renderers[this.options.renderer](this.getCanvas(), options);


    // for each tile shown on the map request the data
    this.on('tileAdded', function(t) {
      var tileData = this.provider.getTileData(t, t.zoom, function(tileData) {
        // don't load tiles that are not being shown
        if (t.zoom !== self._map.getZoom()) return;
        self._tileLoaded(t, tileData);
        if (tileData) {
          self.redraw();
        }
      });
    }, this);


  },

  _clearCaches: function() {
    this.renderer && this.renderer.clearSpriteCache();
  },

  onAdd: function (map) {
    map.on({
      'zoomend': this._clearCaches,
      'zoomstart': this._pauseOnZoom,
    }, this);

    map.on({
      'zoomend': this._resumeOnZoom
    }, this);
    L.CanvasLayer.prototype.onAdd.call(this, map);
  },

  onRemove: function(map) {
    this._removeTileLoader();
    map.off({
      'zoomend': this._clearCaches,
      'zoomstart': this._pauseOnZoom,
    }, this);
    map.off({
      'zoomend': this._resumeOnZoom
    }, this);
    L.CanvasLayer.prototype.onRemove.call(this, map);
  },

  _pauseOnZoom: function() {
    this.wasRunning = this.isRunning();
    if (this.wasRunning) {
      this.pause();
    }
  },

  _resumeOnZoom: function() {
    if (this.wasRunning) {
      this.play();
    }
  },

  hide: function() {
    if(this.hidden) return this;
    this.pause();
    this.clear();
    this.hidden = true;
    return this;
  },

  show: function() {
    if(!this.hidden) return this;
    this.hidden = false;
    this.play();
    return this;
  },

  setSQL: function(sql) {
    if (!this.provider || !this.provider.setSQL) {
      throw new Error("this provider does not support SQL");
    }
    this.provider.setSQL(sql);
    this._reloadTiles();
    return this;
  },

  setBlendMode: function(_) {
    this.renderer.setBlendMode(_);
    this.redraw();
  },

  setSteps: function(steps) {
    this.provider.setSteps(steps);
    this._reloadTiles();
  },

  setColumn: function(column, isTime) {
    this.provider.setColumn(column, isTime);
    this._reloadTiles();
  },

  getTimeBounds: function() {
    return this.provider && this.provider.getKeySpan();
  },

  clear: function() {
    var canvas = this.getCanvas();
    canvas.width = canvas.width;
  },

  /**
   * render the selectef key
   * don't call this function directly, it's called by
   * requestAnimationFrame. Use redraw to refresh it
   */
  render: function() {
    if(this.hidden) return;
    var t, tile, pos;
    var canvas = this.getCanvas();
    canvas.width = canvas.width;
    var ctx = canvas.getContext('2d');

    for(t in this._tiles) {
      tile = this._tiles[t];
      if (tile) {
        pos = this.getTilePos(tile.coord);
        ctx.setTransform(1, 0, 0, 1, pos.x, pos.y);
        this.renderer.renderTile(tile, this.key, pos.x, pos.y);
      }
    }

  },

  /**
   * set key to be shown. If it's a single value
   * it renders directly, if it's an array it renders
   * accumulated
   */
  setKey: function(key, options) {
    this.key = key;
    this.animator.step(key);
    this.redraw(options && options.direct);
    this.fire('change:time', { time: this.getTime(), step: this.key });
  },

  /**
   * helper function, does the same than ``setKey`` but only 
   * accepts scalars.
   */
  setStep: function(time) {
    if(time === undefined || time.length !== undefined) {
      throw new Error("setTime only accept scalars");
    }
    this.setKey(time);
  },

  /**
   * transform from animation step to Date object 
   * that contains the animation time
   *
   * ``step`` should be between 0 and ``steps - 1`` 
   */
  stepToTime: function(step) {
    var times = this.provider.getKeySpan();
    var time = times.start + (times.end - times.start)*(step/this.provider.getSteps());
    return new Date(time);
  },

  getStep: function() {
    return this.key;
  },

  /**
   * returns the animation time defined by the data
   * in the defined column. Date object
   */
  getTime: function() {
    return this.stepToTime(this.key);
  },

  /**
   * returns an object with the start and end times
   */
  getTimeSpan: function() {
    var times = this.provider.getKeySpan();
  },

  /**
   * set the cartocss for the current renderer
   */
  setCartoCSS: function(cartocss) {
    if (!this.renderer) throw new Error('renderer is not valid');
    var shader = new carto.RendererJS().render(cartocss);
    this.renderer.setShader(shader);

    // provider options
    var options = torque.common.TorqueLayer.optionsFromLayer(shader.findLayer({ name: 'Map' }));
    this.provider.setCartoCSS && this.provider.setCartoCSS(cartocss);
    if(this.provider.setOptions(options)) {
      this._reloadTiles();
    }

    _.extend(this.options, options);

    // animator options
    if (options.animationDuration) {
      this.animator.duration(options.animationDuration);
    }

    this.redraw();
    return this;
  }

});

} //L defined

(function() {

if(typeof(google) == "undefined" || typeof(google.maps) == "undefined")
  return;

var GMapsTorqueLayerView = function(layerModel, gmapsMap) {

  var extra = layerModel.get('extra_params');
  layerModel.attributes.attribution = cdb.config.get('cartodb_attributions');
  cdb.geo.GMapsLayerView.call(this, layerModel, this, gmapsMap);
  torque.GMapsTorqueLayer.call(this, {
      table: layerModel.get('table_name'),
      user: layerModel.get('user_name'),
      column: layerModel.get('property'),
      blendmode: layerModel.get('torque-blend-mode'),
      resolution: 1,
      //TODO: manage time columns
      countby: 'count(cartodb_id)',
      sql_api_domain: layerModel.get('sql_api_domain'),
      sql_api_protocol: layerModel.get('sql_api_protocol'),
      sql_api_port: layerModel.get('sql_api_port'),
      tiler_protocol: layerModel.get('tiler_protocol'),
      tiler_domain: layerModel.get('tiler_domain'),
      tiler_port: layerModel.get('tiler_port'),
      stat_tag: layerModel.get('stat_tag'),
      animationDuration: layerModel.get('torque-duration'),
      steps: layerModel.get('torque-steps'),
      sql: layerModel.get('query'),
      visible: layerModel.get('visible'),
      extra_params: {
        api_key: extra ? extra.map_key: ''
      },
      map: gmapsMap,
      cartodb_logo: layerModel.get('cartodb_logo'),
      attribution: layerModel.get('attribution'),
      cdn_url: layerModel.get('no_cdn') ? null: (layerModel.get('cdn_url') || cdb.CDB_HOST),
      cartocss: layerModel.get('cartocss') || layerModel.get('tile_style'),
      named_map: layerModel.get('named_map'),
      auth_token: layerModel.get('auth_token')
  });

  //this.setCartoCSS(this.model.get('tile_style'));
  if (layerModel.get('visible')) {
    this.play();
  }

};

_.extend(
  GMapsTorqueLayerView.prototype,
  cdb.geo.GMapsLayerView.prototype,
  torque.GMapsTorqueLayer.prototype,
  {

  _update: function() {
    var changed = this.model.changedAttributes();
    if(changed === false) return;
    changed.tile_style && this.setCartoCSS(this.model.get('tile_style'));
    'query' in changed && this.setSQL(this.model.get('query'));
    if ('visible' in changed) 
      this.model.get('visible') ? this.show(): this.hide();
  },

  refreshView: function() {
    //TODO: update screen
  },

  onAdd: function() {
    torque.GMapsTorqueLayer.prototype.onAdd.apply(this);
    // Add CartoDB logo
    if (this.options.cartodb_logo != false)
      cdb.geo.common.CartoDBLogo.addWadus({ left: 74, bottom:8 }, 2000, this.map.getDiv())
  },

  onTilesLoaded: function() {
    //this.trigger('load');
    Backbone.Events.trigger.call(this, 'load');
  },

  onTilesLoading: function() {
    Backbone.Events.trigger.call(this, 'loading');
  }

});


cdb.geo.GMapsTorqueLayerView = GMapsTorqueLayerView;


})();

(function() {

if(typeof(L) === "undefined") 
  return;

/**
 * leaflet torque layer
 */
var LeafLetTorqueLayer = L.TorqueLayer.extend({

  initialize: function(layerModel, leafletMap) {
    var extra = layerModel.get('extra_params');
    layerModel.attributes.attribution = cdb.config.get('cartodb_attributions');
    // initialize the base layers
    L.TorqueLayer.prototype.initialize.call(this, {
      table: layerModel.get('table_name'),
      user: layerModel.get('user_name'),
      column: layerModel.get('property'),
      blendmode: layerModel.get('torque-blend-mode'),
      resolution: 1,
      //TODO: manage time columns
      countby: 'count(cartodb_id)',
      sql_api_domain: layerModel.get('sql_api_domain'),
      sql_api_protocol: layerModel.get('sql_api_protocol'),
      sql_api_port: layerModel.get('sql_api_port'),
      tiler_protocol: layerModel.get('tiler_protocol'),
      tiler_domain: layerModel.get('tiler_domain'),
      tiler_port: layerModel.get('tiler_port'),
      stat_tag: layerModel.get('stat_tag'),
      animationDuration: layerModel.get('torque-duration'),
      steps: layerModel.get('torque-steps'),
      sql: layerModel.get('query'),
      visible: layerModel.get('visible'),
      extra_params: {
        api_key: extra ? extra.map_key: ''
      },
      cartodb_logo: layerModel.get('cartodb_logo'),
      attribution: layerModel.get('attribution'),
      cdn_url: layerModel.get('no_cdn') ? null: (layerModel.get('cdn_url') || cdb.CDB_HOST),
      cartocss: layerModel.get('cartocss') || layerModel.get('tile_style'),
      named_map: layerModel.get('named_map'),
      auth_token: layerModel.get('auth_token')
    });

    cdb.geo.LeafLetLayerView.call(this, layerModel, this, leafletMap);

    // match leaflet events with backbone events
    this.fire = this.trigger;

    //this.setCartoCSS(layerModel.get('tile_style'));
    if (layerModel.get('visible')) {
      this.play();
    }

    this.bind('tilesLoaded', function() {
      this.trigger('load');
    }, this);

    this.bind('tilesLoading', function() {
      this.trigger('loading');
    }, this);

  },

  onAdd: function(map) {
    L.TorqueLayer.prototype.onAdd.apply(this, [map]);
    // Add CartoDB logo
    if (this.options.cartodb_logo != false)
      cdb.geo.common.CartoDBLogo.addWadus({ left:8, bottom:8 }, 0, map._container)
  },

  _modelUpdated: function(model) {
    var changed = this.model.changedAttributes();
    if(changed === false) return;
    changed.tile_style && this.setCartoCSS(this.model.get('tile_style'));
    'query' in changed && this.setSQL(this.model.get('query'));

    if ('visible' in changed) 
      this.model.get('visible') ? this.show(): this.hide();

  }



});

_.extend(LeafLetTorqueLayer.prototype, cdb.geo.LeafLetLayerView.prototype);

cdb.geo.LeafLetTorqueLayer = LeafLetTorqueLayer;

})();
cdb.geo.ui.TimeSlider = cdb.geo.ui.InfoBox.extend({

  DEFAULT_OFFSET_TOP: 30,
  className: 'cartodb-timeslider',

  defaultTemplate:
    " <ul> " +
    "   <li class='controls'><a href='#/stop' class='button stop'>pause</a></li>" +
    "   <li class='time'><p class='value'></p></li>" +
    "   <li class='last'><div class='slider-wrapper'><div class='slider'></div></div></li>" +
    " </ul> "
  ,

  events: {
    "click .button":  "toggleTime",
    "click .time":    "_onClickTime",
    "dragstart":      "_stopPropagation",
    "mousedown":      "_stopPropagation",
    "touchstart":     "_stopPropagation",
    "MSPointerDown":  "_stopPropagation",
    "dblclick":       "_stopPropagation",
    "mousewheel":     "_stopPropagation",
    "DOMMouseScroll": "_stopPropagation",
    "click":          "_stopPropagation"
  },

  initialize: function() {
    _.bindAll(this, '_stop', '_start', '_slide', '_bindLayer', '_unbindLayer', 'updateSliderRange', 'updateSlider', 'updateTime');
    var self = this;
    this.options.template = this.options.template || this.defaultTemplate;
    this.options.position = 'bottom|left';
    this.options.width = null;

    // Control variable to know if the layer was
    // running before touching the slider
    this.wasRunning = false;

    this._bindLayer(this.options.layer);
    this.on('clean', this._unbindLayer);
    cdb.geo.ui.InfoBox.prototype.initialize.call(this);

  },

  setLayer: function(layer) {
    this._unbindLayer();
    this._bindLayer(layer);
    this._initSlider();
  },

  _bindLayer: function(layer) {
    this.torqueLayer = layer;
    this.torqueLayer.on('change:time', this.updateSlider);
    this.torqueLayer.on('change:time', this.updateTime);
    this.torqueLayer.on('change:steps', this.updateSliderRange);
    return this;
  },

  _unbindLayer: function() {
    this.torqueLayer.off('change:time', this.updateSlider);
    this.torqueLayer.off('change:time', this.updateTime);
    this.torqueLayer.off('change:steps', this.updateSliderRange);
    return this;
  },

  updateSlider: function(changes) {
    this.$(".slider" ).slider({ value: changes.step });
  },

  updateSliderRange: function(changes) {
    this.$(".slider" ).slider({ max: changes.steps });
  },

  // each time time changes, move the slider
  updateTime: function(changes) {
    var self = this;
    var tb = self.torqueLayer.getTimeBounds();
    if (!tb) return;
    if (tb.columnType === 'date' || this.options.force_format_date) {
      if (tb && tb.start !== undefined) {
        var f = self.options.formatter || self.formaterForRange(tb.start, tb.end);
        // avoid showing invalid dates
        if (!_.isNaN(changes.time.getYear())) {
          self.$('.value').text(f(changes.time));
        }
      }
    } else {
        self.$('.value').text(changes.step);
    }
  },

  formatter: function(_) {
    this.options.formatter = _;
  },

  formaterForRange: function(start, end) {
    start = start.getTime ? start.getTime(): start;
    end = end.getTime ? end.getTime(): end;
    var span = (end - start)/1000;
    var ONE_DAY = 3600*24;
    var ONE_YEAR = ONE_DAY * 31 * 12;
    function pad(n) { return n < 10 ? '0' + n : n; };
    // lest than a day
    if (span < ONE_DAY)   return function(t) { return pad(t.getUTCHours()) + ":" + pad(t.getUTCMinutes()); };
    if (span < ONE_YEAR) return function(t) { return pad(t.getUTCMonth() + 1) + "/" + pad(t.getUTCDate()) + "/" + pad(t.getUTCFullYear()); };
    return function(t) { return pad(t.getUTCMonth() + 1) + "/" + pad(t.getUTCFullYear()); };
  },

  _slide: function(e, ui) {
    this.killEvent(e);
    var step = ui.value;
    this.torqueLayer.setStep(step);
  },

  _start: function(e, ui) {
    if(this.torqueLayer.isRunning()) {
      this.wasRunning = true;
      this.toggleTime();
    }
  },

  _stop: function(e, ui) {
    if (this.wasRunning) {
      this.toggleTime()
    }

    this.wasRunning = false;
  },

  _initSlider: function() {
    var torqueLayer = this.torqueLayer;
    var slider = this.$(".slider");
    slider.slider({
      range: 'min',
      min: 0,
      max: this.torqueLayer.options.steps,
      value: 0,
      step: 1, //
      value: this.torqueLayer.getStep(),
      stop: this._stop,
      start: this._start,
      slide: this._slide
    });
  },

  toggleTime: function(e) {
    this.killEvent(e);
    this.torqueLayer.toggle();
    this.$('.button')
      [(this.torqueLayer.isRunning() ? 'addClass': 'removeClass')]('stop')
      .attr('href','#/' + (this.torqueLayer.isRunning() ? 'pause': 'play'))
      .html(this.torqueLayer.isRunning() ? 'pause': 'play');
  },

  enable: function() {},

  _stopPropagation: function(ev) {
    ev.stopPropagation();
  },

   _onClickTime: function() {
    this.trigger("time_clicked", this);
  },

  render: function() {
    cdb.geo.ui.InfoBox.prototype.render.apply(this, arguments);
    this._initSlider();
    return this;
  }

});

/*!
 * jQuery UI 1.8.23
 *
 * Copyright 2012, AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * http://docs.jquery.com/UI
 */
(function( $, undefined ) {

// prevent duplicate loading
// this is only a problem because we proxy existing functions
// and we don't want to double proxy them
$.ui = $.ui || {};
if ( $.ui.version ) {
	return;
}

$.extend( $.ui, {
	version: "1.8.23",

	keyCode: {
		ALT: 18,
		BACKSPACE: 8,
		CAPS_LOCK: 20,
		COMMA: 188,
		COMMAND: 91,
		COMMAND_LEFT: 91, // COMMAND
		COMMAND_RIGHT: 93,
		CONTROL: 17,
		DELETE: 46,
		DOWN: 40,
		END: 35,
		ENTER: 13,
		ESCAPE: 27,
		HOME: 36,
		INSERT: 45,
		LEFT: 37,
		MENU: 93, // COMMAND_RIGHT
		NUMPAD_ADD: 107,
		NUMPAD_DECIMAL: 110,
		NUMPAD_DIVIDE: 111,
		NUMPAD_ENTER: 108,
		NUMPAD_MULTIPLY: 106,
		NUMPAD_SUBTRACT: 109,
		PAGE_DOWN: 34,
		PAGE_UP: 33,
		PERIOD: 190,
		RIGHT: 39,
		SHIFT: 16,
		SPACE: 32,
		TAB: 9,
		UP: 38,
		WINDOWS: 91 // COMMAND
	}
});

// plugins
$.fn.extend({
	propAttr: $.fn.prop || $.fn.attr,

	_focus: $.fn.focus,
	focus: function( delay, fn ) {
		return typeof delay === "number" ?
			this.each(function() {
				var elem = this;
				setTimeout(function() {
					$( elem ).focus();
					if ( fn ) {
						fn.call( elem );
					}
				}, delay );
			}) :
			this._focus.apply( this, arguments );
	},

	scrollParent: function() {
		var scrollParent;
		if (($.browser.msie && (/(static|relative)/).test(this.css('position'))) || (/absolute/).test(this.css('position'))) {
			scrollParent = this.parents().filter(function() {
				return (/(relative|absolute|fixed)/).test($.curCSS(this,'position',1)) && (/(auto|scroll)/).test($.curCSS(this,'overflow',1)+$.curCSS(this,'overflow-y',1)+$.curCSS(this,'overflow-x',1));
			}).eq(0);
		} else {
			scrollParent = this.parents().filter(function() {
				return (/(auto|scroll)/).test($.curCSS(this,'overflow',1)+$.curCSS(this,'overflow-y',1)+$.curCSS(this,'overflow-x',1));
			}).eq(0);
		}

		return (/fixed/).test(this.css('position')) || !scrollParent.length ? $(document) : scrollParent;
	},

	zIndex: function( zIndex ) {
		if ( zIndex !== undefined ) {
			return this.css( "zIndex", zIndex );
		}

		if ( this.length ) {
			var elem = $( this[ 0 ] ), position, value;
			while ( elem.length && elem[ 0 ] !== document ) {
				// Ignore z-index if position is set to a value where z-index is ignored by the browser
				// This makes behavior of this function consistent across browsers
				// WebKit always returns auto if the element is positioned
				position = elem.css( "position" );
				if ( position === "absolute" || position === "relative" || position === "fixed" ) {
					// IE returns 0 when zIndex is not specified
					// other browsers return a string
					// we ignore the case of nested elements with an explicit value of 0
					// <div style="z-index: -10;"><div style="z-index: 0;"></div></div>
					value = parseInt( elem.css( "zIndex" ), 10 );
					if ( !isNaN( value ) && value !== 0 ) {
						return value;
					}
				}
				elem = elem.parent();
			}
		}

		return 0;
	},

	disableSelection: function() {
		return this.bind( ( $.support.selectstart ? "selectstart" : "mousedown" ) +
			".ui-disableSelection", function( event ) {
				event.preventDefault();
			});
	},

	enableSelection: function() {
		return this.unbind( ".ui-disableSelection" );
	}
});

// support: jQuery <1.8
if ( !$( "<a>" ).outerWidth( 1 ).jquery ) {
	$.each( [ "Width", "Height" ], function( i, name ) {
		var side = name === "Width" ? [ "Left", "Right" ] : [ "Top", "Bottom" ],
			type = name.toLowerCase(),
			orig = {
				innerWidth: $.fn.innerWidth,
				innerHeight: $.fn.innerHeight,
				outerWidth: $.fn.outerWidth,
				outerHeight: $.fn.outerHeight
			};

		function reduce( elem, size, border, margin ) {
			$.each( side, function() {
				size -= parseFloat( $.curCSS( elem, "padding" + this, true) ) || 0;
				if ( border ) {
					size -= parseFloat( $.curCSS( elem, "border" + this + "Width", true) ) || 0;
				}
				if ( margin ) {
					size -= parseFloat( $.curCSS( elem, "margin" + this, true) ) || 0;
				}
			});
			return size;
		}

		$.fn[ "inner" + name ] = function( size ) {
			if ( size === undefined ) {
				return orig[ "inner" + name ].call( this );
			}

			return this.each(function() {
				$( this ).css( type, reduce( this, size ) + "px" );
			});
		};

		$.fn[ "outer" + name] = function( size, margin ) {
			if ( typeof size !== "number" ) {
				return orig[ "outer" + name ].call( this, size );
			}

			return this.each(function() {
				$( this).css( type, reduce( this, size, true, margin ) + "px" );
			});
		};
	});
}

// selectors
function focusable( element, isTabIndexNotNaN ) {
	var nodeName = element.nodeName.toLowerCase();
	if ( "area" === nodeName ) {
		var map = element.parentNode,
			mapName = map.name,
			img;
		if ( !element.href || !mapName || map.nodeName.toLowerCase() !== "map" ) {
			return false;
		}
		img = $( "img[usemap=#" + mapName + "]" )[0];
		return !!img && visible( img );
	}
	return ( /input|select|textarea|button|object/.test( nodeName )
		? !element.disabled
		: "a" == nodeName
			? element.href || isTabIndexNotNaN
			: isTabIndexNotNaN)
		// the element and all of its ancestors must be visible
		&& visible( element );
}

function visible( element ) {
	return !$( element ).parents().andSelf().filter(function() {
		return $.curCSS( this, "visibility" ) === "hidden" ||
			$.expr.filters.hidden( this );
	}).length;
}

$.extend( $.expr[ ":" ], {
	data: $.expr.createPseudo ?
		$.expr.createPseudo(function( dataName ) {
			return function( elem ) {
				return !!$.data( elem, dataName );
			};
		}) :
		// support: jQuery <1.8
		function( elem, i, match ) {
			return !!$.data( elem, match[ 3 ] );
		},

	focusable: function( element ) {
		return focusable( element, !isNaN( $.attr( element, "tabindex" ) ) );
	},

	tabbable: function( element ) {
		var tabIndex = $.attr( element, "tabindex" ),
			isTabIndexNaN = isNaN( tabIndex );
		return ( isTabIndexNaN || tabIndex >= 0 ) && focusable( element, !isTabIndexNaN );
	}
});

// support
$(function() {
	var body = document.body,
		div = body.appendChild( div = document.createElement( "div" ) );

	// access offsetHeight before setting the style to prevent a layout bug
	// in IE 9 which causes the elemnt to continue to take up space even
	// after it is removed from the DOM (#8026)
	div.offsetHeight;

	$.extend( div.style, {
		minHeight: "100px",
		height: "auto",
		padding: 0,
		borderWidth: 0
	});

	$.support.minHeight = div.offsetHeight === 100;
	$.support.selectstart = "onselectstart" in div;

	// set display to none to avoid a layout bug in IE
	// http://dev.jquery.com/ticket/4014
	body.removeChild( div ).style.display = "none";
});

// jQuery <1.4.3 uses curCSS, in 1.4.3 - 1.7.2 curCSS = css, 1.8+ only has css
if ( !$.curCSS ) {
	$.curCSS = $.css;
}





// deprecated
$.extend( $.ui, {
	// $.ui.plugin is deprecated.  Use the proxy pattern instead.
	plugin: {
		add: function( module, option, set ) {
			var proto = $.ui[ module ].prototype;
			for ( var i in set ) {
				proto.plugins[ i ] = proto.plugins[ i ] || [];
				proto.plugins[ i ].push( [ option, set[ i ] ] );
			}
		},
		call: function( instance, name, args ) {
			var set = instance.plugins[ name ];
			if ( !set || !instance.element[ 0 ].parentNode ) {
				return;
			}
	
			for ( var i = 0; i < set.length; i++ ) {
				if ( instance.options[ set[ i ][ 0 ] ] ) {
					set[ i ][ 1 ].apply( instance.element, args );
				}
			}
		}
	},
	
	// will be deprecated when we switch to jQuery 1.4 - use jQuery.contains()
	contains: function( a, b ) {
		return document.compareDocumentPosition ?
			a.compareDocumentPosition( b ) & 16 :
			a !== b && a.contains( b );
	},
	
	// only used by resizable
	hasScroll: function( el, a ) {
	
		//If overflow is hidden, the element might have extra content, but the user wants to hide it
		if ( $( el ).css( "overflow" ) === "hidden") {
			return false;
		}
	
		var scroll = ( a && a === "left" ) ? "scrollLeft" : "scrollTop",
			has = false;
	
		if ( el[ scroll ] > 0 ) {
			return true;
		}
	
		// TODO: determine which cases actually cause this to happen
		// if the element doesn't have the scroll set, see if it's possible to
		// set the scroll
		el[ scroll ] = 1;
		has = ( el[ scroll ] > 0 );
		el[ scroll ] = 0;
		return has;
	},
	
	// these are odd functions, fix the API or move into individual plugins
	isOverAxis: function( x, reference, size ) {
		//Determines when x coordinate is over "b" element axis
		return ( x > reference ) && ( x < ( reference + size ) );
	},
	isOver: function( y, x, top, left, height, width ) {
		//Determines when x, y coordinates is over "b" element
		return $.ui.isOverAxis( y, top, height ) && $.ui.isOverAxis( x, left, width );
	}
});

})( jQuery );
/*!
 * jQuery UI Widget 1.8.23
 *
 * Copyright 2012, AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * http://docs.jquery.com/UI/Widget
 */
(function( $, undefined ) {

// jQuery 1.4+
if ( $.cleanData ) {
	var _cleanData = $.cleanData;
	$.cleanData = function( elems ) {
		for ( var i = 0, elem; (elem = elems[i]) != null; i++ ) {
			try {
				$( elem ).triggerHandler( "remove" );
			// http://bugs.jquery.com/ticket/8235
			} catch( e ) {}
		}
		_cleanData( elems );
	};
} else {
	var _remove = $.fn.remove;
	$.fn.remove = function( selector, keepData ) {
		return this.each(function() {
			if ( !keepData ) {
				if ( !selector || $.filter( selector, [ this ] ).length ) {
					$( "*", this ).add( [ this ] ).each(function() {
						try {
							$( this ).triggerHandler( "remove" );
						// http://bugs.jquery.com/ticket/8235
						} catch( e ) {}
					});
				}
			}
			return _remove.call( $(this), selector, keepData );
		});
	};
}

$.widget = function( name, base, prototype ) {
	var namespace = name.split( "." )[ 0 ],
		fullName;
	name = name.split( "." )[ 1 ];
	fullName = namespace + "-" + name;

	if ( !prototype ) {
		prototype = base;
		base = $.Widget;
	}

	// create selector for plugin
	$.expr[ ":" ][ fullName ] = function( elem ) {
		return !!$.data( elem, name );
	};

	$[ namespace ] = $[ namespace ] || {};
	$[ namespace ][ name ] = function( options, element ) {
		// allow instantiation without initializing for simple inheritance
		if ( arguments.length ) {
			this._createWidget( options, element );
		}
	};

	var basePrototype = new base();
	// we need to make the options hash a property directly on the new instance
	// otherwise we'll modify the options hash on the prototype that we're
	// inheriting from
//	$.each( basePrototype, function( key, val ) {
//		if ( $.isPlainObject(val) ) {
//			basePrototype[ key ] = $.extend( {}, val );
//		}
//	});
	basePrototype.options = $.extend( true, {}, basePrototype.options );
	$[ namespace ][ name ].prototype = $.extend( true, basePrototype, {
		namespace: namespace,
		widgetName: name,
		widgetEventPrefix: $[ namespace ][ name ].prototype.widgetEventPrefix || name,
		widgetBaseClass: fullName
	}, prototype );

	$.widget.bridge( name, $[ namespace ][ name ] );
};

$.widget.bridge = function( name, object ) {
	$.fn[ name ] = function( options ) {
		var isMethodCall = typeof options === "string",
			args = Array.prototype.slice.call( arguments, 1 ),
			returnValue = this;

		// allow multiple hashes to be passed on init
		options = !isMethodCall && args.length ?
			$.extend.apply( null, [ true, options ].concat(args) ) :
			options;

		// prevent calls to internal methods
		if ( isMethodCall && options.charAt( 0 ) === "_" ) {
			return returnValue;
		}

		if ( isMethodCall ) {
			this.each(function() {
				var instance = $.data( this, name ),
					methodValue = instance && $.isFunction( instance[options] ) ?
						instance[ options ].apply( instance, args ) :
						instance;
				// TODO: add this back in 1.9 and use $.error() (see #5972)
//				if ( !instance ) {
//					throw "cannot call methods on " + name + " prior to initialization; " +
//						"attempted to call method '" + options + "'";
//				}
//				if ( !$.isFunction( instance[options] ) ) {
//					throw "no such method '" + options + "' for " + name + " widget instance";
//				}
//				var methodValue = instance[ options ].apply( instance, args );
				if ( methodValue !== instance && methodValue !== undefined ) {
					returnValue = methodValue;
					return false;
				}
			});
		} else {
			this.each(function() {
				var instance = $.data( this, name );
				if ( instance ) {
					instance.option( options || {} )._init();
				} else {
					$.data( this, name, new object( options, this ) );
				}
			});
		}

		return returnValue;
	};
};

$.Widget = function( options, element ) {
	// allow instantiation without initializing for simple inheritance
	if ( arguments.length ) {
		this._createWidget( options, element );
	}
};

$.Widget.prototype = {
	widgetName: "widget",
	widgetEventPrefix: "",
	options: {
		disabled: false
	},
	_createWidget: function( options, element ) {
		// $.widget.bridge stores the plugin instance, but we do it anyway
		// so that it's stored even before the _create function runs
		$.data( element, this.widgetName, this );
		this.element = $( element );
		this.options = $.extend( true, {},
			this.options,
			this._getCreateOptions(),
			options );

		var self = this;
		this.element.bind( "remove." + this.widgetName, function() {
			self.destroy();
		});

		this._create();
		this._trigger( "create" );
		this._init();
	},
	_getCreateOptions: function() {
		return $.metadata && $.metadata.get( this.element[0] )[ this.widgetName ];
	},
	_create: function() {},
	_init: function() {},

	destroy: function() {
		this.element
			.unbind( "." + this.widgetName )
			.removeData( this.widgetName );
		this.widget()
			.unbind( "." + this.widgetName )
			.removeAttr( "aria-disabled" )
			.removeClass(
				this.widgetBaseClass + "-disabled " +
				"ui-state-disabled" );
	},

	widget: function() {
		return this.element;
	},

	option: function( key, value ) {
		var options = key;

		if ( arguments.length === 0 ) {
			// don't return a reference to the internal hash
			return $.extend( {}, this.options );
		}

		if  (typeof key === "string" ) {
			if ( value === undefined ) {
				return this.options[ key ];
			}
			options = {};
			options[ key ] = value;
		}

		this._setOptions( options );

		return this;
	},
	_setOptions: function( options ) {
		var self = this;
		$.each( options, function( key, value ) {
			self._setOption( key, value );
		});

		return this;
	},
	_setOption: function( key, value ) {
		this.options[ key ] = value;

		if ( key === "disabled" ) {
			this.widget()
				[ value ? "addClass" : "removeClass"](
					this.widgetBaseClass + "-disabled" + " " +
					"ui-state-disabled" )
				.attr( "aria-disabled", value );
		}

		return this;
	},

	enable: function() {
		return this._setOption( "disabled", false );
	},
	disable: function() {
		return this._setOption( "disabled", true );
	},

	_trigger: function( type, event, data ) {
		var prop, orig,
			callback = this.options[ type ];

		data = data || {};
		event = $.Event( event );
		event.type = ( type === this.widgetEventPrefix ?
			type :
			this.widgetEventPrefix + type ).toLowerCase();
		// the original event may come from any element
		// so we need to reset the target on the new event
		event.target = this.element[ 0 ];

		// copy original event properties over to the new event
		orig = event.originalEvent;
		if ( orig ) {
			for ( prop in orig ) {
				if ( !( prop in event ) ) {
					event[ prop ] = orig[ prop ];
				}
			}
		}

		this.element.trigger( event, data );

		return !( $.isFunction(callback) &&
			callback.call( this.element[0], event, data ) === false ||
			event.isDefaultPrevented() );
	}
};

})( jQuery );
/*!
 * jQuery UI Mouse 1.8.23
 *
 * Copyright 2012, AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * http://docs.jquery.com/UI/Mouse
 *
 * Depends:
 *	jquery.ui.widget.js
 */
(function( $, undefined ) {

var mouseHandled = false;
$( document ).mouseup( function( e ) {
	mouseHandled = false;
});

$.widget("ui.mouse", {
	options: {
		cancel: ':input,option',
		distance: 1,
		delay: 0
	},
	_mouseInit: function() {
		var self = this;

		this.element
			.bind('mousedown.'+this.widgetName, function(event) {
				return self._mouseDown(event);
			})
			.bind('click.'+this.widgetName, function(event) {
				if (true === $.data(event.target, self.widgetName + '.preventClickEvent')) {
				    $.removeData(event.target, self.widgetName + '.preventClickEvent');
					event.stopImmediatePropagation();
					return false;
				}
			});

		this.started = false;
	},

	// TODO: make sure destroying one instance of mouse doesn't mess with
	// other instances of mouse
	_mouseDestroy: function() {
		this.element.unbind('.'+this.widgetName);
		if ( this._mouseMoveDelegate ) {
			$(document)
				.unbind('mousemove.'+this.widgetName, this._mouseMoveDelegate)
				.unbind('mouseup.'+this.widgetName, this._mouseUpDelegate);
		}
	},

	_mouseDown: function(event) {
		// don't let more than one widget handle mouseStart
		if( mouseHandled ) { return };

		// we may have missed mouseup (out of window)
		(this._mouseStarted && this._mouseUp(event));

		this._mouseDownEvent = event;

		var self = this,
			btnIsLeft = (event.which == 1),
			// event.target.nodeName works around a bug in IE 8 with
			// disabled inputs (#7620)
			elIsCancel = (typeof this.options.cancel == "string" && event.target.nodeName ? $(event.target).closest(this.options.cancel).length : false);
		if (!btnIsLeft || elIsCancel || !this._mouseCapture(event)) {
			return true;
		}

		this.mouseDelayMet = !this.options.delay;
		if (!this.mouseDelayMet) {
			this._mouseDelayTimer = setTimeout(function() {
				self.mouseDelayMet = true;
			}, this.options.delay);
		}

		if (this._mouseDistanceMet(event) && this._mouseDelayMet(event)) {
			this._mouseStarted = (this._mouseStart(event) !== false);
			if (!this._mouseStarted) {
				event.preventDefault();
				return true;
			}
		}

		// Click event may never have fired (Gecko & Opera)
		if (true === $.data(event.target, this.widgetName + '.preventClickEvent')) {
			$.removeData(event.target, this.widgetName + '.preventClickEvent');
		}

		// these delegates are required to keep context
		this._mouseMoveDelegate = function(event) {
			return self._mouseMove(event);
		};
		this._mouseUpDelegate = function(event) {
			return self._mouseUp(event);
		};
		$(document)
			.bind('mousemove.'+this.widgetName, this._mouseMoveDelegate)
			.bind('mouseup.'+this.widgetName, this._mouseUpDelegate);

		event.preventDefault();
		
		mouseHandled = true;
		return true;
	},

	_mouseMove: function(event) {
		// IE mouseup check - mouseup happened when mouse was out of window
		if ($.browser.msie && !(document.documentMode >= 9) && !event.button) {
			return this._mouseUp(event);
		}

		if (this._mouseStarted) {
			this._mouseDrag(event);
			return event.preventDefault();
		}

		if (this._mouseDistanceMet(event) && this._mouseDelayMet(event)) {
			this._mouseStarted =
				(this._mouseStart(this._mouseDownEvent, event) !== false);
			(this._mouseStarted ? this._mouseDrag(event) : this._mouseUp(event));
		}

		return !this._mouseStarted;
	},

	_mouseUp: function(event) {
		$(document)
			.unbind('mousemove.'+this.widgetName, this._mouseMoveDelegate)
			.unbind('mouseup.'+this.widgetName, this._mouseUpDelegate);

		if (this._mouseStarted) {
			this._mouseStarted = false;

			if (event.target == this._mouseDownEvent.target) {
			    $.data(event.target, this.widgetName + '.preventClickEvent', true);
			}

			this._mouseStop(event);
		}

		return false;
	},

	_mouseDistanceMet: function(event) {
		return (Math.max(
				Math.abs(this._mouseDownEvent.pageX - event.pageX),
				Math.abs(this._mouseDownEvent.pageY - event.pageY)
			) >= this.options.distance
		);
	},

	_mouseDelayMet: function(event) {
		return this.mouseDelayMet;
	},

	// These are placeholder methods, to be overriden by extending plugin
	_mouseStart: function(event) {},
	_mouseDrag: function(event) {},
	_mouseStop: function(event) {},
	_mouseCapture: function(event) { return true; }
});

})(jQuery);
/*
 * jQuery UI Touch Punch 0.2.2
 *
 * Copyright 2011, Dave Furfero
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Depends:
 *  jquery.ui.widget.js
 *  jquery.ui.mouse.js
 */
(function(b){b.support.touch="ontouchend" in document;if(!b.support.touch){return;}var c=b.ui.mouse.prototype,e=c._mouseInit,a;function d(g,h){if(g.originalEvent.touches.length>1){return;}g.preventDefault();var i=g.originalEvent.changedTouches[0],f=document.createEvent("MouseEvents");f.initMouseEvent(h,true,true,window,1,i.screenX,i.screenY,i.clientX,i.clientY,false,false,false,false,0,null);g.target.dispatchEvent(f);}c._touchStart=function(g){var f=this;if(a||!f._mouseCapture(g.originalEvent.changedTouches[0])){return;}a=true;f._touchMoved=false;d(g,"mouseover");d(g,"mousemove");d(g,"mousedown");};c._touchMove=function(f){if(!a){return;}this._touchMoved=true;d(f,"mousemove");};c._touchEnd=function(f){if(!a){return;}d(f,"mouseup");d(f,"mouseout");if(!this._touchMoved){d(f,"click");}a=false;};c._mouseInit=function(){var f=this;f.element.bind("touchstart",b.proxy(f,"_touchStart")).bind("touchmove",b.proxy(f,"_touchMove")).bind("touchend",b.proxy(f,"_touchEnd"));e.call(f);};})(jQuery);

/*!
 * jQuery UI Slider 1.8.23
 *
 * Copyright 2012, AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * http://docs.jquery.com/UI/Slider
 *
 * Depends:
 *	jquery.ui.core.js
 *	jquery.ui.mouse.js
 *	jquery.ui.widget.js
 */
(function( $, undefined ) {

// number of pages in a slider
// (how many times can you page up/down to go through the whole range)
var numPages = 5;

$.widget( "ui.slider", $.ui.mouse, {

	widgetEventPrefix: "slide",

	options: {
		animate: false,
		distance: 0,
		max: 100,
		min: 0,
		orientation: "horizontal",
		range: false,
		step: 1,
		value: 0,
		values: null
	},

	_create: function() {
		var self = this,
			o = this.options,
			existingHandles = this.element.find( ".ui-slider-handle" ).addClass( "ui-state-default ui-corner-all" ),
			handle = "<a class='ui-slider-handle ui-state-default ui-corner-all' href='#'></a>",
			handleCount = ( o.values && o.values.length ) || 1,
			handles = [];

		this._keySliding = false;
		this._mouseSliding = false;
		this._animateOff = true;
		this._handleIndex = null;
		this._detectOrientation();
		this._mouseInit();

		this.element
			.addClass( "ui-slider" +
				" ui-slider-" + this.orientation +
				" ui-widget" +
				" ui-widget-content" +
				" ui-corner-all" +
				( o.disabled ? " ui-slider-disabled ui-disabled" : "" ) );

		this.range = $([]);

		if ( o.range ) {
			if ( o.range === true ) {
				if ( !o.values ) {
					o.values = [ this._valueMin(), this._valueMin() ];
				}
				if ( o.values.length && o.values.length !== 2 ) {
					o.values = [ o.values[0], o.values[0] ];
				}
			}

			this.range = $( "<div></div>" )
				.appendTo( this.element )
				.addClass( "ui-slider-range" +
				// note: this isn't the most fittingly semantic framework class for this element,
				// but worked best visually with a variety of themes
				" ui-widget-header" +
				( ( o.range === "min" || o.range === "max" ) ? " ui-slider-range-" + o.range : "" ) );
		}

		for ( var i = existingHandles.length; i < handleCount; i += 1 ) {
			handles.push( handle );
		}

		this.handles = existingHandles.add( $( handles.join( "" ) ).appendTo( self.element ) );

		this.handle = this.handles.eq( 0 );

		this.handles.add( this.range ).filter( "a" )
			.click(function( event ) {
				event.preventDefault();
			})
			.hover(function() {
				if ( !o.disabled ) {
					$( this ).addClass( "ui-state-hover" );
				}
			}, function() {
				$( this ).removeClass( "ui-state-hover" );
			})
			.focus(function() {
				if ( !o.disabled ) {
					$( ".ui-slider .ui-state-focus" ).removeClass( "ui-state-focus" );
					$( this ).addClass( "ui-state-focus" );
				} else {
					$( this ).blur();
				}
			})
			.blur(function() {
				$( this ).removeClass( "ui-state-focus" );
			});

		this.handles.each(function( i ) {
			$( this ).data( "index.ui-slider-handle", i );
		});

		this.handles
			.keydown(function( event ) {
				var index = $( this ).data( "index.ui-slider-handle" ),
					allowed,
					curVal,
					newVal,
					step;

				if ( self.options.disabled ) {
					return;
				}

				switch ( event.keyCode ) {
					case $.ui.keyCode.HOME:
					case $.ui.keyCode.END:
					case $.ui.keyCode.PAGE_UP:
					case $.ui.keyCode.PAGE_DOWN:
					case $.ui.keyCode.UP:
					case $.ui.keyCode.RIGHT:
					case $.ui.keyCode.DOWN:
					case $.ui.keyCode.LEFT:
						event.preventDefault();
						if ( !self._keySliding ) {
							self._keySliding = true;
							$( this ).addClass( "ui-state-active" );
							allowed = self._start( event, index );
							if ( allowed === false ) {
								return;
							}
						}
						break;
				}

				step = self.options.step;
				if ( self.options.values && self.options.values.length ) {
					curVal = newVal = self.values( index );
				} else {
					curVal = newVal = self.value();
				}

				switch ( event.keyCode ) {
					case $.ui.keyCode.HOME:
						newVal = self._valueMin();
						break;
					case $.ui.keyCode.END:
						newVal = self._valueMax();
						break;
					case $.ui.keyCode.PAGE_UP:
						newVal = self._trimAlignValue( curVal + ( (self._valueMax() - self._valueMin()) / numPages ) );
						break;
					case $.ui.keyCode.PAGE_DOWN:
						newVal = self._trimAlignValue( curVal - ( (self._valueMax() - self._valueMin()) / numPages ) );
						break;
					case $.ui.keyCode.UP:
					case $.ui.keyCode.RIGHT:
						if ( curVal === self._valueMax() ) {
							return;
						}
						newVal = self._trimAlignValue( curVal + step );
						break;
					case $.ui.keyCode.DOWN:
					case $.ui.keyCode.LEFT:
						if ( curVal === self._valueMin() ) {
							return;
						}
						newVal = self._trimAlignValue( curVal - step );
						break;
				}

				self._slide( event, index, newVal );
			})
			.keyup(function( event ) {
				var index = $( this ).data( "index.ui-slider-handle" );

				if ( self._keySliding ) {
					self._keySliding = false;
					self._stop( event, index );
					self._change( event, index );
					$( this ).removeClass( "ui-state-active" );
				}

			});

		this._refreshValue();

		this._animateOff = false;
	},

	destroy: function() {
		this.handles.remove();
		this.range.remove();

		this.element
			.removeClass( "ui-slider" +
				" ui-slider-horizontal" +
				" ui-slider-vertical" +
				" ui-slider-disabled" +
				" ui-widget" +
				" ui-widget-content" +
				" ui-corner-all" )
			.removeData( "slider" )
			.unbind( ".slider" );

		this._mouseDestroy();

		return this;
	},

	_mouseCapture: function( event ) {
		var o = this.options,
			position,
			normValue,
			distance,
			closestHandle,
			self,
			index,
			allowed,
			offset,
			mouseOverHandle;

		if ( o.disabled ) {
			return false;
		}

		this.elementSize = {
			width: this.element.outerWidth(),
			height: this.element.outerHeight()
		};
		this.elementOffset = this.element.offset();

		position = { x: event.pageX, y: event.pageY };
		normValue = this._normValueFromMouse( position );
		distance = this._valueMax() - this._valueMin() + 1;
		self = this;
		this.handles.each(function( i ) {
			var thisDistance = Math.abs( normValue - self.values(i) );
			if ( distance > thisDistance ) {
				distance = thisDistance;
				closestHandle = $( this );
				index = i;
			}
		});

		// workaround for bug #3736 (if both handles of a range are at 0,
		// the first is always used as the one with least distance,
		// and moving it is obviously prevented by preventing negative ranges)
		if( o.range === true && this.values(1) === o.min ) {
			index += 1;
			closestHandle = $( this.handles[index] );
		}

		allowed = this._start( event, index );
		if ( allowed === false ) {
			return false;
		}
		this._mouseSliding = true;

		self._handleIndex = index;

		closestHandle
			.addClass( "ui-state-active" )
			.focus();

		offset = closestHandle.offset();
		mouseOverHandle = !$( event.target ).parents().andSelf().is( ".ui-slider-handle" );
		this._clickOffset = mouseOverHandle ? { left: 0, top: 0 } : {
			left: event.pageX - offset.left - ( closestHandle.width() / 2 ),
			top: event.pageY - offset.top -
				( closestHandle.height() / 2 ) -
				( parseInt( closestHandle.css("borderTopWidth"), 10 ) || 0 ) -
				( parseInt( closestHandle.css("borderBottomWidth"), 10 ) || 0) +
				( parseInt( closestHandle.css("marginTop"), 10 ) || 0)
		};

		if ( !this.handles.hasClass( "ui-state-hover" ) ) {
			this._slide( event, index, normValue );
		}
		this._animateOff = true;
		return true;
	},

	_mouseStart: function( event ) {
		return true;
	},

	_mouseDrag: function( event ) {
		var position = { x: event.pageX, y: event.pageY },
			normValue = this._normValueFromMouse( position );

		this._slide( event, this._handleIndex, normValue );

		return false;
	},

	_mouseStop: function( event ) {
		this.handles.removeClass( "ui-state-active" );
		this._mouseSliding = false;

		this._stop( event, this._handleIndex );
		this._change( event, this._handleIndex );

		this._handleIndex = null;
		this._clickOffset = null;
		this._animateOff = false;

		return false;
	},

	_detectOrientation: function() {
		this.orientation = ( this.options.orientation === "vertical" ) ? "vertical" : "horizontal";
	},

	_normValueFromMouse: function( position ) {
		var pixelTotal,
			pixelMouse,
			percentMouse,
			valueTotal,
			valueMouse;

		if ( this.orientation === "horizontal" ) {
			pixelTotal = this.elementSize.width;
			pixelMouse = position.x - this.elementOffset.left - ( this._clickOffset ? this._clickOffset.left : 0 );
		} else {
			pixelTotal = this.elementSize.height;
			pixelMouse = position.y - this.elementOffset.top - ( this._clickOffset ? this._clickOffset.top : 0 );
		}

		percentMouse = ( pixelMouse / pixelTotal );
		if ( percentMouse > 1 ) {
			percentMouse = 1;
		}
		if ( percentMouse < 0 ) {
			percentMouse = 0;
		}
		if ( this.orientation === "vertical" ) {
			percentMouse = 1 - percentMouse;
		}

		valueTotal = this._valueMax() - this._valueMin();
		valueMouse = this._valueMin() + percentMouse * valueTotal;

		return this._trimAlignValue( valueMouse );
	},

	_start: function( event, index ) {
		var uiHash = {
			handle: this.handles[ index ],
			value: this.value()
		};
		if ( this.options.values && this.options.values.length ) {
			uiHash.value = this.values( index );
			uiHash.values = this.values();
		}
		return this._trigger( "start", event, uiHash );
	},

	_slide: function( event, index, newVal ) {
		var otherVal,
			newValues,
			allowed;

		if ( this.options.values && this.options.values.length ) {
			otherVal = this.values( index ? 0 : 1 );

			if ( ( this.options.values.length === 2 && this.options.range === true ) &&
					( ( index === 0 && newVal > otherVal) || ( index === 1 && newVal < otherVal ) )
				) {
				newVal = otherVal;
			}

			if ( newVal !== this.values( index ) ) {
				newValues = this.values();
				newValues[ index ] = newVal;
				// A slide can be canceled by returning false from the slide callback
				allowed = this._trigger( "slide", event, {
					handle: this.handles[ index ],
					value: newVal,
					values: newValues
				} );
				otherVal = this.values( index ? 0 : 1 );
				if ( allowed !== false ) {
					this.values( index, newVal, true );
				}
			}
		} else {
			if ( newVal !== this.value() ) {
				// A slide can be canceled by returning false from the slide callback
				allowed = this._trigger( "slide", event, {
					handle: this.handles[ index ],
					value: newVal
				} );
				if ( allowed !== false ) {
					this.value( newVal );
				}
			}
		}
	},

	_stop: function( event, index ) {
		var uiHash = {
			handle: this.handles[ index ],
			value: this.value()
		};
		if ( this.options.values && this.options.values.length ) {
			uiHash.value = this.values( index );
			uiHash.values = this.values();
		}

		this._trigger( "stop", event, uiHash );
	},

	_change: function( event, index ) {
		if ( !this._keySliding && !this._mouseSliding ) {
			var uiHash = {
				handle: this.handles[ index ],
				value: this.value()
			};
			if ( this.options.values && this.options.values.length ) {
				uiHash.value = this.values( index );
				uiHash.values = this.values();
			}

			this._trigger( "change", event, uiHash );
		}
	},

	value: function( newValue ) {
		if ( arguments.length ) {
			this.options.value = this._trimAlignValue( newValue );
			this._refreshValue();
			this._change( null, 0 );
			return;
		}

		return this._value();
	},

	values: function( index, newValue ) {
		var vals,
			newValues,
			i;

		if ( arguments.length > 1 ) {
			this.options.values[ index ] = this._trimAlignValue( newValue );
			this._refreshValue();
			this._change( null, index );
			return;
		}

		if ( arguments.length ) {
			if ( $.isArray( arguments[ 0 ] ) ) {
				vals = this.options.values;
				newValues = arguments[ 0 ];
				for ( i = 0; i < vals.length; i += 1 ) {
					vals[ i ] = this._trimAlignValue( newValues[ i ] );
					this._change( null, i );
				}
				this._refreshValue();
			} else {
				if ( this.options.values && this.options.values.length ) {
					return this._values( index );
				} else {
					return this.value();
				}
			}
		} else {
			return this._values();
		}
	},

	_setOption: function( key, value ) {
		var i,
			valsLength = 0;

		if ( $.isArray( this.options.values ) ) {
			valsLength = this.options.values.length;
		}

		$.Widget.prototype._setOption.apply( this, arguments );

		switch ( key ) {
			case "disabled":
				if ( value ) {
					this.handles.filter( ".ui-state-focus" ).blur();
					this.handles.removeClass( "ui-state-hover" );
					this.handles.propAttr( "disabled", true );
					this.element.addClass( "ui-disabled" );
				} else {
					this.handles.propAttr( "disabled", false );
					this.element.removeClass( "ui-disabled" );
				}
				break;
			case "orientation":
				this._detectOrientation();
				this.element
					.removeClass( "ui-slider-horizontal ui-slider-vertical" )
					.addClass( "ui-slider-" + this.orientation );
				this._refreshValue();
				break;
			case "value":
				this._animateOff = true;
				this._refreshValue();
				this._change( null, 0 );
				this._animateOff = false;
				break;
			case "values":
				this._animateOff = true;
				this._refreshValue();
				for ( i = 0; i < valsLength; i += 1 ) {
					this._change( null, i );
				}
				this._animateOff = false;
				break;
		}
	},

	//internal value getter
	// _value() returns value trimmed by min and max, aligned by step
	_value: function() {
		var val = this.options.value;
		val = this._trimAlignValue( val );

		return val;
	},

	//internal values getter
	// _values() returns array of values trimmed by min and max, aligned by step
	// _values( index ) returns single value trimmed by min and max, aligned by step
	_values: function( index ) {
		var val,
			vals,
			i;

		if ( arguments.length ) {
			val = this.options.values[ index ];
			val = this._trimAlignValue( val );

			return val;
		} else {
			// .slice() creates a copy of the array
			// this copy gets trimmed by min and max and then returned
			vals = this.options.values.slice();
			for ( i = 0; i < vals.length; i+= 1) {
				vals[ i ] = this._trimAlignValue( vals[ i ] );
			}

			return vals;
		}
	},

	// returns the step-aligned value that val is closest to, between (inclusive) min and max
	_trimAlignValue: function( val ) {
		if ( val <= this._valueMin() ) {
			return this._valueMin();
		}
		if ( val >= this._valueMax() ) {
			return this._valueMax();
		}
		var step = ( this.options.step > 0 ) ? this.options.step : 1,
			valModStep = (val - this._valueMin()) % step,
			alignValue = val - valModStep;

		if ( Math.abs(valModStep) * 2 >= step ) {
			alignValue += ( valModStep > 0 ) ? step : ( -step );
		}

		// Since JavaScript has problems with large floats, round
		// the final value to 5 digits after the decimal point (see #4124)
		return parseFloat( alignValue.toFixed(5) );
	},

	_valueMin: function() {
		return this.options.min;
	},

	_valueMax: function() {
		return this.options.max;
	},

	_refreshValue: function() {
		var oRange = this.options.range,
			o = this.options,
			self = this,
			animate = ( !this._animateOff ) ? o.animate : false,
			valPercent,
			_set = {},
			lastValPercent,
			value,
			valueMin,
			valueMax;

		if ( this.options.values && this.options.values.length ) {
			this.handles.each(function( i, j ) {
				valPercent = ( self.values(i) - self._valueMin() ) / ( self._valueMax() - self._valueMin() ) * 100;
				_set[ self.orientation === "horizontal" ? "left" : "bottom" ] = valPercent + "%";
				$( this ).stop( 1, 1 )[ animate ? "animate" : "css" ]( _set, o.animate );
				if ( self.options.range === true ) {
					if ( self.orientation === "horizontal" ) {
						if ( i === 0 ) {
							self.range.stop( 1, 1 )[ animate ? "animate" : "css" ]( { left: valPercent + "%" }, o.animate );
						}
						if ( i === 1 ) {
							self.range[ animate ? "animate" : "css" ]( { width: ( valPercent - lastValPercent ) + "%" }, { queue: false, duration: o.animate } );
						}
					} else {
						if ( i === 0 ) {
							self.range.stop( 1, 1 )[ animate ? "animate" : "css" ]( { bottom: ( valPercent ) + "%" }, o.animate );
						}
						if ( i === 1 ) {
							self.range[ animate ? "animate" : "css" ]( { height: ( valPercent - lastValPercent ) + "%" }, { queue: false, duration: o.animate } );
						}
					}
				}
				lastValPercent = valPercent;
			});
		} else {
			value = this.value();
			valueMin = this._valueMin();
			valueMax = this._valueMax();
			valPercent = ( valueMax !== valueMin ) ?
					( value - valueMin ) / ( valueMax - valueMin ) * 100 :
					0;
			_set[ self.orientation === "horizontal" ? "left" : "bottom" ] = valPercent + "%";
			this.handle.stop( 1, 1 )[ animate ? "animate" : "css" ]( _set, o.animate );

			if ( oRange === "min" && this.orientation === "horizontal" ) {
				this.range.stop( 1, 1 )[ animate ? "animate" : "css" ]( { width: valPercent + "%" }, o.animate );
			}
			if ( oRange === "max" && this.orientation === "horizontal" ) {
				this.range[ animate ? "animate" : "css" ]( { width: ( 100 - valPercent ) + "%" }, { queue: false, duration: o.animate } );
			}
			if ( oRange === "min" && this.orientation === "vertical" ) {
				this.range.stop( 1, 1 )[ animate ? "animate" : "css" ]( { height: valPercent + "%" }, o.animate );
			}
			if ( oRange === "max" && this.orientation === "vertical" ) {
				this.range[ animate ? "animate" : "css" ]( { height: ( 100 - valPercent ) + "%" }, { queue: false, duration: o.animate } );
			}
		}
	}

});

$.extend( $.ui.slider, {
	version: "1.8.23"
});

}(jQuery));

cartodb.moduleLoad('torque', torque);

Profiler = cartodb.core.Profiler

