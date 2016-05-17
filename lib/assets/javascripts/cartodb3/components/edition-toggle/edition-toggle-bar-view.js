var cdb = require('cartodb.js');
var Toggler = require('../toggler/toggler-view');
var template = require('./edition-toggle-bar.tpl');

module.exports = cdb.core.View.extend({
  className: 'Toggle-bar',

  initialize: function (opts) {
    if (!opts.collection) {
      throw new Error('A Model should be provided');
    }

    // View to include other controls on the right side
    // of the view, usually a button
    this._controlsView = opts.controlsView;
  },

  render: function () {
    this._initViews();
    return this;
  },

  _initViews: function () {
    this.$el.html(template);

    var toggler = new Toggler({
      collection: this.collection
    });

    this.addView(toggler);

    if (this._controlsView) {
      this.$('.js-actions').html(this._controlsView.render().el);
    }

    this.$('.js-control').html(toggler.render().el);
  }
});
