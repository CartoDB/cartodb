describe("core.template", function() {

  describe("cbd.core.Template", function() {
      var tmpl;
      beforeEach(function() {
          tmpl = new cdb.core.Template({
              template: "hi, my name is <%= name %>"
          });
      });

      it("should render", function() {
          expect(tmpl.render({name: 'rambo'})).toEqual("hi, my name is rambo");
      });
  });

  describe("cbd.core.TemplateList", function() {
      var tmpl;
      beforeEach(function() {
          tmpl = new cdb.core.TemplateList();
          tmpl.reset([
              {name: 't1', template: "hi, my name is <%= name %>"},
              {name: 't2', template: "byee!! <%= name %>"}
          ]);
      });

      it("should get template by name", function() {
          expect(tmpl.getTemplate('t1')).toBeTruthy();
          expect(tmpl.getTemplate('t2')({name:'rambo'})).toEqual('byee!! rambo');
          expect(tmpl.getTemplate('nononon')).toBeFalsy();
      });
  });

});

