var Backbone = require('backbone');
var basemap_thumbnail = require('./basemap-thumbnail.tpl');

module.exports = Backbone.Model.extend({

  defaults: {
    customBaselayerId: null,
    default: false,
    urlTemplate: '',
    subdomains: '',
    minZoom: 0,
    maxZoom: 21,
    name: '',
    className: '',
    attribution: null,
    category: 'Custom',
    labels: null,
    type: 'Tiled',
    selected: false,
    val: '',
    label: '',
    template: function () {
      return '';
    }
  },

  parse: function (data) {
    var options = data.options || data;

    var url = data.url || (options.urlTemplate ? options.urlTemplate : '');
    var subdomains = data.subdomains;
    // subdomain by default 'a'
    var s = 'a';
    // x,y,z position of the base tile preview
    var x = 30;
    var y = 24;
    var z = 6;

    var thumbnail_image = url
      .replace('{s}', (subdomains && subdomains.length) ? subdomains[0] : s)
      .replace('{z}', z)
      .replace('{x}', x)
      .replace('{y}', y);

    // needed for highlight
    var name = data.name || (options.name ? options.name : 'Custom basemap ' + data.order);

    var attrs = {
      customBaselayerId: data.id || null,
      default: options.default,
      urlTemplate: url,
      subdomains: subdomains,
      minZoom: options.minZoom || 0,
      maxZoom: options.maxZoom || 21,
      name: name,
      className: options.className,
      attribution: options.attribution || null,
      category: options.category,
      labels: options.labels,
      type: options.type,
      selected: options.selected,
      val: options.className,
      label: name,
      template: function () {
        return basemap_thumbnail({
          backgroundImage: thumbnail_image
        });
      }
    };

    return attrs;
  },

  getName: function () {
    return this.get('label') || this.getValue();
  },

  getValue: function () {
    return this.get('val');
  }

});
