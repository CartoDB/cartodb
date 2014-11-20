App.Views.Index = Backbone.View.extend({
  el: document.body,

  events: {
    'click .js-Tab-link': '_onClickTabLink'
  },

  initialize: function() {
    this.$header = this.$('.js-Header');
    this.$navbar = this.$('.js-Navbar');

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
        _this.$header.css({
          height: window.innerHeight
        });

        _this._onScroll();
      });

      $(window)
        .on('scroll', function() {
          _this._onScroll();
        });
  },

  _onScroll: function() {
    var pos = $(window).scrollTop();

    if (pos < this.$('.Header').outerHeight()) {
      if (this.$navbar.hasClass('is-scrolled')) {
        this.$navbar.removeClass('is-scrolled');

        this.$navbar.animate({
          top: '-90px'
        }, 50);
      }
    } else {
      if (!this.$navbar.hasClass('is-scrolled')) {
        this.$navbar.addClass('is-scrolled');

        this.$navbar.animate({
          top: 0,
        }, 50);
      }
    }
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

    var tabpane = $target.closest('.js-TabPanes');

    this._activatePane(name, tabpane);
  },

  _initTabPanes: function() {
    var _this = this;

    _.each(this.$('.js-TabPanes'), function(tabpane, i) {
      _.each($(tabpane).find('.js-Tab'), function(tab, i) {
        if ($(tab).hasClass('is-selected')) {
          var $target = $(tab).find('a');
          var href = $target.attr('href');
          var name = href.replace('#/', '#').split('#')[1];

          _this._activatePane(name, tabpane);
        }
      });
    });
  },

  _activatePane: function(name, tabpane) {
    $(tabpane).find('.js-Tab').removeClass('is-selected');
    $(tabpane).find('.js-Pane').hide();

    $(tabpane).find('.js-Tab-'+name).addClass('is-selected');
    $(tabpane).find('.js-Pane-'+name).show();
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
