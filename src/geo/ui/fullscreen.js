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

  },

  _toggleFullScreen: function(ev) {

    ev.stopPropagation();

    var doc   = window.document;
    var docEl = doc.documentElement;

    if (this.options.doc) { // we use a custom element
      docEl = $(this.options.doc)[0];
    }

    var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen;
    var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen;

    if(!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement) {

      requestFullScreen.call(docEl);

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
