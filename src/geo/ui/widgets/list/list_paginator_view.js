cdb.geo.ui.Widget.ListPaginatorView = cdb.core.View.extend({

  className: 'Widget-footer Widget-nav Widget-contentSpaced',

  options: {
    template: ' ' +
      '<span></span>' +
      '<div class="Widget-navArrows Widget-contentSpaced">'+
        '<button class="Widget-arrow Widget-arrow--up js-up"></button>'+
        '<button class="Widget-arrow Widget-arrow--down js-down"></button>'+
      '</div>'
  },

  events: {
    'scroll': '_onListScroll'
  },

  initialize: function() {
    if (this.options.$list) {

    }
  },

  render: function() {
    var template = _.template(this.options.template);
    this.$el.html(template());
    this._checkScroll();
    return this;
  },

  _initBinds: function() {

  },

  _checkScroll: function() {

  }

});
