var _ = require('underscore');

module.exports = function(SubLayerBase) {
  if (!SubLayerBase) throw new Error('SubLayerBase is required');

  // Http sublayer
  function HttpSubLayer(layer, position) {
    SubLayerBase.call(this, layer, position);
  };

  HttpSubLayer.prototype = _.extend({}, SubLayerBase.prototype, {

    toJSON: function() {
      var json = {
        type: 'http',
        options: {
          urlTemplate: this.getURLTemplate()
        }
      };

      var subdomains = this.get('subdomains');
      if (subdomains) {
        json.options.subdomains = subdomains;
      }

      var tms = this.get('tms');
      if (tms !== undefined) {
        json.options.tms = tms;
      }
      return json;
    },

    isValid: function() {
      return this.get('urlTemplate');
    },

    setURLTemplate: function(urlTemplate) {
      return this.set({
        urlTemplate: urlTemplate
      });
    },

    setSubdomains: function(subdomains) {
      return this.set({
        subdomains: subdomains
      });
    },

    setTms: function(tms) {
      return this.set({
        tms: tms
      });
    },

    getURLTemplate: function(urlTemplate) {
      return this.get('urlTemplate');
    },

    getSubdomains: function(subdomains) {
      return this.get('subdomains');
    },

    getTms: function(tms) {
      return this.get('tms');
    }
  });

  return HttpSubLayer;
}
