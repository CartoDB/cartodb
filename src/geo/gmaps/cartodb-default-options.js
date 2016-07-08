var config = require('cdb.config');

var CartoDBDefaultOptions = {
  opacity:        0.99,
  attribution:    config.get('cartodb_attributions'),
  debug:          false,
  visible:        true,
  added:          false,
  tiler_domain:   "carto.com",
  tiler_port:     "80",
  tiler_protocol: "http",
  sql_api_domain:     "carto.com",
  sql_api_port:       "80",
  sql_api_protocol:   "http",
  extra_params:   {
  },
  cdn_url:        null,
  subdomains:     null
};

module.exports = CartoDBDefaultOptions;
