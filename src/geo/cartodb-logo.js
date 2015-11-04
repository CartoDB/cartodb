var config = require('cdb.config');

var CartoDBLogo = {

  /**
   * Check if any class already exists
   * in the provided container
   */
  isWadusAdded: function(container, className) {
    // Check if any cartodb-logo exists within container
    var a = [];
    var re = new RegExp('\\b' + className + '\\b');
    var els = container.getElementsByTagName("*");
    for(var i=0,j=els.length; i<j; i++)
      if(re.test(els[i].className))a.push(els[i]);

    return a.length > 0;
  },

  /**
   *  Check if browser supports retina images
   */
  isRetinaBrowser: function() {
    return  ('devicePixelRatio' in window && window.devicePixelRatio > 1) ||
            ('matchMedia' in window && window.matchMedia('(min-resolution:144dpi)') &&
            window.matchMedia('(min-resolution:144dpi)').matches);
  },

  /**
   * Add Cartodb logo
   * It needs a position, timeout if it is needed and the container where to add it
   */
  addWadus: function(position, timeout, container) {
    var self = this;
    setTimeout(function() {
      if (!self.isWadusAdded(container, 'cartodb-logo')) {
        var cartodb_link = document.createElement("div");
        var is_retina = self.isRetinaBrowser();
        cartodb_link.setAttribute('class','cartodb-logo');
        cartodb_link.setAttribute('style',"position:absolute; bottom:0; left:0; display:block; border:none; z-index:1000000;");
        var protocol = location.protocol.indexOf('https') === -1 ? 'http': 'https';
        var link = config.get('cartodb_logo_link');
        cartodb_link.innerHTML = "<a href='" + link + "' target='_blank'><img width='71' height='29' src='" + protocol + "://cartodb.s3.amazonaws.com/static/new_logo" + (is_retina ? '@2x' : '') + ".png' style='position:absolute; bottom:" +
          ( position.bottom || 0 ) + "px; left:" + ( position.left || 0 ) + "px; display:block; width:71px!important; height:29px!important; border:none; outline:none;' alt='CartoDB' title='CartoDB' />";
        container.appendChild(cartodb_link);
      }
    },( timeout || 0 ));
  }
};

module.exports = CartoDBLogo;
