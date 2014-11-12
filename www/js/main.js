App.Views.Index = Backbone.View.extend({
  el: document.body,

  initialize: function() {
    this.$header = this.$('.js-Header');

    this._initBindings();
    this._initViews();
  },

  _initBindings: function() {
    var _this = this;

    $(window)
      .on('load', function() {
        _this.$header.css({
          height: window.innerHeight
        });
      });

    $(window)
      .on('resize', function() {
        console.log("resize");
        _this.$header.css({
          height: window.innerHeight
        });
      });
  },

  _initViews: function() {
    this._initOffcanvas();
  },

  _initOffcanvas: function() {
    this.offcanvas = new CDBUILIB.Views.Offcanvas({
      el: this.$('.js-Offcanvas')
    })
  }
});


$(function() {
  window.index = new App.Views.Index();
});
