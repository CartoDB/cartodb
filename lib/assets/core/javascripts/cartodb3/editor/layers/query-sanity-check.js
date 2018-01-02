var STATES = {
  ready: 'ready',
  loading: 'loading',
  fetched: 'fetched',
  error: 'error'
};

module.exports = {
  track: function (view, callback) {
    if (view.model === undefined) throw new Error('model is required');
    if (view._querySchemaModel === undefined) throw new Error('querySchemaModel is required');

    this.model = view.model;
    this.querySchemaModel = view._querySchemaModel;

    this.querySchemaModel.on('change:query_errors change:status', this._setState, this);
    view.add_related_model(this.querySchemaModel);

    this.model.on('change:state', callback);
    view.add_related_model(this.model);

    if (this.querySchemaModel.shouldFetch() && !this._hasErrors()) {
      this.querySchemaModel.fetch();
    }

    this._setState();
  },

  _setState: function () {
    if (this._hasErrors()) {
      this.model.set({state: STATES.error});
    } else {
      if (this.querySchemaModel.isFetched()) {
        this.model.set({state: STATES.ready});
      } else {
        this.model.set({state: STATES.loading});
      }
    }
  },

  _hasErrors: function () {
    return this._checkErrors(this.querySchemaModel);
  },

  _checkErrors: function (querySchemaModel) {
    var errors = querySchemaModel.get('query_errors');
    return (errors && errors.length > 0);
  }
};
