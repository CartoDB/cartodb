cdb.geo.ui.Share = cdb.core.View.extend({

  className: "cartodb-share",

  events: {
    "click a": "_onClick"
  },
  default_options: { },

  initialize: function() {

    _.bindAll(this, "_onClick");

    _.defaults(this.options, this.default_options);

    this.template = this.options.template;

  },

  _applyStyle: function() { },

  _onClick: function(e) {

    e.preventDefault();
    e.stopPropagation();

    this.dialog.show();

  },

  createDialog: function() {

    var data = this.options;
    data.template = "";

    // Add the complete url for facebook and twitter
    if (location.href) {
      data.share_url = encodeURIComponent(location.href);
    } else {
      data.share_url = data.url;
    }

    var template = cdb.core.Template.compile(
      data.template || '\
      <div class="mamufas">\
      <div class="block modal {{modal_type}}">\
      <a href="#close" class="close">x</a>\
      <div class="head">\
      <h3>Share this map</h3>\
      </div>\
      <div class="content">\
      <div class="buttons">\
      <h4>Social</h4>\
      <ul>\
      <li><a class="facebook" target="_blank" href="{{ facebook_url }}">Share on Facebook</a></li>\
      <li><a class="twitter" href="{{ twitter_url }}" target="_blank">Share on Twitter</a></li>\
      <li><a class="link" href="{{ public_map_url }}" target="_blank">Link to this map</a></li>\
      </ul>\
      </div><div class="embed_code">\
      <h4>Embed this map</h4>\
      <textarea id="" name="" cols="30" rows="10">{{ code }}</textarea>\
      </div>\
      </div>\
      </div>\
      </div>\
      ',
      data.templateType || 'mustache'
    );

    var url = location.href;

    url = url.replace("public_map", "embed_map");

    var public_map_url = url.replace("embed_map", "public_map"); // TODO: get real URL

    var code = "<iframe width='100%' height='520' frameborder='0' src='" + url + "' allowfullscreen webkitallowfullscreen mozallowfullscreen oallowfullscreen msallowfullscreen></iframe>";

    this.dialog = new cdb.ui.common.ShareDialog({
      title: data.map.get("title"),
      description: data.map.get("description"),
      model: this.options.vis.map,
      code: code,
      url: data.url,
      public_map_url: public_map_url,
      share_url: data.share_url,
      template: template,
      target: $(".cartodb-share a"),
      size: $(document).width() > 400 ? "" : "small",
      width: $(document).width() > 400 ? 430 : 216
    });

    $(".cartodb-map-wrapper").append(this.dialog.render().$el);

  },

  render: function() {

    this.$el.html(this.template(_.extend(this.model.attributes)));

    return this;

  }

});
