describe("confirm_type_change_dialog", function() {

  var dialog, dom;
  beforeEach(function() {
    dialog = new cdb.admin.ConfirmTypeChangeDialog();
    dom = dialog.render();

  });

  afterEach(function() {
    $('.confirmTypeChangeDialog').remove();
  })

  describe("when rendered ", function() {
    it('should have an ok button', function() {
      expect(dom.$('.ok').length).toEqual(1);
    })
    it('should have a cancel button', function() {
      expect(dom.$('.cancel').length).toEqual(1);
    })
  })

  describe("when asking for confirmation", function() {
    var $container, confirm;

    beforeEach(function() {
      $container = $('body')
      confirm = dialog.confirm($container);
    })
    afterEach(function() {
      $('.confirmTypeChangeDialog').remove();
    })



    it('should return a promise', function() {
      expect(typeof confirm.then).toEqual('function')
    })

    it('should resolve positively the promise when ok button is clicked', function() {
      $container.find('.ok').click();
      expect(confirm.isResolved()).toBeTruthy();
    })

    it('should reject the promise when cancel button is clicked', function() {
      $container.find('.cancel').click();
      expect(confirm.isRejected()).toBeTruthy();
    })


  })

});
