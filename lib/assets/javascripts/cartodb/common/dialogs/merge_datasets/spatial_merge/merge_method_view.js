var cdb = require('cartodb.js');

/**
 * View to render a individual merge method.
 */
module.exports = cdb.core.View.extend({

  className: 'TabLink TabLink--textCenterUpcase',

  events: {
    'click': '_onClick'
  },

  initialize: function() {
    this.elder('initialize');
    this._initBinds();
  },

  render: function() {
    var isDisabled = this.model.get('isDisabled');

    this.$el
      .html(this.make('span', {}, this.model.get('name')))
      .toggleClass('disabled', isDisabled)
      .toggleClass('selected', this.model.get('selected') && !isDisabled);

    return this;
  },

  _initBinds: function() {
    this.model.bind('change:selected', this.render, this);
  },

  _onClick: function(ev) {
    this.killEvent(ev);
    if (!this.model.get('disabled')) {
      this.model.set('selected', true);
    }
  }

});
