var cdb = require('cartodb.js');

/**
 *  Template item view
 *
 *  Display primary info about the template item.
 *  Like the name or the description. Once it is
 *  selected the video will be displayed.
 *
 */

module.exports = cdb.core.View.extend({

  className: 'CreateDialog-templatesItem',
  tagName: 'li',

  events: {
    'click .js-button': '_selectTemplate'
  },
  
  initialize: function() {
    this.template = cdb.templates.getTemplate('common/views/create/template_item');
  },

  render: function() {
    this.$el.html(
      this.template({
        short_name: this.model.get('short_name'),
        short_description: this.model.get('short_description'),
        color: this.model.get('color'),
        icon: this.model.get('icon') || '',
        duration: this.model.get('duration') || '',
        difficulty: this.model.get('difficulty') || '',
        icon_url: this.model.get('icon_url') || ''
      })
    );
    return this;
  },

  _selectTemplate: function() {
    this.trigger('selected', this.model, this);
  }

});