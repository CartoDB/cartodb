const CoreView = require('backbone/core-view');
const template = require('./flash-message.tpl');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'model'
];

/**
 * View for a flash message to be displayed at the header.
 */
module.exports = CoreView.extend({
  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this.listenTo(this.model, 'change', this.render);
  },

  render: function () {
    this.$el.toggle(this.model.shouldDisplay());

    this.$el.html(
      template({
        str: this.model.get('msg'),
        type: this.model.get('type')
      })
    );

    return this;
  }
});
