var cdb = require('cartodb.js');
var template = require('./mosaic.tpl');
var MosaicCollection = require('./mosaic-collection');
var MosaicItemView = require('./mosaic-item-view');
/*
 *  A mosaic selector
 *
 *  It accepts a collection of (val, label) model attributes or a values array
 *  with the same content or only strings.
 *
 *  new Mosaic({
 *    options: [
 *      {
 *        val: 'hello',
 *        label: 'hi'
 *      }
 *    ]
 *  });
 */

module.exports = cdb.core.View.extend({

  className: 'Mosaic',
  tagName: 'div',

  initialize: function (opts) {
    if (!opts.collection) {
      if (!opts.options) { throw new Error('options array {value, label} is required'); }
      this.collection = new MosaicCollection(opts.options);
    }
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());
    this._renderList();
    return this;
  },

  _renderList: function () {
    this.collection.each(function (mdl) {
      this._createItem(mdl);
    }, this);
  },

  _createItem: function (mdl) {
    var view = new MosaicItemView({
      model: mdl
    });
    this.$('.js-mosaic').append(view.render().el);
    this.addView(view);
  }

});
