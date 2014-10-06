
describe("Common data", function() {


  describe("Tables", function() {
    var view, router, model, user, el;

    beforeEach(function() {
      router = new cdb.admin.CommonData.Router();
      el = $('<section>').addClass('tables');
      model = new cdb.admin.CommonData.Model({}, { router: router });
      user = TestUtil.createUser();
      view = new cdb.admin.CommonData.Content({
        el:     el,
        model:  model,
        router: router,
        user:   user
      });
    });

    afterEach(function(){
      view.clean();
    });

    it("should render properly", function() {
      view.render();

      model.set(generateModel(['table_1', 'table_2']));

      expect(view.$('.tables-latest').length).toBe(1);
      expect(view.$('.tables-tag').length).toBe(1);
      expect(view.$('.tables-index').length).toBe(1);
      
      expect(view.$('.tables-index').css('display')).toBe('block');
      expect(view.$('.tables-tag').css('display')).toBe('none');
      expect(view.$('.tables-latest').css('display')).toBe('none');
    });

    it("should not be visible if tables collection is empty", function() {
      view.render();
      model.set(generateModel(['table_1', 'table_2']));

      model.set({ 'datasets': [], 'categories': [] });
      expect(view.$el.css('display')).toBe('none');

      model.set(generateModel(['table_1', 'table_2']));
      expect(view.$el.css('display')).toBe('block');
    });

    it("should manage tables view depending router model", function() {
      view.render();
      
      model.set(generateModel(['table_1', 'table_2']));

      router.model.set('tag', 'tag1');

      expect(view.$('.tables-index').css('display')).toBe('none');
      expect(view.$('.tables-tag').css('display')).toBe('block');
      expect(view.$('.tables-latest').css('display')).toBe('none');

      router.model.set({ tag: '', latest: true });

      expect(view.$('.tables-index').css('display')).toBe('none');
      expect(view.$('.tables-tag').css('display')).toBe('none');
      expect(view.$('.tables-latest').css('display')).toBe('block');

      router.model.set({ tag: '', latest: false });

      expect(view.$('.tables-index').css('display')).toBe('block');
      expect(view.$('.tables-tag').css('display')).toBe('none');
      expect(view.$('.tables-latest').css('display')).toBe('none');
    });

    it("should render a table view properly", function() {
      view.render();

      model.set(generateModel(['table_1']));

      expect(view.$('.tables-index .table-title a').text()).toBe('table_1');
      expect(view.$('.tables-index .table-size span').text()).toBe('100 Bytes');
      expect(view.$('.tables-index .table-rows span').text()).toBe('1,000 rows');
      expect(view.$('.tables-index .table-license span').text()).toBe('Any license');
      expect(view.$('.tables-index .table-source span').text()).toBe('Source');
      expect(view.$('.tables-index .table-description').text()).toBe('Description');
    });

    it("should render a category/tag properly", function() {
      view.render();
      
      model.set(generateModel(['table_1', 'table_2', 'table_3', 'table_4']));

      router.model.set('tag', 'tag1');

      expect(view.$('.tables-tag ul.tables > li').length).toBe(1);
      expect(view.$('.tables-tag .common-data-title').length).toBe(1);
      expect(view.$('.tables-tag .common-data-title').text().search('tag1') !== -1).toBeTruthy();
    });

    it("should render tables index properly", function() {
      view.render();
      
      var table_names = [], i = 0;
      while(i < 40) { table_names.push('table_name' + i); i++};

      model.set(generateModel(table_names));

      expect(view.$('.tables-index ul.tag0 > li').length).toBe(1);
      expect(view.$('.tables-index ul.tag1 > li').length).toBe(4);
      expect(view.$('.tables-index ul.tag2 > li').length).toBe(4);
      expect(view.$('.tables-index ul.tag3 > li').length).toBe(4);
    });

    it("should render latest section properly", function() {
      view.render();
      
      var table_names = ['table_1', 'table_2', 'table_3', 'table_4', 'table_5', 'table_6'];
      model.set(generateModel(table_names));

      router.model.set('latest', true);

      expect(view.$('.tables-latest ul.tables > li').length).toBe(5);
      expect(view.$('.tables-latest .common-data-title').length).toBe(1);
      expect(view.$('.tables-latest .common-data-title').text().search('Latest') !== -1).toBeTruthy();
    });

    it("should trigger an event when table fits in user account", function() {
      view.render();
      
      var triggered = false;
      var table_names = ['table_1'];
      model.set(generateModel(table_names));

      view.bind('tableChosen', function(){
        triggered = true;
      }, this);

      view.$('.tables-index .table-title a').click();

      expect(triggered).toBeTruthy();
    });

    it("should not import a file where size doesn't fit into user quota", function() {
      view.render();

      user.set('remaining_byte_quota', 1);
      
      var triggered = false;
      var table_names = ['table_1'];
      model.set(generateModel(table_names));

      view.bind('tableChosen', function(){
        triggered = true;
      }, this);

      view.$('.tables-index .table-title a').click();

      expect(view.$('.table-item-inner').hasClass('disabled')).toBeTruthy();
      expect(triggered).toBeFalsy();
    });


    it("should not have leaks", function() {
      expect(view).toHaveNoLeaks();
    });
  });



  describe("Aside", function() {
    var view, router, model, el;

    beforeEach(function() {
      router = new cdb.admin.CommonData.Router();
      el = $('<aside>');
      model = new cdb.admin.CommonData.Model({}, { router: router });

      view = new cdb.admin.CommonData.Aside({
        el:     el,
        model:  model,
        router: router
      });

      // // Router manages tag selected attribute
      // router.model.bind('change', function(){
      //   tags.each(function(tag) {
      //     if (tag.get('value') === router.model.get('tag')) {
      //       tag.set('selected', true)
      //     } else {
      //       tag.set('selected', false)
      //     }
      //   });
      // }, this);
    });

    afterEach(function(){
      view.clean();
    });

    it("should render correctly", function() {
      view.render();

      model.set({
        datasets: [],
        categories: [
          { name: 'tag1', selected: false, count:3 },
          { name: 'tag2', selected: false, count:2 }
        ]
      });

      router.model.set('tag', 'tag2');

      expect(view.$('ul.tags li').length).toBe(3);
      expect(view.$('ul.tags li:eq(0) a').text()).toBe('All ');
      expect(view.$('ul.tags li:eq(1) a').text()).toBe('tag1 (3)');
      expect(view.$('ul.tags li:eq(2) a').text()).toBe('tag2 (2)');
      expect(view.$('ul.tags li:eq(2) a').hasClass('selected')).toBeTruthy();
      expect(view.$('ul.featured li').length).toBe(1);
    });

    it("should not be visible if tags collection is empty", function() {
      view.render();
      
      model.set({
        datasets: [],
        categories: []
      });

      expect(view.$el.css('display')).toBe('none');

      var tag_names = ['tag'];
      model.set(generateModel(tag_names));
      expect(view.$el.css('display')).toBe('block');
    });

    it("should add selected class to a tag when it is selected", function() {
      view.render();

      model.set({
        datasets: [],
        categories: [
          { name: 'tag1', selected: false, count:3 },
          { name: 'tag2', selected: false, count:2 }
        ]
      });

      router.model.set({ latest: false, tag:'tag2' });

      expect(view.$('ul.tags li:eq(1) a').hasClass('selected')).toBeFalsy();
      expect(view.$('ul.tags li:eq(2) a').hasClass('selected')).toBeTruthy();
      expect(view.$('ul.featured li a').hasClass('selected')).toBeFalsy();
      
      router.model.set({ latest: false, tag:'tag1' });
      expect(view.$('ul.tags li:eq(1) a').hasClass('selected')).toBeTruthy();
      expect(view.$('ul.tags li:eq(2) a').hasClass('selected')).toBeFalsy();
      expect(view.$('ul.featured li a').hasClass('selected')).toBeFalsy();

      router.model.set({ latest: true, tag:'' });
      expect(view.$('ul.tags li:eq(1) a').hasClass('selected')).toBeFalsy();
      expect(view.$('ul.tags li:eq(2) a').hasClass('selected')).toBeFalsy();
      expect(view.$('ul.featured li a').hasClass('selected')).toBeTruthy();
    });

    it("should render correctly after fetching tags", function() {
      view.render();
      spyOn(view, '_initViews');
      model.set({
        datasets: [],
        categories: [{ name: 'tag1', selected: false, count:3 }]
      });
      expect(view._initViews).toHaveBeenCalled();
    });

    it("should add class selected to latest tag", function() {
      view.render();

      var table_names = ['table_1', 'table_2', 'table_3', 'table_4', 'table_5', 'table_6'];
      model.set(generateModel(table_names));

      router.model.set('latest', true);
      expect(view.$('.tag1').hasClass('selected')).toBeFalsy();
      expect(view.$('.latest').hasClass('selected')).toBeTruthy();
    });

    it("should not have leaks", function() {
      expect(view).toHaveNoLeaks();
    });
  });

});


  // Help functions

  // Generate tags
  function generateTags(tables) {
    return _.map(tables, function(table,i) {
      return {
        name: 'tag' + i,
        count: 1,
        image_url: '',
        selected: false
      }
    })
  }

  // Generate tables
  function generateTables(tables) {
    return _.map(tables, function(table,i) {
      return {
        tabname: table,
        name: table,
        category: 'tag' + (i).toString()[0],
        category_image_url: '',
        description: "Description",
        license: 'Any license',
        source: 'Source',
        rows: ((i+1) * 1000),
        size: ((i+1) * 100),
        created_at: "2014-08-28T07:" + cdb.Utils.pad(i) + ":00+00:00",
        updated_at: "2014-08-28T07:" + cdb.Utils.pad(i) + ":00+00:00"
      }
    })
  }

  // Generate tables
  function generateModel(tables) {
    return {
      datasets:   generateTables(tables),
      categories: generateTags(tables)
    }    
  }