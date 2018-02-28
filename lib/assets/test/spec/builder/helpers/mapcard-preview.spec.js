var mapCardPreview = require('builder/helpers/mapcard-preview');
var VisDefinitionModel = require('builder/data/vis-definition-model');
var ConfigModel = require('builder/data/config-model');

describe('helpers/mapcard-preview', function () {
  var configData = {
    base_url: '/u/manolo',
    maps_api_template: 'http://{user}.localhost.lan:8181'
  };
  var visualization = new VisDefinitionModel({
    id: '3ae5e550-d373-48a2-acce-b40cd9e3cc6f',
    auth_tokens: [
      'b25ldG9rZW4=',
      'YW5vdGhlcnRva2Vu'
    ],
    permission: {
      owner: {
        username: 'curtis'
      }
    }
  }, {
    configModel: new ConfigModel(configData)
  });

  it('URL gets properly formed.', function () {
    var template = '{user}';
    var returnedUrl;

    // Act
    returnedUrl = mapCardPreview.urlForStaticMap(template, visualization, 100, 200);

    // Assert
    expect(returnedUrl).toEqual('curtis/api/v1/map/static/named/tpl_3ae5e550_d373_48a2_acce_b40cd9e3cc6f/100/200.png?auth_token=b25ldG9rZW4=&auth_token=YW5vdGhlcnRva2Vu');
  });
});
