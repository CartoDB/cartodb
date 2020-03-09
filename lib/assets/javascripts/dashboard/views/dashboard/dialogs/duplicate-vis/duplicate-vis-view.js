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
        error: (req, resp) => {
          if (resp && resp.responseText.indexOf('over account public map quota') !== -1) {
            this._renderCatchedError({ errorCode: 8007 });
          } else {
            this._showError(req);
          }
        }
      }
    );
  },

  _showError: function (model) {
    try {
      const err = _.clone(model.attributes, model.attributes.get_error_text);
      this._renderCatchedError(_.extend(err, model.attributes.get_error_text));
    } catch (err) {
      this._renderUnknownError();
    }
  },

  _redirectTo: function (url) {
    window.location = url;
  }
});
