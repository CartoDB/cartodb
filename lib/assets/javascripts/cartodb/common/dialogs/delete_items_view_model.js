var Backbone = require('backbone-cdb-v3');
var batchProcessItems = require('../../common/batch_process_items');

/**
 * View model for delete items view.
 * Manages the states changes for the delete items view.
 */
module.exports = Backbone.Collection.extend({

  initialize: function(models, opts) {
    if (!opts.contentType) {
      throw new TypeError('contentType is required')
    }

    this._contentType = opts.contentType;
  },

  state: function() {
    return this._state;
  },

  errorMessage: function() {
    return this._errorMessage;
  },

  setState: function(newState) {
    this._state = newState;
    this.trigger('change');
    this.trigger(newState);
  },

  isDeletingDatasets: function() {
    return this._contentType === 'datasets';
  },

  loadPrerequisites: function() {
    var setStateToConfirmDeletion = this.setState.bind(this, 'ConfirmDeletion');

    if (this.isDeletingDatasets()) {
      this.setState('LoadingPrerequisites');

      batchProcessItems({
        howManyInParallel: 5,
        items: this.toArray(),
        processItem: this._loadPrerequisitesForModel,
        done: setStateToConfirmDeletion,
        fail: this.setState.bind(this, 'LoadPrerequisitesFail')
      });
    } else {
      setStateToConfirmDeletion();
    }
  },

  affectedEntities: function() {
    return this.chain()
      .map(function(m) {
        return m.sharedWithEntities();
      })
      .flatten().compact().value();
  },

  affectedVisData: function() {
    var visData = this.chain()
      .map(function(m) {
          var metadata = m.tableMetadata();
          return []
            .concat(metadata.get('dependent_visualizations'))
            .concat(metadata.get('non_dependent_visualizations'));
        })
      .flatten().compact().value();

    return _.uniq(visData, function(metadata) {
      return metadata.id;
    });
  },

  deleteItems: function() {
    this.setState('DeletingItems');

    // INFO: Don't put more than 1 delete in parallel because this lead to a
    // race condicition in the derived map deletion (if any)
    batchProcessItems({
      howManyInParallel: 1,
      items: this.toArray(),
      processItem: this._deleteItem,
      done: this.setState.bind(this, 'DeleteItemsDone'),
      fail: this._deletionFailed.bind(this)
    });
  },

  _deletionFailed: function(error) {
    this._errorMessage = error;
    this.setState('DeleteItemsFail');
  },

  _loadPrerequisitesForModel: function(m, callback) {
    var metadata = m.tableMetadata();

    // TODO: extract to be included in fetch call instead? modifying global state is not very nice
    metadata.no_data_fetch = true;

    metadata.fetch({
      wait: true, // TODO: from old code (delete_dialog), why is it necessary?
      success: function() {
        callback();
      },
      error: function(model, jqXHR) {
        callback(jqXHR.responseText);
      }
    });
  },

  _deleteItem: function(item, callback) {
    item.destroy({ wait: true })
      .done(function() {
        callback();
      })
      .fail(function(response) {
        var errorMessage;

        try {
          errorMessage = JSON.parse(response.responseText).errors.join('; ');
        } catch (e) {
          errorMessage = 'something failed';
        }

        callback(errorMessage);
      });
  }
});
