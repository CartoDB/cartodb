var cdb = require('cartodb.js');
var BaseDialog = require('../../views/base_dialog/view');
var VideoTutorialModel = require('./video_tutorial_model');
var VideoTutorialHeaderView = require('./video_tutorial_header_view');
var VideoTutorialFooterView = require('./video_tutorial_footer_view');
var VideoTutorialListView = require('./video_tutorial_list_view');
var VideoTutorialVideoView = require('./video_tutorial_preview_view');

/**
 *  Video tutorial dialog
 *
 *  It will let the user check how 
 *
 */

module.exports = BaseDialog.extend({

  className: 'Dialog is-opening VideoTutorial',

  initialize: function() {
    this.model = new VideoTutorialModel({
      videoId: this.options.videoId
    });
    this.elder('initialize');
    this.template = cdb.templates.getTemplate('common/dialogs/video_tutorial/video_tutorial_template');
    this._initBinds();
  },

  render: function() {
    BaseDialog.prototype.render.call(this);
    this._initViews();
    return this;
  },

  render_content: function() {
    return this.template();
  },

  _initBinds: function() {
    this.model.bind('change:videoId', this.setContentVisibility, this);
    cdb.god.bind('startTutorial', this.close, this);
    this.add_related_model(cdb.god);
  },

  _initViews: function() {
    // Video tutorial header
    var videoTutorialHeader = new VideoTutorialHeaderView({
      el: this.$('.VideoTutorial-header'),
      model: this.model
    })
    videoTutorialHeader.render();
    this.addView(videoTutorialHeader);

    // Video tutorial footer
    var videoTutorialFooter = new VideoTutorialFooterView({
      el: this.$('.VideoTutorial-footer'),
      model: this.model
    });

    videoTutorialFooter.render();
    this.addView(videoTutorialFooter);

    // Video tutorial tabpane
    this._videoTutorialContent = new cdb.ui.common.TabPane({
      el: this.$(".VideoTutorial-content")
    });
    this.addView(this._videoTutorialContent);

    // Videos tutorial list
    this._videoTutorialContent.addTab(
      'list',
      new VideoTutorialListView({
        model: this.model
      }).render()
    );

    // Videos tutorial preview
    this._videoTutorialContent.addTab(
      'video',
      new VideoTutorialVideoView({
        model: this.model
      }).render()
    );

    this.setContentVisibility();
  },

  setContentVisibility: function() {
    // If video id is defined, content will show video preview
    this._videoTutorialContent.active( this.model.isVideoSelected() ? 'video' : 'list' );
  }

});
