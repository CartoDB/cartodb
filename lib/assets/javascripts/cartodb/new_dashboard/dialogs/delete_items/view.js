var cdb = require('cartodb.js');
var BaseDialog = require('new_common/views/base_dialog/view');
var pluralizeString = require('new_common/view_helpers/pluralize_string');
var queue = require('queue-async');
var batchProcessItems = require('new_common/batch_process_items');
var _ = require('underscore');
var AsyncFetchBeforeRender = require('new_common/view_mixins/async_fetch_on_first_render');
var moment = require('moment');

var AFFECTED_ENTITIES_SAMPLE_COUNT = 3;
var AFFECTED_VIS_COUNT = 3;

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
    this.router = this.options.router;
    this.user = this.options.user;
    this.template = cdb.templates.getTemplate('new_dashboard/dialogs/delete_items/template');
  },

  /**
   * @implements cdb.ui.common.Dialog.prototype.render_content
   * Note since the AsyncFetchOnFirstRender mixin this render method is delayed until all required data is fetched, 
   * see the mixin for further details on its behaviour in case of fail/timeout.
   */
  render_content: function() {
    // An entity can be an User or Organization
    var affectedEntities = _.chain(this.selectedItems).map(function(item) { return item.sharedWith() }).flatten().value();
    var affectedVis = _.chain(this.selectedItems)
      .map(function(item) {
          var tm = item.tableMetadata();
          return []
            .concat(tm.get('dependent_visualizations'))
            .concat(tm.get('non_dependent_visualizations'));
        })
      .flatten().compact().value();

    return this.template({
      selectedCount: this.selectedItems.length,
      pluralizedContentType: this._pluralizedContentType(),
      affectedEntitiesCount: affectedEntities.length,
      affectedEntitiesSample: affectedEntities.slice(0, AFFECTED_ENTITIES_SAMPLE_COUNT),
      affectedEntitiesSampleCount: AFFECTED_ENTITIES_SAMPLE_COUNT,
      affectedVisCount: affectedVis.length,
      pluralizedMaps: pluralizeString('map', affectedVis.length),
      affectedVisVisibleCount: AFFECTED_VIS_COUNT,
      visibleAffectedVis: this._prepareVisibleAffectedVisForTemplate(affectedVis.slice(0, AFFECTED_VIS_COUNT))
    });
  },
  
  cancel: function() {
    this.clean();
  },

  _prepareVisibleAffectedVisForTemplate: function(visibleAffectedVis) {
    return visibleAffectedVis.map(function(vis) {
      var permission = new cdb.admin.Permission(vis.permission);
      var isOwner = permission.isOwner(this.user);
      return {
        name: vis.name,
        owner: vis.permission.owner,
        isOwner: isOwner,
        showPermissionIndicator: !isOwner && permission.getPermission(this.user) === cdb.admin.Permission.READ_ONLY,
        timeDiff: moment(vis.updated_at).fromNow()
      }
    }, this);
  },

  _deleteSelected: function(e) {
    this.killEvent(e);
    this.undelegateEvents();

    var self = this;
    batchProcessItems({
      howManyItems: 5,
      items: this.selectedItems,
      processItem: function(model, callback) {
        model.destroy({ wait: true })
          .done(function() { callback(); })
          .fail(function() { callback('should not fail in the first place, see final fail handler below'); });
      },
      done: function() {
        self.close();
      },
      fail: function() {
        // From discussion https://github.com/CartoDB/cartodb/issues/1633#issuecomment-68454003 this should never really
        // happen, so do nothing for now. User won't get any feedback about this.
        // At least re-enable events so the user can click delete again or close the dialog
        self.delegateEvents();
      }
    });
  },
  
  _isDeletingDatasets: function() {
    return this.router.model.get('content_type') === 'datasets';
  },

  _pluralizedContentType: function() {
    return pluralizeString(
      this._isDeletingDatasets() ? 'dataset' : 'map',
      this.selectedItems.length
    );
  }
});

// Async pre-fetch required data before display the actual dialog content
// Notice that the "this" context is same as View, so need to do custom binds (unless using closures ofc)
AsyncFetchBeforeRender.applyTo(View, {
  renderLoading: function() {
    this.show();
    this.replaceContent(
      cdb.templates.getTemplate('new_dashboard/templates/loading')({
        title: 'Checking what consequences deleting the selected '+ this._pluralizedContentType() +' would have...'
      })
    );
  },

  fetch: function(fetchCallback) {
    if (this._isDeletingDatasets()) {
      batchProcessItems({
        howManyItems: 5,
        items: this.selectedItems,
        processItem: function(m, callback) {
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
        done: fetchCallback.bind(this),
        fail: fetchCallback.bind(this)
      });

      // Escape hatch to make testing easier
      if (window.skipDeleteItemsAsyncFetch) {
        window.skipDeleteItemsAsyncFetch = fetchCallback;
      }
    } else {
      // Short fake delay to show the loading message sufficiently to be readable
      setTimeout(function() {
        fetchCallback();
      }, 500);
    }
  },

  failed: function(responseText) {
    this.replaceContent(
      cdb.templates.getTemplate('new_dashboard/templates/fail')({
        msg: ""
      })
    );
    window.trackJs && window.trackJs.track(responseText);
  },

  done: function() {
    this.reRenderAnimated();
  }
});

module.exports = View;
