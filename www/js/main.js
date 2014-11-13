App.Views.Index = Backbone.View.extend({
  el: document.body,

  events: {
    'click .js-Tab-link': '_onClickTabLink'
  },

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
    this._initCodeMirror();
    this._initTabPanes();
  },

  _onClickTabLink: function(e) {
    e.preventDefault();

    var $target = $(e.target).closest('a');
    var href = $target.attr('href');
    var name = href.replace('#/', '#').split('#')[1];

    this.$('.js-Tab').removeClass('is-selected');
    $target.closest('.js-Tab').addClass('is-selected');

    this._activatePane(name);
  },

  _initTabPanes: function() {
    var _this = this;

    _.each(this.$('.js-Tab'), function(el, i) {
      if ($(el).hasClass('is-selected')) {
        var $target = $(el).find('a');
        var href = $target.attr('href');
        var name = href.replace('#/', '#').split('#')[1];

        _this._activatePane(name);
      }
    });
  },

  _activatePane: function(name) {
    this.$('.js-Pane').hide();
    this.$('#'+name).show();
  },

  _initCodeMirror: function() {
    _.each(this.$('.js-Highlight'), function(el, i) {
      CodeMirror.fromTextArea(document.getElementById('Highlight-' + i), {
        mode: 'text/html',
        lineNumbers: true,
        readOnly: true
      });
    });
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
