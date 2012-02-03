describe("jasmine.Fixtures", function() {
  var ajaxData = 'some ajax data';
  var fixtureUrl = 'some_url';
  var anotherFixtureUrl = 'another_url';
  var fixturesContainer = function() {
    return $('#' + jasmine.getFixtures().containerId);
  };
  var appendFixturesContainerToDom = function() {
    $('body').append('<div id="' + jasmine.getFixtures().containerId + '">old content</div>');
  };

  beforeEach(function() {
    jasmine.getFixtures().clearCache();
    spyOn($, 'ajax').andCallFake(function(options) {
      options.success(ajaxData);
    });
  });
  
  describe("default initial config values", function() {
    it("should set 'jasmine-fixtures' as the default container id", function() {
      expect(jasmine.getFixtures().containerId).toEqual('jasmine-fixtures');
    });
    
    it("should set 'spec/javascripts/fixtures' as the default fixtures path", function() {
      expect(jasmine.getFixtures().fixturesPath).toEqual('spec/javascripts/fixtures');
    });
  });

  describe("cache", function() {
    describe("clearCache", function() {
      it("should clear cache and in effect force subsequent AJAX call", function() {
        jasmine.getFixtures().read(fixtureUrl);
        jasmine.getFixtures().clearCache();
        jasmine.getFixtures().read(fixtureUrl);
        expect($.ajax.callCount).toEqual(2);
      });
    });

    it("first-time read should go through AJAX", function() {
      jasmine.getFixtures().read(fixtureUrl);
      expect($.ajax.callCount).toEqual(1);
    });

    it("subsequent read from the same URL should go from cache", function() {
      jasmine.getFixtures().read(fixtureUrl, fixtureUrl);
      expect($.ajax.callCount).toEqual(1);
    });    
  });

  describe("read", function() {
    it("should return fixture HTML", function() {
      var html = jasmine.getFixtures().read(fixtureUrl);
      expect(html).toEqual(ajaxData);
    });

    it("should return duplicated HTML of a fixture when its url is provided twice in a single call", function() {
      var html = jasmine.getFixtures().read(fixtureUrl, fixtureUrl);
      expect(html).toEqual(ajaxData + ajaxData);
    });

    it("should return merged HTML of two fixtures when two different urls are provided in a single call", function() {
      var html = jasmine.getFixtures().read(fixtureUrl, anotherFixtureUrl);
      expect(html).toEqual(ajaxData + ajaxData);
    });

    it("should have shortcut global method readFixtures", function() {
      var html = readFixtures(fixtureUrl, anotherFixtureUrl);
      expect(html).toEqual(ajaxData + ajaxData);
    });
    
    it("should use the configured fixtures path concatenating it to the requested url (without concatenating a slash if it already has an ending one)", function() {
      jasmine.getFixtures().fixturesPath = 'a path ending with slash/'
      readFixtures(fixtureUrl);
      expect($.ajax.mostRecentCall.args[0].url).toEqual('a path ending with slash/'+fixtureUrl);
    });
    
    it("should use the configured fixtures path concatenating it to the requested url (concatenating a slash if it doesn't have an ending one)", function() {
      jasmine.getFixtures().fixturesPath = 'a path without an ending slash'
      readFixtures(fixtureUrl);
      expect($.ajax.mostRecentCall.args[0].url).toEqual('a path without an ending slash/'+fixtureUrl);
    });
  });

  describe("load", function() {
    it("should insert fixture HTML into container", function() {
      jasmine.getFixtures().load(fixtureUrl);
      expect(fixturesContainer().html()).toEqual(ajaxData);
    });

    it("should insert duplicated fixture HTML into container when the same url is provided twice in a single call", function() {
      jasmine.getFixtures().load(fixtureUrl, fixtureUrl);
      expect(fixturesContainer().html()).toEqual(ajaxData + ajaxData);
    });

    it("should insert merged HTML of two fixtures into container when two different urls are provided in a single call", function() {
      jasmine.getFixtures().load(fixtureUrl, anotherFixtureUrl);
      expect(fixturesContainer().html()).toEqual(ajaxData + ajaxData);
    });

    it("should have shortcut global method loadFixtures", function() {
      loadFixtures(fixtureUrl, anotherFixtureUrl);
      expect(fixturesContainer().html()).toEqual(ajaxData + ajaxData);
    });

    describe("when fixture container does not exist", function() {
      it("should automatically create fixtures container and append it to DOM", function() {
        jasmine.getFixtures().load(fixtureUrl);
        expect(fixturesContainer().size()).toEqual(1);
      });      
    });

    describe("when fixture container exists", function() {
      beforeEach(function() {
        appendFixturesContainerToDom();
      });

      it("should replace it with new content", function() {
        jasmine.getFixtures().load(fixtureUrl);
        expect(fixturesContainer().html()).toEqual(ajaxData);
      });
    });

    describe("when fixture contains an inline <script> tag", function(){
      beforeEach(function(){
        ajaxData = "<div><a id=\"anchor_01\"></a><script>$(function(){ $('#anchor_01').addClass('foo')});</script></div>"
      });

      it("should execute the inline javascript after the fixture has been inserted into the body", function(){
        jasmine.getFixtures().load(fixtureUrl);
        expect($("#anchor_01")).toHaveClass('foo');
      })
    });
  });

  describe("preload", function() {
    describe("read after preload", function() {
      it("should go from cache", function() {
        jasmine.getFixtures().preload(fixtureUrl, anotherFixtureUrl);
        jasmine.getFixtures().read(fixtureUrl, anotherFixtureUrl);
        expect($.ajax.callCount).toEqual(2);
      })

      it("should return correct HTMLs", function() {
        jasmine.getFixtures().preload(fixtureUrl, anotherFixtureUrl);
        var html = jasmine.getFixtures().read(fixtureUrl, anotherFixtureUrl);
        expect(html).toEqual(ajaxData + ajaxData);
      });
    });

    it("should not preload the same fixture twice", function() {
      jasmine.getFixtures().preload(fixtureUrl, fixtureUrl);
      expect($.ajax.callCount).toEqual(1);
    });

    it("should have shortcut global method preloadFixtures", function() {
      preloadFixtures(fixtureUrl, anotherFixtureUrl);
      jasmine.getFixtures().read(fixtureUrl, anotherFixtureUrl);
      expect($.ajax.callCount).toEqual(2);
    });
  });

  describe("set", function() {
    var html = '<div>some HTML</div>';
    
    it("should insert HTML into container", function() {
      jasmine.getFixtures().set(html);
      expect(fixturesContainer().html()).toEqual(jasmine.JQuery.browserTagCaseIndependentHtml(html));
    });

    it("should insert jQuery element into container", function() {
      jasmine.getFixtures().set($(html));
      expect(fixturesContainer().html()).toEqual(jasmine.JQuery.browserTagCaseIndependentHtml(html));
    });

    it("should have shortcut global method setFixtures", function() {
      setFixtures(html);
      expect(fixturesContainer().html()).toEqual(jasmine.JQuery.browserTagCaseIndependentHtml(html));
    });

    describe("when fixture container does not exist", function() {
      it("should automatically create fixtures container and append it to DOM", function() {
        jasmine.getFixtures().set(html);
        expect(fixturesContainer().size()).toEqual(1);
      });
    });

    describe("when fixture container exists", function() {
      beforeEach(function() {
        appendFixturesContainerToDom();
      });

      it("should replace it with new content", function() {
        jasmine.getFixtures().set(html);
        expect(fixturesContainer().html()).toEqual(jasmine.JQuery.browserTagCaseIndependentHtml(html));
      });
    });
  });

  describe("sandbox", function() {
    describe("with no attributes parameter specified", function() {
      it("should create DIV with id #sandbox", function() {
        expect(jasmine.getFixtures().sandbox().html()).toEqual($('<div id="sandbox" />').html());
      });
    });

    describe("with attributes parameter specified", function() {
      it("should create DIV with attributes", function() {
        var attributes = {
          attr1: 'attr1 value',
          attr2: 'attr2 value'
        };
        var element = $(jasmine.getFixtures().sandbox(attributes));

        expect(element.attr('attr1')).toEqual(attributes.attr1);
        expect(element.attr('attr2')).toEqual(attributes.attr2);
      });

      it("should be able to override id by setting it as attribute", function() {
        var idOverride = 'overridden';
        var element = $(jasmine.getFixtures().sandbox({id: idOverride}));
        expect(element.attr('id')).toEqual(idOverride);
      });
    });

    it("should have shortcut global method sandbox", function() {
      var attributes = {
        id: 'overridden'
      };
      var element = $(sandbox(attributes));
      expect(element.attr('id')).toEqual(attributes.id);
    });
  });

  describe("cleanUp", function() {
    it("should remove fixtures container from DOM", function() {
      appendFixturesContainerToDom();
      jasmine.getFixtures().cleanUp();
      expect(fixturesContainer().size()).toEqual(0);
    });
  });

  // WARNING: this block requires its two tests to be invoked in order!
  // (Really ugly solution, but unavoidable in this specific case)
  describe("automatic DOM clean-up between tests", function() {
    // WARNING: this test must be invoked first (before 'SECOND TEST')!
    it("FIRST TEST: should pollute the DOM", function() {
      appendFixturesContainerToDom();
    });

    // WARNING: this test must be invoked second (after 'FIRST TEST')!
    it("SECOND TEST: should see the DOM in a blank state", function() {
      expect(fixturesContainer().size()).toEqual(0);
    });
  });
});

