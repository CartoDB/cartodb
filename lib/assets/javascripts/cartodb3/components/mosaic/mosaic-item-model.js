var Backbone = require('backbone');
var basemap_thumbnail = require('../../editor/layers/basemap-content-views/basemap-thumbnail.tpl');

/*
 *  List item model
 *
 */

module.exports = Backbone.Model.extend({

  defaults: {
    selected: false,
    label: '',
    template: function () {
      return '';
    }
  },

  getName: function () {
    return this.get('label') || this.getValue();
  },

  getValue: function () {
    return this.get('val');
  },

  parse: function (attrs) {
    console.log(attrs);
    var options = attrs.options;
    var subdomains = options.subdomains;
    // subdomain by default 'a'
    var s = 'a';
    // x,y,z position of the base tile preview
    var x = 30;
    var y = 24;
    var z = 6;

    var thumbnail_url = options.urlTemplate ? options.urlTemplate : '';
    var thumbnail_image = thumbnail_url
      .replace('{s}', subdomains && subdomains.length ? subdomains[0] : s)
      .replace('{z}', z)
      .replace('{x}', x)
      .replace('{y}', y);

    // needed for highlight
    var name = options.name || 'Custom basemap ' + attrs.order;

    var d = {
      default: options.default,
      urlTemplate: options.urlTemplate,
      subdomains: subdomains,
      minZoom: options.minZoom,
      maxZoom: options.maxZoom,
      name: name,
      className: options.className,
      attribution: options.attribution,
      category: options.category,
      labels: options.labels,
      type: options.type,
      selected: options.selected,
      val: name,
      label: name,
      template: function () {
        return basemap_thumbnail({
          backgroundImage: thumbnail_image
        });
      }
    };

    return d;
  }

});
