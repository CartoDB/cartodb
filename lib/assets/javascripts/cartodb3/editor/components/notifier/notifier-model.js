var Backbone = require('backbone');
var _ = require('underscore');

module.exports = Backbone.Model.extend({
  defaults: {
    id: 'notifier' + _.uniqueId(),
    status: 'idle',
    info: 'Lorem ipsum',
    closable: true
  },

  isClosable: function () {
    return this.get('closable') === true;
  },

  updateClosable: function (val) {
    this.set({closable: val});
  },

  getButton: function () {
    return this.get('button');
  },

  updateButton: function (val) {
    this.set({button: val});
  },

  getStatus: function () {
    return this.get('status');
  },

  updateStatus: function (val) {
    this.set({status: val});
  },

  getInfo: function () {
    return this.get('info');
  },

  updateInfo: function (val) {
    this.set({info: val});
  }
});
