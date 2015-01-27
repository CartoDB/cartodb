var $ = require('jquery');
var cdb = require('cartodb.js');
var UploadConfig = require('new_common/upload_config');

/** 
 *
 *
 */

module.exports = cdb.core.View.extend({

  className: 'ImportItem',
  tagName: 'li',

  events: {

  },

  initialize: function() {
    this.template = cdb.templates.getTemplate('new_dashboard/views/background_importer/background_importer_item_view');
    this._initBinds();
  },

  render: function() {
    var name = '';
    var state = '';
    var progress = '';
    var service = '';
    var upload = this.model.get('upload');
    var imp = this.model.get('import');

    // Name
    if (upload.type) {
      if (upload.type === "file") {
        if (upload.value.length > 1) {
          name = upload.value.length + ' files'
        } else {
          name = upload.value[0].name  
        }
      }
      if (upload.type === "url") { name = upload.value }
      if (upload.type === "service") { name = upload.service_name }  
    } else {
      name = imp.item_queue_id || 'import';
    }

    // Service
    if (this.model.get('upload').service_name) {
      service = this.model.get('upload').service_name;
    }

    // State
    var data = this.model.get(this.model.get('state'));
    state = data && data.state || 'enqueued';

    // Progress
    if (this.model.get('state') === 'upload') {
      progress = this.model.get('upload').progress;
    } else {
      progress = (UploadConfig.uploadStates.indexOf(state)/UploadConfig.uploadStates.length) * 100;
    }

    this.$el.html(
      this.template({
        name: name,
        state: state,
        service: service,
        progress: progress,
        failed: this.model.hasFailed(),
        completed: this.model.hasCompleted()
      })
    );

    return this;
  },

  _initBinds: function() {
    this.model.bind('change', this.render, this);
    this.model.bind('remove', this.clean, this);
  }

})