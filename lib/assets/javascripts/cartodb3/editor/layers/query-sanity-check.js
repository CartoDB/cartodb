var STATES = {
  ready: 'ready',
  loading: 'loading',
  fetched: 'fetched',
  error: 'error'
};

module.exports = {
  track: function (view, callback) {
    if (view.modelView === undefined) throw new Error('modelView is required');
    if (view._querySchemaModel === undefined) throw new Error('querySchemaModel is required');

    this.modelView = view.modelView;
    this.querySchemaModel = view._querySchemaModel;

    this.querySchemaModel.on('change:query_errors change:status', this._setState, this);
    view.add_related_model(this.querySchemaModel);

    this.modelView.on('change:state', callback);
    view.add_related_model(this.modelView);

    if (this.querySchemaModel.canFetch() && !this._hasErrors()) {
      this.querySchemaModel.fetch();
    }

    this._setState();
  },

  _setState: function () {
    if (this._hasErrors()) {
      this.modelView.set({state: STATES.error});
    } else {
      if (this.querySchemaModel.isFetched()) {
        this.modelView.set({state: STATES.ready});
      } else {
        this.modelView.set({state: STATES.loading});
      }
    }
  },

  _hasErrors: function () {
    var errors = this.querySchemaModel.get('query_errors');
    return (errors && errors.length > 0);
  }
};
