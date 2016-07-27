var Backbone = require('backbone');

module.exports = Backbone.Model.extend({
  defaults: {
    status: 'idle',
    info: '',
    closable: true
  },

  initialize: function (attrs, opts) {
    if (attrs.id === undefined) {
      this.set('id', 'notifier' + this.cid);
    }

    this.set('defaultDelay', opts.delay);

    if (opts.visDefinitionModel) {
      this._retriggerEvent(opts.visDefinitionModel, 'vis:reload');
      this._retriggerEvent(opts.visDefinitionModel, 'vis:error');
    }
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

  getAction: function () {
    return this.get('action');
  },

  setAction: function (val) {
    this.set({action: val});
  },

  updateInfo: function (val) {
    this.set({info: val});
  },

  update: function (state) {
    this.set(state);
  },

  _retriggerEvent: function (model, event) {
    model.on(event, function () {
      this.trigger(event, arguments);
    }, this);
  }
});
