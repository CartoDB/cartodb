var cdb = require('cartodb.js');
var Backbone = require('backbone');
var _ = require('underscore');
var MapTemplates = require('../../map_templates');
var VideoTutorialItemView = require('./video_tutorial_item_view');

/**
 *  Create templates view
 *
 *  It will display all template options for creating
 *  a new map.
 *
 */

module.exports = cdb.core.View.extend({

  className: 'VideoTutorial-listWrapper',

  initialize: function() {
    this.collection = new Backbone.Collection(MapTemplates);
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    this.$el.empty();
    this.$el.append('<ul class="VideoTutorial-list js-list"></ul>');
    this.collection.reset(MapTemplates);
    return this;
  },

  _initBinds: function() {
    this.collection.bind('reset', this._renderList, this);
    this.add_related_model(this.collection);
  },

  _renderList: function() {
    this.collection.each(this._addItem, this);
  },

  _addItem: function(mdl) {
    var videoItem = new VideoTutorialItemView({ model: mdl });
    this.$('.js-list').append(videoItem.render().el);
    videoItem.bind('selected', this._onItemSelected, this);
    this.addView(videoItem);
  },

  _onItemSelected: function(mdl) {
    this.model.set('videoId', mdl.get('videoId'));
    cdb.god.trigger('onTemplateSelected', this);
  }

});