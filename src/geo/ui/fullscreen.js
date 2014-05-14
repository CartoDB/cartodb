/**
 *  FullScreen widget:
 *
 *  var widget = new cdb.ui.common.FullScreen({
 *    doc: ".container", // optional; if not specified, we do the fullscreen of the whole window
 *    template: this.getTemplate("table/views/fullscreen")
 *  });
 *
 */

cdb.ui.common.FullScreen = cdb.core.View.extend({

  tagName: 'div',
  className: 'cartodb-fullscreen',

  events: {

    "click a": "_toggleFullScreen"

  },

  initialize: function() {

    _.bindAll(this, 'render');
    _.defaults(this.options, this.default_options);

    this.model = new cdb.core.Model({
      allowWheelOnFullscreen: false
    });

    this._addWheelEvent();

  },

  _addWheelEvent: function() {

      var self    = this;
      var mapView = this.options.mapView;

      $(document).on('webkitfullscreenchange mozfullscreenchange fullscreenchange', function() {

        if ( !document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement && !document.msFullscreenElement) {
          if (self.model.get("allowWheelOnFullscreen")) {
            mapView.options.map.set("scrollwheel", false);
          }
        }

        mapView.invalidateSize();

      });

  },

  _toggleFullScreen: function(ev) {

    ev.stopPropagation();
    ev.preventDefault();

    var doc   = window.document;
    var docEl = doc.documentElement;

    if (this.options.doc) { // we use a custom element
      docEl = $(this.options.doc)[0];
    }

    var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen;
    var cancelFullScreen  = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen;

    var mapView = this.options.mapView;

    if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement) {

      requestFullScreen.call(docEl);

      if (mapView) {

        if (this.model.get("allowWheelOnFullscreen")) {
          mapView.options.map.set("scrollwheel", true);
        }

      }

    } else {

      cancelFullScreen.call(doc);

    }
  },

  render: function() {

    var $el = this.$el;

    var options = _.extend(this.options);

    $el.html(this.options.template(options));

    return this;
  }

});
