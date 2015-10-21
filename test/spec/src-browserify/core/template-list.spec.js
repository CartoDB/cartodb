var Config = require('../../../../src-browserify/core/config');
var setupTemplate = require('../../../../src-browserify/core/template');
var setupTemplateList = require('../../../../src-browserify/core/template-list');

describe('core/template-list', function() {
  var tmpl;

  beforeEach(function() {
    var log = jasmine.createSpyObj('cdb.log', ['error']);
    var Template = setupTemplate(log);
    var TemplateList = setupTemplateList(Template, log);
    tmpl = new TemplateList();
    tmpl.reset([
      {name: 't1', template: "hi, my name is <%= name %>"},
      {name: 't2', template: "byee!! <%= name %>"}
    ]);
  });

  it('should get template by name', function() {
    expect(tmpl.getTemplate('t1')).toBeTruthy();
    expect(tmpl.getTemplate('t2')({name:'rambo'})).toEqual('byee!! rambo');
    expect(tmpl.getTemplate('nononon')).toBeFalsy();
  });
});
