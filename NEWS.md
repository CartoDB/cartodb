3.15.X (dd/mm/yyyy)
------
* When scrollwheel and zoom are disabled, map panning is disabled unless device is mobile.

3.15.8 (01/10/2015)
------
* Fixed btoa methods in cdb.core.util [#692](https://github.com/CartoDB/cartodb.js/issues/692)

3.15.7 (23/09/2015)
------
* Undefined `define` so that dependencies aren't loaded via AMD [#543](https://github.com/CartoDB/cartodb.js/issues/543)

3.15.6 (17/09/2015)
------
* Fixed a couple of bugs related with Leaflet attributions [#681](https://github.com/CartoDB/cartodb.js/issues/681)

3.15.5 (15/09/2015)
------
* Fixed infowindows in maps with fixed position [#639](https://github.com/CartoDB/cartodb.js/issues/639)
* Automatically select "torque" layers when no index is specified in cartodb.createLayer [#678](https://github.com/CartoDB/cartodb.js/issues/678)

3.15.4 (11/09/2015)
------
* Add checker to fullscreen button when it is rendered in an iframe [#674](https://github.com/CartoDB/cartodb.js/pull/674)

3.15.3 (08/09/2015)
------
* Display custom attribution of layers (#5216).
* Updated grunt-contrib-imagemin package version.

3.15.2 (01/09/2015)
------
* Take `visible` attribute into account when determining visibility of layers and serializing maps (#546)
* Only show legends if the layer is visible (#651)
* Extracted pecan code to separate module, https://github.com/CartoDB/pecan/ (#649,#654)
* Search control will show the result of the search with a pin and infowindow (cartodb/#4914).

3.15.0 (24/06/2015)
------
* cartodb.js knows how to work with multiple types of sublayers (#508):
  * cartodb.createLayer accepts a `filter` option to specify wich types of layers must
    be rendered in the tiles. WARNING: all non-torque layers will be rendered by default.
  * cartodb.js uses metadata from Windshaft to determine what layers are present in the
    map and specify the layer indexes in the tile URLs. More about this
    [here](https://github.com/CartoDB/Windshaft-cartodb/blob/488c2462229474db21ba40b61a93edf83e6493b5/docs/Map-API.md#blending-and-layer-selection)
  * New subclasses of SubLayer for different types of sublayers.
* Handle hidden layers properly when fetching attributes from tiler
* Make the torque slider have the correct range every time it changes
* Remove check for http-beginng vizjson addresses
* Use local time in timeslider instead of UTC
* New sublayer.isVisible() function
* `cartodb.createLayer` selects the first data layer instead of assuming that it's in position 1

3.14.6 (16/06/2015)
------
* Use the right indexes when fetching grids and attributes (#518)

3.14.4 (10/06/2015)
------
* Do not enable layer interaction if tooltip is empty (#513)
* Replaces minified carto.js with uncompressed version (#516)

3.14.3 (29/05/2015)
------
* Hide <img> tag of infowindow covers when the url is invalid.
* Expose legend model in sublayers/layers so that users can customize legends (#480).
* Handle tooltip overflow (#482).
* Only show tooltips when they have fields (#486).
* Updated Torque to 2.11.3
* Fix scrolling of infowindows with images (#490).
* Fix dropdown bind events not being unbound on clean (#493)

3.14.2 (06/05/2015)
------
* Allow to specify a template for the items of a custom legend.
* The NOKIA geocoder doesn't encode the whitespaces anymore.
* Adds documentation for the Static Map API

3.14.1 (30/04/2015)
------
* Fixes a bug that prevented setting the maxZoom and minZoom of a map.
* Updates Torque to 2.11.2

3.14.0 (23/04/2015)
------
* Infowindow in anonymous maps are requested by attributes endpoint in maps api so SQL API is not used anymore
* Changed the way remote host is set for maps and sql API.
* Fixed error management when map instanciation fails
* Instead of showing a single date, Torque's timeslider shows the date range that a single step comprises.
* Fixed enabling or disabling the torque loop property not working from cartodb.js
* Allows to specify a step when generating a static map of a Torque layer
* Deprecation warning:
    - tiler_host, tiler_prototol, tiler_port, sql_api_domain, sql_api_protocol are deprecated, use sql_api_template and maps_api_template instead. https://github.com/CartoDB/cartodb.js/blob/develop/doc/API.md#how-to-set-a-different-host-than-cartodbcom

3.13.3 (09/04/2015)
------
* Fixes default styles for header titles in infowindows.

3.13.2 (07/04/2015)
------
* Fix double escaping on infowindows
* Fix a-tag's target attribute not working

3.13.1 (06/04/2015)
------
* Allows to request a Static Map of a password protected visualization

3.13.0 (31/03/2015)
------
* Breaking Changes
  - Sanitize output by default (#2972), see doc change and example below how to override:
    - docs: https://github.com/CartoDB/cartodb.js/blob/v3.13.0/doc/API.md#arguments-11
    - example: https://github.com/CartoDB/cartodb.js/blob/v3.13.0/examples/infowindow_with_graph.html

3.12.14 (30/03/2015)
------
* Fixes fullscreen button is throwing errors (#412)
* Updates Torque.js to 2.11

3.12.13 (18/03/2015)
------
* Changes how infowindows handle null values (#406)
* Updates the version of wax and upgrades mustache.js to v1.1.0 (403)
* Fixes a bug with fullscreen in Safari (#361)

3.12.12 (12/03/2015)
------
* Fixes a bug that prevented generating previews of torque layers with named maps

3.12.11 (04/03/2015)
------
* LayerDefinition now trusts the tiler and uses whatever CDN configuration it gets (or nothing, if cdn_url is empty).
* Fixes bootstrap collisions (#87, #107)

3.12.10 (02/03/2015)
------
* Don't send the urlTemplate to generate a Static Map if we don't have it.
* Disables the CDN if the server doesn't send us the configuration.

3.12.9 (26/02/2015)
------
* Updates Static Map module to use the CDN URL from the layergroup.

3.12.8 (26/02/2015)
------
* Allows to override the default use of the bounding box to generate an image, using the center instead.
* Fixes the static map module to avoid using hidden layers to generate images.
* Extracts the CDN host configuration from the vizjson.
* Removes cdbui bower dependency.

3.12.7 (23/02/2015)
------
* By default we now serve the Static API images through CartoDB's CDN.

3.12.6 (23/02/2015)
------
* Fixes mobile and IE interaction issues (#346, #313, #223, #139).

3.12.5 (20//02/2015)
------
* Fixes request to generate an image when the vizjson contains a named map and a torque layer with a named map

3.12.4 (18//02/2015)
------
* Fixes leaflet point generation on events when using touch devices

3.12.3 (17//02/2015)
------
* Fixes a case were having an empty bbox would end up generatign an erroneous bounding box URL.

3.12.2 (17//02/2015)
------
* Fixes error generating a map preview of a visualization with a torque layer.
* Fixed use of https parameter in torque layer
* Fixed change of play/pause state in timeslider
* Fixed legend values named 0 being evaluated as NULL

3.12.1 (13//02/2015)
------
* Allows to force the https protocol when requesting a vizjson to generate a static image

3.12.0 (09//02/2015)
------
* Added Odyssey support for visualizations
* Adds new API to generate static images (https://github.com/CartoDB/cartodb.js/wiki/CartoDB-Map-API)
* Fixes the hiding of the tile loader in mobile
* Adds heatmap support for torque

3.11.36 (09/02/2014)
------
* Fixes slider style problem in narrower devices.

3.11.35 (06/02/2014)
------
* re-fixes google maps mobile events

3.11.34 (06/02/2014)
------
* Fixes google maps mobile events

3.11.33 (05/02/2014)
------
* Fixes tooltip style.

3.11.32 (29/01/2015)
------
* Fixed touch events on mobile (Android)

3.11.31 (23/01/2015)
------
- #291 - Removes padding and margin reset for webkit browsers

3.11.30 (13/01/2015)
------
- #264 - Fix addTo (when the second param specifies index)

3.11.29 (30/12/2014)
------
- #257 - Fixes rendering of several bold typefaces

3.11.28 (19/12/2014)
------
- #256 - Fixes loader position
- #255 - Adds new fonts for the overlays

3.11.27 (19/12/2014)
------
* #245 - Fixed a bug with error messages named map instantiation
* #224 - Public method close infowindow

3.11.26 (17/12/2014)
------
* #235 - Allows to use the input fields in fullscreen on Chrome
* #243 - Adds a target="_top" in the overlay links so they work inside iframes
* udpated torque with bugfixes for firefox

3.11.25 (26/11/2014)
------
* #211 - Viz made with Torque between 2 different dates shows date + time
* #223 - fixed problem with IE11 touch devices.
- #205 - fixed problem with invalid lat lng object in touch devices.

3.11.24 (11/11/2014)
------
* don't render the fullscreen overlay for unsupported versions of IE
* fixed using same callback name when there are more than one layer (#186)
* added new params options to cartodb.createVis(): gmaps_base_type and gmaps_style
* deprecate GMaps support, substitute GMaps basemaps with equivalent ones for Leaflet instead (#188)
* fixes default height for itensity list elements in mobile

3.11.23 (04/11/2014)
------
* fixes rendering issue with category legends that contain long names
* adds .toggle() method to layers and sublayers to change their visibility

3.11.22 (03/11/2014)
------
* fixes a bug that made the hidden Torque layers visible

3.11.21 (24/10/2014)
------
* enabled dynamic_cdn to route layergroup calls through the CDN

3.11.20 (24/10/2014)
------
* enabled fixed callback for layergroups and infowindows

3.11.19 (23/10/2014)
------
* fixes annotation specs
* adds several methods to set the annotation properties.

3.11.18 (22/10/2014)
------
* adds annotation overlays

3.11.17 (20/10/2014)
------
* fixes positioning of the search and share overlays on the screen
* fixed compatibility with mootools
* fixes a problem with touch devices using two fingers for zooming.

3.11.16 (10/10/2014)
------
* applies the z-index to the text and image overlays

3.11.15 (07/10/2014)
------
* fixes a display issue with overlays in desktop.
* fixed compatibility with mootools

3.11.14 (06/10/2014)
------
* adds stats_tag for all request in the url
* mobile layout fixes:
  - small CSS fixes
	- fixes issues activating legends, layer_selectors and search
	- setting the force_mobile to false disables the mobile layout
  - adds specs

3.11.13 (29/09/2014)
------
* fixes the scope of the backdrop element in the CSS file

3.11.12 (29/09/2014)
------
* fixes a bug that prevented showing the torque slider

3.11.11 (29/09/2014)
------
* fixes a bug that prevented dragging google maps with the mobile layout activated

3.11.10 (29/09/2014)
------
* fixes a bug that prevented showing the legend using the createLayer method

3.11.09 (29/09/2014)
------
* adds mobile layout

3.11.08 (21/09/2014)
------
* updated torque module with speed optimizations

3.11.07 (15//09/2014)
------
* Fixed problem breaking words in infowindow content.

3.11.06 (12//09/2014)
------
* Fixed problem in infowindow showing horizontal scrollbar when it was not needed
* Fixed creating search overlay

3.11.05 (20//08/2014)
------
* Added support for query_wrapper in torque layers

3.11.04 (12//08/2014)
------
* Fixes ugly word break in text overlays.
* Updates leaflet to 0.7.3

3.11.03 (08//08/2014)
------
* Fixes rendering issues with webfonts.

3.11.02 (07//08/2014)
------
* No longer sets the width to the text overlays.

3.11.01 (07//08/2014)
------
* Improves text and image overlay positioning.

3.11.0 (06//08/2014)
------
* If available visualization uses layer visibility settings from CartoDB viz.json.
* Map header styles changed.
* Support for new kind of overlays (text and image).

3.10.2 (11//07/2014)
------
* Added instanciateCallback to allow to cache instanciation responses
* fixed rendering order in cdb.vis.addInfowindow (#126)
* torque tiles use cdn_url from windshaft

3.10.1 (09/06/2014)
------
* Updated torque library
* Fixed showing "no data" on empty tooltips (#122)

3.10.0 (04/06/2014)
------
* Fixed problem for already customized infowindows setting width property.

3.9.08 (03/06/2014)
------
* New "liquid" infowindow style implemented.

3.9.07 (03/06/2014)
------
* Fixed exception on hover for layers without tooltip
* Improved tooltip interaction
* Changed cartocss library to support marker-type "rectangle"
* Fixed setParam when there are no default params (#120)

3.9.06 (25/05/2014)
------
* Allowfullscreen parameter added to iframe code
  in share dialog.
* Fixes link style in embed header
* Enables custom legends in Torque.

3.9.05 (19/05/2014)
------
* Fixed tileJSON method in cdb.Tiles
* Adds support for Markdown in descriptions

3.9.04 (14/05/2014)
------
* Added position parameter in Tooltip overlay

3.9.03 (14/05/2014)
------
* Added tooltip option in createLayer method

3.9.02 (14/05/2014)
------
* Fixes torque width for small screens

3.9.01 (14/05/2014)
------
* Fixed regression for mouseover event in layers

3.9.00 (13/05/2014)
------
* indents HTML of legends
* fixed getSubLayer in core library
* added tooltip loading from viz.json

3.8.11 (28//04/2014)
------
* adds new link to the visualization in the share dialog.

3.8.10 (21//04/2014)
------
* fixed problem parsing map viz options when values are not valid
* fixed interaction in IE8
* getCartoCSS and getSQL raise an exception for named maps
* fixed core library
* added url translation for https for cartodb basemaps

3.8.09 (04//04/2014)
------
* fixed map instanciation when named map has no layer information

3.8.08 (03//04/2014)
------
* fixed layer visibility

3.8.07 (03//04/2014)
------
* fixed attribution position for gmaps
* fixed maps api request when all the layers are hidden
* fixed error in gmaps when tile loading raises an error
* fixed panBy on leaflet when torque layers are used

3.8.06 (27/03/2014)
------
* fixed layer interaction is not disabled when sublayer is hidden

3.8.05 (25//03/2014)
------
* update torque library
* fixed interaction with naned maps when there is a hidden layer
* added multiple metrics

3.8.04 (20/03/2014)
------
* prevent the scrolling of the map when the user scrolls the infowindow content.
* enables the scrollwheel when the user enters in the fullscreen model.
* fixes the embed_map url in the share dialog.
* raised leaflet maxZoom from 18 to 30
* fixed setting interactivity in private layers should raise an exception (#108)
* added metrics for tile and layergroup loading time

3.8.03 (15/03/2014)
------
* fixed addCursorInteraction
* fixed fieldCount when there are no fields in infowindow

3.8.02 (14/03/2014)
------
* use cdn_url from tiler requests
* use https to fetch infowindow data when https is used
* changes default target for the fullscreen option in embeds

3.8.01 (13//03/2014)
------
* fixed nokia https to http url rewrite

3.8.00 (11/03/2014)
------
* Added mouseover and mouseout for layers
* Fixed error in old IE browsers for torque visualizations.
* Changed CartoDB attribution style under google maps.

3.7.07 (10/03/2014)
------
* Fixes infowindow placement in fullscreen mode.

3.7.06 (07/03/2014)
------
* alternate_names in infowindow was not being honored

3.7.05 (06/03/2014)
------
* Added setParams method to layer to support named maps (#106)
* fixed problems with infowindow when there are hidden layers

3.7.04 (27/02/2014)
------
* fixed layer update in gmaps
* when jsonp is used errors are not reported to the layer
* updated torque, fix problem with some cartocss options (step)

3.7.03 (25/02/2014)
------
* Fixed https in torque tiles

3.7.02 (25/02/2014)
------
* Fixed auth_token fetching infowindow attributes
* updated torque library

3.7.01 (25/02/2014)
------
* Fixed auth_token in torque layers
* Fixed time slider in torque layers
* Fixed auth_token fetching attributes

3.7.00 (24//02/2014)
------
* Added support for named maps
* Added cartodb.noleaflet.js to build (#105)

3.6.02 (18/02/2014)
------
* Adds profiling support for plugable backends

3.6.01 (13/02/2014)
------
* Fixes a call to window.addEventListener in IE8.
* Adds fullscreen detection.

3.6.00 (31/01/2014)
------
* Using Leaflet 0.7.2
* Adjusts the map header after the device is rotated
* Fixes map header when there's no title & description

3.5.07 (28/01/2014)
------
* fixed fetching twice updated_at in torque layers

3.5.06 (23/01/2014)
------
* Fixed IE7

3.5.05 (14/01/2014)
------
* Removed animation while dragging a marker under GMaps.
* Added retina icons
* Enable interactivity when tooltip is added fixed #92 #64
* Fixed torque styles when zoom was used in cartocss

3.5.04 (20/12/2013)
------
* Added attribution for torque layers.

3.5.03 (18//12/2013)
------
* updates twitter share message for mobile devices

3.5.02 (17//12/2013)
------
* improves twitter share message

3.5.01 (17//12/2013)
------
* fixes a bug that prevented using the scrolling wheel to zoom in and out

3.5.00 (16//12/2013)
------
* improves legends and torque player UI in mobile displays.
* allows passing extra params in the calls to the SQL API.
* changed profiler API.

3.4.03 (11//12/2013)
------
* fixes a bug that prevented showing a legend with custom HTML

3.4.02 (10//12/2013)
------
* adds new API for legends (documentation coming soon)
* fixes a bug that incorrectly rendered an empty legend
* fixes a bug that prevented showing the layer alias in torque layers
* adds a new time_slider example

3.4.01 (26//11/2013)
------
* fixed parsing keyword arguments in cartocss for torque

3.4.00 (26//11/2013)
------
* release of Torque Cumulative.
* enables max and min zoom for Google Maps.
* fixed URL of one asset in the examples directory.

3.3.05 (20//11/2013)
------
* fixed torque problems with cached sql requests #81

3.3.04 (15//11/2013)
------
* sets maxZoom of GMaps layers to a high value to use the one defined by Google
* update GMaps layers specs

3.3.03 (15//11/2013)
------
* fixes a bug that prevented the triggering of callbacks after setting properties to cdb.geo.GMapsBaseLayer.

3.3.02 (14//11/2013)
------
* we don't set maxZoom in GMaps layers anymore.
* adds support for WMS layers.

3.3.01 (14//11/2013)
------
* added CartoDB logo in torque layers

3.3.00 (11//11/2013)
------
* torque support

3.2.06 (04//11/2013)
------
* adjusts the max and min zoom for each layer

3.2.05 (04//11/2013)
------
* correctly shows false values in the category legend.
* prepares the legends to support images

3.2.04 (15//10/2013)
------
* enable image basemaps

3.2.03 (14//10/2013)
------
* changed CDN urls

3.2.02 (10//10/2013)
------
* fixed click propagation in legends.

3.2.01 (10//09/2013)
------
* fixed bug that prevented the use of google charts urls in the infowindow covers.
* fixed geocoder specs

3.2.00 (09//30/2013)
------
* ported to leaflet 0.6 #55

3.1.14 (09//24/2013)
------
* fixed problem with IE9 when the map has only one layer

3.1.13 (09//18/2013)
------
* new custom infowindow html available for visualization.
* problems editing polygon and linestring geojson.

3.1.12 (09//11/2013)
------
* fixed problem when an embed GMaps/Leaflet map is hidden (#70)

3.1.11 (09//10/2013)
------
* fixed problem when an embed GMaps map is hidden (#70)

3.1.10 (09//10/2013)
------
* fixed problem with infowindow option in createVis (#69)

3.1.09 (09//06/2013)
------
* fixed problem when the number of layers is different than the number of legends (refix)

3.1.08 (09//06/2013)
------
* fixed problem when the number of layers is different than the number of legends

3.1.07 (09//03/2013)
------
* fixed interactiviy in IE9 with more than one layer
* removed extra comma in layer selector (IE fix)

3.1.06 (09//02/2013)
------
* fixed #66 layer interactivity was wrong when a layer was hidden

3.1.05 (08//08/2013)
------
* Adds addInfowindow and addCursorInteraction
* changes layergroup request to use GET when is possible

3.1.04 (08//08/2013)
------
* Adds styles for NoneLegend

3.1.03 (08//08/2013)
------
* Prevents showing empty legends.

3.1.02 (08//07/2013)
------
* Flips the order of the legends.

3.1.01 (08//06/2013)
------
* Fixes the order of the legends.

3.1.00 (08//06/2013)
------
* added legends support

3.0.05 (07/18/2013)
------
* infowindow templates can be functions

3.0.04 (07/18/2013)
------
* fixed IE8 cors checking

3.0.03 (07/17/2013)
------
* fixed collision with older jQuery version
* fixed infowindows when there is no interaction enabled when loading from viz.json

3.0.02 (07/11/2013)
------
* fixed sublayer_options

3.0.01 (07/11/2013)
------
* added sublayer_options
* fixed compatibility with older viz.json

3.0.00 (07/09/2013)
------
* release v3 version
* multilayer support
* major refactor, backwards incompatible

2.0.28 (04/17/2013)
-------
* Fixed infowindow position when a map is in a scroll page.
* Added a new example (scroll_map).

2.0.27 (04/15/2013)
------
* Fixed infowindow content (#47).

2.0.26 (04/15/2013)
------
* Fixed interaction for IE10 browsers (#43).
* Fixed https option in createLayer (#46).

2.0.25 (03/22/2013)
------
* Fixed #37 featureOut is called when the cursor moves between tiles.
* Fixed #38 Infowindow isn't working using 'createVis' function without any parameter.
* Fixed #27 IE styles included in main css file.

2.0.24 (03/13/2013)
------
* Added option to control map scrollwheel zoom.
* Loading content in infowindow bug fixed.
* New classes applied to CartoDB map components avoiding other css collisions.

2.0.23 (03/04/2013)
------
* Fixed infowindow bug with cover image checking number fields as url.
* Added template_name in the infowindow model for vis.js.

2.0.22 (03/01/2013)
------
* Added cartodb.nojquery.js to the cdn.
* Infowindow crops text when it is too large in infowindows headers.
* Infowindow converts links automatically.
* Added retina CartoDB logo.
* Fixed problem with leaflet markers image paths.
* Fixed infowindow option in createVis #31.

2.0.21 (02/19/2013)
------
* Fixed problem with interaction in IE9.

2.0.20 (02/13/2013)
------
* Fixed problem with setOpacity in IE8.

2.0.19 (02/13/2013)
------
* Fixed problem with setOpacity in IE7 and IE8. It replaces leaflet with a custom one.

2.0.18 (02/12/2013)
------
* Fixed problem when loading leaflet externally.

2.0.17 (02/11/2013)
------
* Fixed problem with hide method on layers for IE8.
* Migrated to leaflet 0.5.1.
* Fixed problem guessing map type in createLayer.
* Fixed showing null values in the infowindow.

2.0.16 (01/31/2013)
------
* Added support for new infowindow' theme: 'header with image'.
* Fixed loading more than one viz.json in the same application.
* Documentation fixes.

2.0.15 (01/14/2013)
------
* Fixed problem fetching viz.json when createVis and createLayer are called in the same script.

2.0.14 (01/11/2013)
------
* Improvements in the documentation.
* Reduced the final file size by 58kb.
* Added cartodb_logo option to remove cartodb logo on visualizations .
* Fixed problem with the map always in fullscreen (#20).
* Fixed bootstrap conflicts (#16).
* Fixed autobounds in the map when user calls to createLayer (#11).
