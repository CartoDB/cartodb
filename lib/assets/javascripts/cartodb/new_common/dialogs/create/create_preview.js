var cdb = require('cartodb.js');
var VideoSteps = require('./preview/video_steps');

/**
 *  Create preview view
 *
 *  It will display the selected map template, a video
 *  with advices
 *
 */

module.exports = cdb.core.View.extend({

  className: 'CreateDialog-preview',

  initialize: function() {
    this.user = this.options.user;
    this.template = cdb.templates.getTemplate('new_common/views/create/create_preview');
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    if (this.model.mapTemplate && this.model.mapTemplate.get('name')) {
      this.$el.html(this.template(this.model.mapTemplate.toJSON()));
      this._initViews();
    }
    return this;
  },

  _initViews: function() {
    var videoSteps = new VideoSteps({
      el: this.$('.MapTemplate-infoSteps'),
      video: this.$('iframe'),
      templateModel: this.model.mapTemplate
    });
    videoSteps.render();
    this.addView(videoSteps);
  },

  _initBinds: function() {
    this.model.bind('change:mapTemplate', this.render, this);
    this.model.bind('change:option', this._onOptionChange, this);
  },

  _onOptionChange: function() {
    if (this.model.get('option') !== "preview") {
      // Clean video steps
      this.clearSubViews();
      // Stop video in any case
      this.$('.MapTemplate-videoIframe').remove();
    }
  }

});
