(function($) {
  $.fn.clipPath = function(w, h, x, y) {
    this.filter('[data-clipPath]').each(function(id) {

      var path = $(this).attr('data-clipPath');
      var src = $(this).attr('src');

      var tpl = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" class="CDB-infowindow-mask" width="<%- w %>" height="<%- h %>" viewBox="0 0 <%- w %> <%- h %>">';
      tpl += '<defs><clipPath id="maskID<%-id %>"><path d="<%-path %>"/></clipPath></defs>';
      tpl += '<image clip-path="url(#maskID<%-id %>)" x="<%- x %>" y="<%- y %>" width="<%-w %>" height="<%-h %>" xlink:href="<%-src %>" />';
      tpl += '</svg>';

      var svg = $(_.template(tpl)({ id: id, x: x, y: -y, w: w, h: h, src: src, path: path }));

      $(this).replaceWith(svg);
    });

    return this;
  };
}(jQuery));
