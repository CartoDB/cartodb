var Template = require('../../../src/core/template');

describe("core/template", function() {
    var tmpl;

    beforeEach(function() {
      tmpl = new Template({
        template: "hi, my name is <%= name %>"
      });
    });

    it("should render", function() {
        expect(tmpl.render({name: 'rambo'})).toEqual("hi, my name is rambo");
    });

    it("should accept compiled templates", function() {
      tmpl = new Template({
        compiled: function(vars) { return 'hola ' + vars.name; }
      });
      expect(tmpl.render({name: 'rambo'})).toEqual("hola rambo");
    });

    it("should render using mustache", function() {
      tmpl = new Template({
        template: "hi, my name is {{ name }}",
        type: 'mustache'
      });

      expect(tmpl.render({name: 'rambo'})).toEqual("hi, my name is rambo");
    });
});
