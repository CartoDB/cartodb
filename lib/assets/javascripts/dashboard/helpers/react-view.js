const ReactDOM = require('react-dom');
const CoreView = require('backbone/core-view');

module.exports = CoreView.extend({

  template: '<div class="react-view"></div>',
  component: null,

  initialize: function (opts) {
    if (opts.model) {
      this.listenTo(opts.model, 'change', this.reactRender);
    }
  },

  render: function () {
    this.$el.html(
      this.template
    );
    this.reactRender();
  },

  reactRender: function () {
    ReactDOM.render(
      this.component(this.model.attributes),
      this.$('.react-view').get(0)
    );
  }
});
