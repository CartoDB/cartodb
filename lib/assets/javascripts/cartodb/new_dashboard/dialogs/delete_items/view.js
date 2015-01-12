var cdb                    = require('cartodb.js');
var BaseDialog             = require('new_common/views/base_dialog/view');
var pluralizeString        = require('new_common/view_helpers/pluralize_string');
var queue                  = require('queue-async');
var _                      = require('underscore');
var AsyncFetchBeforeRender = require('new_common/view_mixins/async_fetch_on_first_render');

var AFFECTED_ENTITIES_SAMPLE_COUNT = 3;

/**
 * Delete items dialog
 */
var View = BaseDialog.extend({

  events: function() {
    return _.extend({}, BaseDialog.prototype.events, {
      'click .js-ok' : '_deleteSelected'
    });
  },

  initialize: function() {
    this.elder('initialize');
    this.selectedItems = this.options.selectedItems;
    this.router        = this.options.router;
    this.template      = cdb.templates.getTemplate('new_dashboard/dialogs/delete_items/template');
  },

  /**
   * @implements cdb.ui.common.Dialog.prototype.render_content
   * Note since the AsyncFetchOnFirstRender mixin this render method is delayed until all required data is fetched, 
   * see the mixin for further details on its behaviour in case of fail/timeout.
   */
  render_content: function() {
    // An entity can be an User or Organization
    var affectedEntities = _.chain(this.selectedItems).map(function(item) { return item.sharedWith() }).flatten().value();
    
    return this.template({
      selectedCount               : this.selectedItems.length,
      pluralizedContentType       : this._pluralizedContentType(),
      affectedEntitiesCount       : affectedEntities.length,
      affectedEntitiesSample      : _.chain(affectedEntities).take(AFFECTED_ENTITIES_SAMPLE_COUNT).value(),
      affectedEntitiesSampleCount : AFFECTED_ENTITIES_SAMPLE_COUNT
    });
  },
  
  cancel: function() {
    this.clean();
  },

  _deleteSelected: function(e) {
    this.killEvent(e);

    var q = queue(5); // # items to destroy in parallel
    _.each(this.selectedItems, function(m) {
      q.defer(function(callback) {
        m.destroy({ wait: true })
          .done(function() {
            callback(null, arguments);
          })
          .fail(function() {
            callback(arguments)
          });
      });
    });

    var self = this;
    q.awaitAll(function(error, results) {
      // error and results contains outcome of the jqXHR requests above, see http://api.jquery.com/jQuery.ajax/#jqXHR
      if (error) {
        // From discussion https://github.com/CartoDB/cartodb/issues/1633#issuecomment-68454003 this should never really
        // happen, so do nothing for now. User won't get any feedback but can click delete again or close the dialog
      } else {
        self.hide();
      }
    })
  },

  _pluralizedContentType: function() {
    return pluralizeString(
      this.router.model.get('content_type') === 'datasets' ? 'dataset' : 'map',
      this.selectedItems.length
    );
  }
});

AsyncFetchBeforeRender.applyTo(View, {
  renderLoading: function() {
    this.replaceContent(
      cdb.templates.getTemplate('new_dashboard/templates/loading')({
        title: 'Checking what consequences deleting the selected '+ this._pluralizedContentType() +' would have...'
      })
    );
  },
  
  failed: function(error) {
    this.replaceContent(
      cdb.templates.getTemplate('new_dashboard/templates/fail')({
        msg: error
      })
    );
  },
  
  done: function() {
    this.reRenderAnimated();
  },

  fetch: function(fetchCallback) {
    this._fetchDependantDataQueue = queue(5); // # items to fetch in parallel
    
    _.each(this.selectedItems, function(m) {
      this._fetchDependantDataQueue.defer(function(qCallback) {
        var metadata = m.tableMetadata();

        // TODO: extract to be included in fetch call instead? modifying global state is not very nice
        metadata.no_data_fetchDependantData = true;

        metadata.fetch({
          wait    : true, // TODO: from old code (delete_dialog), why is it necessary?
          success : function() { qCallback(); },
          error   : function(error) { qCallback(error); }
        });
      });
    }, this);
    
    this._fetchDependantDataQueue.awaitAll(fetchCallback.bind(this));
    
    // Escape hatch to make testing easier
    if (window.skipDeleteItemsAsyncFetch) {
      window.skipDeleteItemsAsyncFetch = fetchCallback;
    }
  }
});

module.exports = View;
