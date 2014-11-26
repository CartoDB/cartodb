// From:
// - http://eldar.djafarov.com/2013/11/reactjs-mixing-with-backbone/
// - http://jsfiddle.net/djkojb/qZf48/24/
module.exports = {
  componentDidMount: function() {
    // Whenever there may be a change in the Backbone data, trigger a reconcile.
    this.getBackboneModels().forEach(this._injectModel, this);
  },

  componentWillUnmount: function() {
    // Ensure that we clean up any dangling references when the component is
    // destroyed.
    if (this.__syncedModels) {
      this.__syncedModels.forEach(this._ejectModel, this);
    }
  },

  _ejectModel: function(model) {
    model.unbind(null, model.__updater, this);
  },

  _injectModel: function(model) {
    if (!this.__syncedModels) this.__syncedModels = [];
    if (!~this.__syncedModels.indexOf(model)) {
      var updater = this.forceUpdate.bind(this, null);
      model.__updater = updater;
      model.bind('all', updater, this);
      this.__syncedModels.push(model);
    }
  },

  bindTo: function(model, key){
    return {
      value: model.get(key),
      requestChange: function(value){
        model.set(key, value);
      }.bind(this)
    }
  }
};
