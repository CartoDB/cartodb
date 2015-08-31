var cdb = require('cartodb.js');

/**
 *  Video tutorial item view
 *
 *  Display primary info about the template item.
 *  Like the name or the description. Once it is
 *  selected the video will be displayed.
 *
 */

module.exports = cdb.core.View.extend({

  className: 'VideoTutorial-item',
  tagName: 'li',

  events: {
    'click .js-button': '_selectVideo'
  },
  
  initialize: function() {
    this.template = cdb.templates.getTemplate('common/dialogs/video_tutorial/video_tutorial_item_template');
  },

  render: function() {
    this.$el.html(
      this.template({
        shortName: this.model.get('short_name'),
        shortDescription: this.model.get('short_description'),
        color: this.model.get('color'),
        icon: this.model.get('icon') || '',
        duration: this.model.get('duration') || '',
        difficulty: this.model.get('difficulty') || '',
        iconUrl: this.model.get('icon_url') || ''
      })
    );
    return this;
  },

  _selectVideo: function() {
    this.trigger('selected', this.model, this);
  }

});