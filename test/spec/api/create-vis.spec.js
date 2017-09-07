var _ = require('underscore');
var $ = require('jquery');
var Loader = require('../../../src/core/loader');
var createVis = require('../../../src/api/create-vis');
var VizJSON = require('../../../src/api/vizjson');
var fakeVizJSON = require('./fake-vizjson');

describe('src/api/create-vis', function () {
  beforeEach(function () {
    this.container = $('<div id="map">').css('height', '200px');
    this.containerId = this.container[0].id;
    $('body').append(this.container);

    this.$ajax = $.ajax;
    spyOn($, 'ajax').and.callFake(function (options) {
      if (options.url.indexOf(options.url.indexOf('http://cdb.localhost.lan:8181/api/v1/map/named/tpl_6a31d394_7c8e_11e5_8e42_080027880ca6/jsonp?') === 0)) {
        options.success && options.success({
          layergroupid: '1234567890'
        });
      }

      this.$ajax(options);
    }.bind(this));
  });

  afterEach(function () {
    $.ajax = this.$ajax;
    this.container.remove();
  });

  
});
