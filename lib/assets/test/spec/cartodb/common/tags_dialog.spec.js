
  describe("cdb.admin.TagsDialog", function() {

    var view;

    beforeEach(function() {
      view = new cdb.admin.TagsDialog({
        initial_value: ["test"],
        template_name: 'table/views/edit_name',
        clean_on_hide: true,
        modal_class: ''
      });
    });

    afterEach(function() {
      view.hide();
    })

    it("should render properly tags dialog with the tags defined", function() {
      view.render();
      expect(view.$('a.ok').length).toBe(1);
      expect(view.$('.tagit-label').length).toBe(1);
      expect(view.$('.tagit-label').text()).toBe('test');
      expect(view.$('.text-icon').length).toBe(1);
    })

    it("should be able to remove tags", function(done) {
      view.render();

      view.$('.tagit-close').click();

      setTimeout(function() {

        expect(view.$('a.ok').length).toBe(1);
        expect(view.$('.tagit-label').length).toBe(0);
        expect(view.$('.tagit-close').length).toBe(0);  

        done();

      }, 300);

    })

    it("should be able to add tags", function() {
      view.render();

      var $input = view.$('.tagit-new input');
      $input.val('jam');
      var e = $.Event("keydown");
      e.keyCode = 188;
      e.which = 188;
      $input.trigger(e);

      expect(view.$('a.ok').length).toBe(1);
      expect(view.$('.tagit-label').length).toBe(2);
      expect(view.$('.tagit-close').length).toBe(2);
    })

    it("should return tags when clicks ok button", function() {
      view.render();

      view.options.onResponse = function(val) {
        expect(val.length).toBe(2);
        expect(val[0]).toBe('test');
        expect(val[1]).toBe('jam');
      }

      var $input = view.$('.tagit-new input');
      $input.val('jam');
      var e = $.Event("keydown");
      e.keyCode = 188;
      e.which = 188;
      $input.trigger(e);

      expect(view.$('.tagit-label').length).toBe(2);
      expect(view.$('.text-icon').length).toBe(2);

      view.$('a.ok').click();  
      
    });

  });
