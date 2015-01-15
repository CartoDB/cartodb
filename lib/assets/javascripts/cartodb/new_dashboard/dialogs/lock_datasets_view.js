var cdb = require('cartodb.js');
var BaseDialog = require('new_common/views/base_dialog/view');
var pluralizeString = require('new_common/view_helpers/pluralize_string');
var batchProcessItems = require('new_common/batch_process_items');
var _ = require('underscore');

/**
 * Lock/unlock datasets dialog.
 */
var View = BaseDialog.extend({

  events: function() {
    return _.extend({}, BaseDialog.prototype.events, {
      'click .js-ok' : '_lockDatasets'
    });
  },

  initialize: function() {
    this.elder('initialize');
    this.template = cdb.templates.getTemplate('new_dashboard/dialogs/lock_datasets_template');
    this.datasets = this.options.datasets; // of model cdb.admin.Visualization
    
    // Assert that datasets have the same locked state
    if (_.chain(this.datasets)
        .map(function(dataset) { return dataset.get('locked'); })
        .uniq().value().length > 1) {
      var errorMsg = 'It is assumed that all datasets have the same locked state, a user should never be able to ' +
        'select a mixed dataset with current UI. If you get an error with this message something is broken';
      if (window.trackJs && window.trackJs.track) {
        trackJs.track(errorMsg);
      } else {
        throw new Error(errorMsg);
      }
    }
  },

  /**
   * @implements cdb.ui.common.Dialog.prototype.render_content
   * Note since the AsyncFetchOnFirstRender mixin this render method is delayed until all required data is fetched, 
   * see the mixin for further details on its behaviour in case of fail/timeout.
   */
  render_content: function() {
    // An entity can be an User or Organization
    var datasetsCount = this.datasets.length;
    var singularOrPlural = datasetsCount === 1;

    return this.template({
      areLocked: this._areLocked(),
      datasetsNames: _.map(this.datasets, function(dataset) { return dataset.get('name'); }),
      datasetsCount: datasetsCount,
      thisOrTheseStr: singularOrPlural ? 'this' : 'these',
      itOrTheyStr: singularOrPlural ? 'it' : 'they',
      datasetOrDatasetsStr: pluralizeString('dataset', datasetsCount)
    });
  },
  
  cancel: function() {
    this.clean();
  },
  
  _areLocked: function() {
    return this.datasets[0].get('locked');
  },

  _lockDatasets: function(e) {
    this.killEvent(e);
    this.undelegateEvents();

    var self = this;
    var inversedLockedValue = !this._areLocked();
    batchProcessItems({
      howManyItems: 5,
      items: this.datasets,
      processItem: function(dataset, callback) {
        dataset.save({
          locked: inversedLockedValue
        })
          .done(function() { callback(); })
          .fail(function() { callback('should not fail in the first place, see final fail handler below'); });
      },
      done: function() {
        self.close();
      },
      fail: function() {
        // Re-enable events so the user can retry at least
        self.delegateEvents();
      }
    });
  }
});

module.exports = View;
