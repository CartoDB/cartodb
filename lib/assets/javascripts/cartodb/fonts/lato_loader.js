var customInstall = window.config && window.config.cartodb_com_hosted;
var latoCSSUrl = cdb.config.get('assets_url') + '/stylesheets/fonts.css';
var opts = {};

if (customInstall) {
  opts = {
    custom: {
      families: ['Lato'],
      urls: [ latoCSSUrl ]
    }
  }
} else {
  opts = {
    fontinactive: function () {
      WebFont.load({
        custom: {
          families: ['Lato'],
          urls: [ latoCSSUrl ]
        }
      })
    },
    google: {
      families: ['Lato:300,400,700,300italic,400italic:latin'],
      timeout: 2000
    }
  }
}

WebFont.load(opts);
