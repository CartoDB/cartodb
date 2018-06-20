var CoreView = require('backbone/core-view');
var template = require('./tab-pane-radio-label.tpl');

/**
 *  Label component with a Radio button
 */

module.exports = CoreView.extend({
  className: 'Label',

  initialize: function () {
    if (!this.model) {
      throw new Error('A model should be provided');
    }

    this.model.on('change:label', this.render, this);
    this.model.on('change:selected', this.render, this);
  },

  render: function () {
    this.$el.html(template({
      customId: this.model.cid + this.model.get('name'),
      label: this.model.get('label'),
      name: this.model.get('name'),
      help: this.model.get('help') || '',
      selected: this.model.get('selected'),
      selectedChild: this.model.get('selectedChild') || ''
    }));
    return this;
  }

});
