var cdb = require('cartodb.js');
var pluralizeString = require('../../../../view_helpers/pluralize_string');
var Utils = require('cdb.Utils');

/**
 *  Templated workflows list item
 *
 *
 */

module.exports = cdb.core.View.extend({

  _SIZE: {
    width: 298,
    height: 190
  },

  tagName: 'li',
  className: 'MapsList-item',

  events: {
    'click': '_onClick'
  },

  initialize: function() {
    this.template = cdb.templates.getTemplate('common/dialogs/create/listing/templated_workflows/templated_workflows_list_item');
  },

  render: function() {
    var timesUsed = this.model.get('times_used');

    var d = {
      name: this.model.get('name'),
      description: this.model.get('description'),
      visParentId: this.model.get('source_visualization_id'),
      timesUsed: Utils.formatNumber(timesUsed),
      timesUsedPluralize: pluralizeString('time', 'times', timesUsed)
    };

    this.$el.html(this.template(d));
    this._renderMapThumbnail();
    return this;
  },

  _renderMapThumbnail: function() {
    var visParentId = this.model.get('source_visualization_id');
    var self = this;

    if (!visParentId) {
      this.$el.addClass('has-errors');
      return false;
    }
    
    this.$('.MapCard-header').addClass('is-loading');
    
    var img = new Image(this._SIZE.width, this._SIZE.height);
    img.onerror = function() {
      self.$('.MapCard').addClass('has-error');
      self.$('.MapCard-header').removeClass('is-loading')
    }
    img.onload = function() {
      self.$('.MapCard-header').append(img); 
    }
    img.src = cdb.config.prefixUrl() + '/api/v2/viz/' + visParentId + '/static/' + this._SIZE.width + '/' + this._SIZE.height + '.png';
  },

  _onClick: function() {
    this.trigger('onSelect', this.model, this);
  }

});
