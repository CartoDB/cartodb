const _ = require('underscore');
const CoreView = require('backbone/core-view');
const loadingView = require('builder/components/loading/render-loading');
const failTemplate = require('dashboard/components/fail.tpl');
const ErrorDetailsView = require('builder/components/background-importer/error-details-view');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'userModel',
  'configModel'
];

/**
 * Dialog to manage duplication process of a cdb.admin.Visualization object.
 */
module.exports = CoreView.extend({
  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    if (!this.model) throw new Error('model is required (cdb.admin.Visualization)');

    this._duplicateMap();
  },

  render: function () {
    // Let's make a test, it was rendering a view via a TabPane
    // which is not needed at all, let's see if rendering it directly
    // works as it shouls
    this.$el.html(loadingView({
      title: 'Duplicating your map'
    }));

    return this;
  },

  _renderCatchedError: function (error) {
    const view = new ErrorDetailsView({
      error,
      userModel: this._userModel,
      configModel: this._configModel
    });

    this.$el.html(view.render().el);
  },

  _renderUnknownError: function () {
    this.$el.html(failTemplate({
      msg: "Sorry, something went wrong, but we're not sure why."
    }));
  },

  _duplicateMap: function (newName) {
    const newMapName = this.model.get('name') + ' copy';

    this.model.copy(
      { name: newMapName },
      {
        success: newVis => {
          this._redirectTo(
            newVis.viewUrl(this._userModel).edit().toString()
          );
        },
        error: this._showError.bind(this)
      }
    );
  },

  _showError: function (model) {
    var view;

    try {
      const err = _.clone(model.attributes, model.attributes.get_error_text);
      this._renderCatchedError(_.extend(err, model.attributes.get_error_text));
    } catch (err) {
      this.renderUnknownError();
    }
    this._panes.addTab('fail', view.render());
    this._panes.active('fail');
  },

  _redirectTo: function (url) {
    window.location = url;
  }
});
