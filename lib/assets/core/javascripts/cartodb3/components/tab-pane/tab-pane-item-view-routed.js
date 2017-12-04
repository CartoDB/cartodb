var _ = require('underscore');
var TabPaneItemView = require('./tab-pane-item-view.js');

module.exports = TabPaneItemView.extend({
  _onButtonClicked: function (e) {
    e.preventDefault();
    _.isFunction(this.model.get('onClick')) && this.model.get('onClick')();
  }
});
