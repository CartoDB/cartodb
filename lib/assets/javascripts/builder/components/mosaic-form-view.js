var CoreView = require('backbone/core-view');
var MosaicView = require('./mosaic/mosaic-view');

/**
 *  Mosaic form view
 */

module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.collection) throw new Error('Mosaic collection is required');
    if (!opts.template) throw new Error('template is required');

    this.template = opts.template;
    this._disabled = opts.disabled;

    this._initBinds();
  },

  render: function () {
    var selectedItem = this.collection.getSelected();
    var selectedName = selectedItem && selectedItem.getName();
    this.$el.html(
      this.template({
        name: selectedName
      })
    );
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this.collection.bind('change:highlighted', this._onChangeHighlighted, this);
  },

  _initViews: function () {
    var mosaic = new MosaicView({
      collection: this.collection,
      disabled: this._disabled
    });

    if (!this.$('.js-selector').length) throw new Error('HTML element with js-selector class is required');

    this.$('.js-selector').append(mosaic.render().el);
    this.addView(mosaic);
  },

  _onChangeHighlighted: function () {
    var item = this.collection.getHighlighted() || this.collection.getSelected();
    if (item) {
      var $el = this.$('.js-highlight');
      if ($el) {
        $el.text(item.getName());
      }
    }
  }

});
