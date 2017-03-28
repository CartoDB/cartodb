var CoreView = require('backbone/core-view');
var template = require('./export-image-header.tpl');

module.exports = CoreView.extend({
  className: 'Editor-HeaderInfoEditor',

  events: {
    'click .js-back': '_onClickBack'
  },

  initialize: function (opts) {
  },

  render: function () {
    this.$el.html(
      template({
        title: _t('editor.maps.export-image.title')
      })
    );

    return this;
  },

  _onClickBack: function (e) {
    this.killEvent(e);
    this.trigger('back', this);
  }
});
