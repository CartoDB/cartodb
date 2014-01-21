cdb.ui.common.FullScreen = cdb.core.View.extend({

  tagName: 'div',
  className: 'cartodb-fullscreen',

  events: {
    "click a": "_toggleFullScreen"
  },

  initialize: function() {

    _.defaults(this.options, this.default_options);

    _.bindAll(this, 'render');

    var self = this;

  },

  _stopPropagation: function(ev) {

    ev.stopPropagation();

  },

  open: function() {

    var self = this;

    this.$el.show(0, function(){
      self.isOpen = true;
    });

  },

  hide: function() {

    var self = this;

    this.$el.hide(0);

  },

  toggle: function() {

    if (this.isOpen) {
      this.hide();
    } else {
      this.open();
    }

  },

  _toggleFullScreen: function() {
    var doc = window.document;
    var docEl = doc.documentElement;

    var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen;
    var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen;

    if(!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement) {
      requestFullScreen.call(docEl);
    }
    else {
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
