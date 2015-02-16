var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');

/**
 *  Tabs navigation for import tabs
 *
 */

module.exports = cdb.core.View.extend({

  _PER_ROW: 5,

  events: {
    'click .js-prev': '_goPrev',
    'click .js-next': '_goNext'
  },

  initialize: function() {
    var pages = Math.ceil(this.$('.ImportOptions-tab').size() / this._PER_ROW);
    this.model = new cdb.core.Model({
      index: 0,
      pages: pages
    });
  },

  render: function() {
    var pages = this.model.get('pages');
    if (pages > 1) {
      this.$el.append('<a class="Button NavButton js-prev"></a><a class="Button NavButton js-next"></a>');
    }
    return this;
  },

  _initBinds: function() {
    this.model.bind('change:index', this._changeIndex, this);
  },

  _changeIndex: function() {

  },

  _goPrev: function() {
    var index = this.model.get('index');
    if (index > 0) {

    }
  },

  _goNext: function() {
    var index = this.model.get('index');
    var pages = this.model.get('pages');

    if (index < pages) {
      
    }
  }
   
})