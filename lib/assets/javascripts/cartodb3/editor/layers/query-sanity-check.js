var STATES = {
  ready: 'ready',
  loading: 'loading',
  fetched: 'fetched',
  error: 'error'
};

module.exports = {
  track: function (view, callback) {
    if (view.modelView === undefined) throw new Error('modelView is required');
    if (view.querySchemaModel === undefined) throw new Error('querySchemaModel is required');

    this.modelView = view.modelView;
    this.querySchemaModel = view.querySchemaModel;

    this.querySchemaModel.on('change:query_errors', this._checkErrors, this);
    view.add_related_model(view.querySchemaModel);

    this.modelView.on('change:state', callback);
    view.add_related_model(this.modelView);

    if (this.querySchemaModel.canFetch() && !this._hasErrors()) {
      this.querySchemaModel.fetch();
    }

    this._checkErrors();
  },

  _checkErrors: function () {
    this._hasErrors() && this.modelView.set({state: STATES.error});
  },

  _hasErrors: function () {
    var errors = this.querySchemaModel.get('query_errors');
    return (errors && errors.length > 0);
  }
};
