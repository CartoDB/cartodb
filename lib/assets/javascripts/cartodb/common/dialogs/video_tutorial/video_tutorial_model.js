var cdb = require('cartodb.js-v3');
var Backbone = require('backbone-cdb-v3');
var _ = require('underscore-cdb-v3');
var MapTemplates = require('../../map_templates');

/** 
 *  Model that controls video tutorial
 *  views
 *
 */

module.exports = Backbone.Model.extend({

  defaults: {
    videoId: '' 
  },

  isVideoSelected: function() {
    return !!this.get('videoId')
  },

  getVideoTemplate: function() {
    var videoId = this.get('videoId');

    if (videoId) {
      var item = _.find(MapTemplates, function(item) {
        return item.videoId === videoId;
      });

      if (!_.isEmpty(item)) {
        return item;
      }
    }

    return false;
  }

});