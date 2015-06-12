var cdb = require('cartodb.js');

/**
 * View to render a individual merge method.
 */
module.exports = cdb.core.View.extend({

  className: 'ImportOptions-tabLink',

  events: {
    'click': '_onClick'
  },

  initialize: function() {
    this.elder('initialize');
    this._initBinds();
  },

  render: function() {
    this.$el
      .html(this.make('span', {}, this.model.get('name')))
      .toggleClass('selected', this.model.get('selected'));

    return this;
  },

  _initBinds: function() {
    this.model.bind('change:selected', this.render, this);
  },

  _onClick: function(ev) {
    this.killEvent(ev);
    this.model.set('selected', true);
  }

});
