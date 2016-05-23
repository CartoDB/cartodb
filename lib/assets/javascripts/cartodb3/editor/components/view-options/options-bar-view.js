var cdb = require('cartodb.js');
var Toggler = require('../toggler/toggler-view');
var template = require('./options-bar.tpl');

module.exports = cdb.core.View.extend({
  className: 'Options-bar',

  initialize: function (opts) {
    if (!opts.collection) {
      throw new Error('A collection should be provided');
    }

    // In order to avoid multiple change events, we listen a custom event
    // triggered from the toggler view
    this.listenTo(this.collection, 'toggle', this._renderControl);
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
    this._renderControl();

    this.$('.js-control').html(toggler.render().el);
  },

  _renderControl: function () {
    var selectedModel = this.collection.findWhere({selected: true});
    var createView = selectedModel.get('createControlView');
    createView && this.$('.js-actions').html(createView.call(this).render().el);
  }
});