describe("jasmine.Fixtures using real AJAX call", function() {
  var defaultFixturesPath;

  beforeEach(function() {
    defaultFixturesPath = jasmine.getFixtures().fixturesPath;
    jasmine.getFixtures().fixturesPath = 'spec/fixtures';
  });

  afterEach(function() {
    jasmine.getFixtures().fixturesPath = defaultFixturesPath;
  });

  describe("when fixture file exists", function() {
    var fixtureUrl = "real_non_mocked_fixture.html";

    it("should load content of fixture file", function() {
      var fixtureContent = jasmine.getFixtures().read(fixtureUrl);
      expect(fixtureContent).toEqual('<div id="real_non_mocked_fixture"></div>');
    });
  });

  describe("when fixture file does not exist", function() {
    var fixtureUrl = "not_existing_fixture";

    it("should throw an exception", function() {
      expect(function() {
        jasmine.getFixtures().read(fixtureUrl);
      }).toThrow();
    });
  });
});


describe("jQuery matchers", function() {
  describe("when jQuery matcher hides original Jasmine matcher", function() {
    describe("and tested item is jQuery object", function() {
      it("should invoke jQuery version of matcher", function() {
        expect($('<div />')).toBe('div');
      });
    });

    describe("and tested item is not jQuery object", function() {
      it("should invoke original version of matcher", function() {
        expect(true).toBe(true);
      });
    });
  });

  describe("when jQuery matcher does not hide any original Jasmine matcher", function() {
    describe("and tested item in not jQuery object", function() {
      it("should pass negated", function() {
        expect({}).not.toHaveClass("some-class");
      });
    });
  });

  describe("when invoked multiple times on the same fixture", function() {
    it("should not reset fixture after first call", function() {
      setFixtures(sandbox());
      expect($('#sandbox')).toExist();
      expect($('#sandbox')).toExist();
    });
  });

  describe("toHaveClass", function() {
    var className = "some-class";

    it("should pass when class found", function() {
      setFixtures(sandbox({'class': className}));
      expect($('#sandbox')).toHaveClass(className);
    });

    it("should pass negated when class not found", function() {
      setFixtures(sandbox());
      expect($('#sandbox')).not.toHaveClass(className);
    });    
  });

  describe("toHaveAttr", function() {
    var attributeName = 'attr1';
    var attributeValue = 'attr1 value';
    var wrongAttributeName = 'wrongName';
    var wrongAttributeValue = 'wrong value';

    beforeEach(function() {
      var attributes = {};
      attributes[attributeName] = attributeValue;
      setFixtures(sandbox(attributes));
    });

    describe("when only attribute name is provided", function() {
      it("should pass if element has matching attribute", function() {
        expect($('#sandbox')).toHaveAttr(attributeName);
      });

      it("should pass negated if element has no matching attribute", function() {
        expect($('#sandbox')).not.toHaveAttr(wrongAttributeName);
      });
    });

    describe("when both attribute name and value are provided", function() {
      it("should pass if element has matching attribute with matching value", function() {
        expect($('#sandbox')).toHaveAttr(attributeName, attributeValue);
      });

      it("should pass negated if element has matching attribute but with wrong value", function() {
        expect($('#sandbox')).not.toHaveAttr(attributeName, wrongAttributeValue);
      });

      it("should pass negated if element has no matching attribute", function() {
        expect($('#sandbox')).not.toHaveAttr(wrongAttributeName, attributeValue);
      });
    });
  });

  describe("toHaveId", function() {
    beforeEach(function() {
      setFixtures(sandbox());
    });

    it("should pass if id attribute matches expectation", function() {
      expect($('#sandbox')).toHaveId('sandbox');
    });

    it("should pass negated if id attribute does not match expectation", function() {
      expect($('#sandbox')).not.toHaveId('wrongId');
    });

    it("should pass negated if id attribute is not present", function() {
      expect($('<div />')).not.toHaveId('sandbox');
    });
  });

  describe("toHaveHtml", function() {
    var html = '<div>some text</div>';
    var wrongHtml = '<span>some text</span>';
    var element;

    beforeEach(function() {
      element = $('<div/>').append(html);
    });

    it("should pass when html matches", function() {
      expect(element).toHaveHtml(html);
    });

    it("should pass negated when html does not match", function() {
      expect(element).not.toHaveHtml(wrongHtml);
    });
  });

  describe("toHaveText", function() {
    var text = 'some text';
    var wrongText = 'some other text';
    var element;

    beforeEach(function() {
      element = $('<div/>').append(text);
    });

    it("should pass when text matches", function() {
      expect(element).toHaveText(text);
    });

    it("should pass negated when text does not match", function() {
      expect(element).not.toHaveText(wrongText);
    });

    it('should pass when text matches a regex', function() {
      expect(element).toHaveText(/some/);
    });

    it('should pass negated when text does not match a regex', function() {
      expect(element).not.toHaveText(/other/);
    });
  });

  describe("toHaveValue", function() {
    var value = 'some value';
    var differentValue = 'different value'

    beforeEach(function() {
      setFixtures($('<input id="sandbox" type="text" />').val(value));
    });

    it("should pass if value matches expectation", function() {
      expect($('#sandbox')).toHaveValue(value);
    });

    it("should pass negated if value does not match expectation", function() {
      expect($('#sandbox')).not.toHaveValue(differentValue);
    });

    it("should pass negated if value attribute is not present", function() {
      expect(sandbox()).not.toHaveValue(value);
    });
  });

  describe("toHaveData", function() {
    var key = 'some key';
    var value = 'some value';
    var wrongKey = 'wrong key';
    var wrongValue = 'wrong value';

    beforeEach(function() {
      setFixtures(sandbox().data(key, value));
    });

    describe("when only key is provided", function() {
      it("should pass if element has matching data key", function() {
        expect($('#sandbox')).toHaveData(key);
      });

      it("should pass negated if element has no matching data key", function() {
        expect($('#sandbox')).not.toHaveData(wrongKey);
      });
    });

    describe("when both key and value are provided", function() {
      it("should pass if element has matching key with matching value", function() {
        expect($('#sandbox')).toHaveData(key, value);
      });

      it("should pass negated if element has matching key but with wrong value", function() {
        expect($('#sandbox')).not.toHaveData(key, wrongValue);
      });

      it("should pass negated if element has no matching key", function() {
        expect($('#sandbox')).not.toHaveData(wrongKey, value);
      });
    });
  });

  describe("toBeVisible", function() {
    it("should pass on visible element", function() {
      setFixtures(sandbox());
      expect($('#sandbox')).toBeVisible();
    });

    it("should pass negated on hidden element", function() {
      setFixtures(sandbox().hide());
      expect($('#sandbox')).not.toBeVisible();
    });
  });

  describe("toBeHidden", function() {
    it("should pass on hidden element", function() {
      setFixtures(sandbox().hide());
      expect($('#sandbox')).toBeHidden();
    });

    it("should pass negated on visible element", function() {
      setFixtures(sandbox());
      expect($('#sandbox')).not.toBeHidden();
    });
  });

  describe("toBeSelected", function() {
    beforeEach(function() {
      setFixtures('\
        <select>\n\
          <option id="not-selected"></option>\n\
          <option id="selected" selected="selected"></option>\n\
        </select>');
    });

    it("should pass on selected element", function() {
      expect($('#selected')).toBeSelected();
    });

    it("should pass negated on not selected element", function() {
      expect($('#not-selected')).not.toBeSelected();
    });
  });

  describe("toBeChecked", function() {
    beforeEach(function() {
      setFixtures('\
        <input type="checkbox" id="checked" checked="checked" />\n\
        <input type="checkbox" id="not-checked" />');
    });

    it("should pass on checked element", function() {
      expect($('#checked')).toBeChecked();
    });

    it("should pass negated on not checked element", function() {
      expect($('#not-checked')).not.toBeChecked();
    });
  });

  describe("toBeEmpty", function() {
    it("should pass on empty element", function() {
      setFixtures(sandbox());
      expect($('#sandbox')).toBeEmpty();
    });

    it("should pass negated on element with a tag inside", function() {
      setFixtures(sandbox().html($('<span />')));
      expect($('#sandbox')).not.toBeEmpty();
    });

    it("should pass negated on element with text inside", function() {
      setFixtures(sandbox().text('some text'));
      expect($('#sandbox')).not.toBeEmpty();
    });
  });

  describe("toExist", function() {
    it("should pass on visible element", function() {
      setFixtures(sandbox());
      expect($('#sandbox')).toExist();
    });

    it("should pass on hidden element", function() {
      setFixtures(sandbox().hide());
      expect($('#sandbox')).toExist();
    });

    it("should pass negated if element is not present in DOM", function() {
      expect($('#non-existent-element')).not.toExist();
    });
  });

  describe("toBe", function() {
    beforeEach(function() {
      setFixtures(sandbox());
    });

    it("should pass if object matches selector", function() {
      expect($('#sandbox')).toBe('#sandbox');
    });

    it("should pass negated if object does not match selector", function() {
      expect($('#sandbox')).not.toBe('#wrong-id');
    });
  });

  describe("toContain", function() {
    beforeEach(function() {
      setFixtures(sandbox().html('<span />'));
    });

    it("should pass if object contains selector", function() {
      expect($('#sandbox')).toContain('span');
    });

    it("should pass negated if object does not contain selector", function() {
      expect($('#sandbox')).not.toContain('div');
    });
  });

  describe("toBeDisabled", function() {
    beforeEach(function() {
      setFixtures('\
        <input type="text" disabled="disabled" id="disabled"/>\n\
        <input type="text" id="enabled"/>');
    });

    it("should pass on disabled element", function() {
      expect($('#disabled')).toBeDisabled();
    });

    it("should pass negated on not selected element", function() {
      expect($('#enabled')).not.toBeDisabled();
    });
  });

  describe('toHaveBeenTriggeredOn', function() {
    beforeEach(function() {
      setFixtures(sandbox().html('<a id="clickme">Click Me</a> <a id="otherlink">Other Link</a>'));
      spyOnEvent($('#clickme'), 'click');
    });

    it('should pass if the event was triggered on the object', function() {
      $('#clickme').click();
      expect('click').toHaveBeenTriggeredOn($('#clickme'));
    });

    it('should pass negated if the event was never triggered', function() {
      expect('click').not.toHaveBeenTriggeredOn($('#clickme'));
    });

    it('should pass negated if the event was triggered on another non-descendant object', function() {
      $('#otherlink').click();
      expect('click').not.toHaveBeenTriggeredOn($('#clickme'));
    });
  });
  
  describe('toHandle', function() {
    beforeEach(function() {
      setFixtures(sandbox().html('<a id="clickme">Click Me</a> <a id="otherlink">Other Link</a>'));
    });

    it('should pass if the event is bound', function() {
      var handler = function(){ }; // noop
      $('#clickme').bind("click", handler);
      expect($('#clickme')).toHandle("click");
    });
    
    it('should pass if the event is not bound', function() {
      expect($('#clickme')).not.toHandle("click");
    });

  });
  
  describe('toHandleWith', function() {
    beforeEach(function() {
      setFixtures(sandbox().html('<a id="clickme">Click Me</a> <a id="otherlink">Other Link</a>'));
    });

    it('should pass if the event is bound with the given handler', function() {
      var handler = function(){ }; // noop
      $('#clickme').bind("click", handler);
      expect($('#clickme')).toHandleWith("click", handler);
    });
    
    it('should pass if the event is not bound with the given handler', function() {
      var handler = function(){ };
      $('#clickme').bind("click", handler);
      
      var aDifferentHandler = function(){ };
      expect($('#clickme')).not.toHandleWith("click", aDifferentHandler);
    });
    
    it('should pass if the event is not bound at all', function() {
      expect($('#clickme')).not.toHandle("click");
    });

  });
});

