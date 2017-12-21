describe('localStorage', function() {
  var storage;

  beforeAll(function () {
    localStorage.removeItem('tests');
  });

  beforeEach(function () {
    storage = new cdb.admin.localStorage('tests');
  });

  afterEach(function () {
    localStorage.clear();
  })

  afterAll(function () {
    localStorage.removeItem('tests');
  });

  it("should contain an empty array after initialized", function() {
    expect(storage.get()).toEqual([])
  })

  it("add a element to localStorage", function() {
    var obj = {'test':true};
    storage.add(obj)
    expect(storage.get(0)).toEqual(obj)
  });

  it("should be able to set the whole array", function() {
    storage.set([1,2,3,4]);
    expect(storage.get()).toEqual([1,2,3,4]);
  })

  it("should be able to retrieve the n element", function() {
    storage.add(1);
    storage.add(2);
    storage.add(3);
    expect(storage.get(1)).toEqual(2);
  })

  it("should be able to retrieve the n element and transform it on an object", function() {
    storage.add({'hello':'bye'});
    expect(storage.get(0).hello).toEqual('bye');
  })

  it("should persist on localStorage when added", function() {
    storage.add(1);
    expect(localStorage.getItem('tests')).toBeDefined();
    expect(localStorage.getItem('tests')).toBe("[1]");
  })

  it("should remove an element", function() {
    storage.add(1);
    storage.add(2);
    storage.add(3);
    storage.remove(1);
    expect(storage.get()).toEqual([1,3]);
  })

  it("should destroy the storage", function() {
    storage.add(1);
    storage.destroy();
    expect(localStorage.getItem('tests')).toBeFalsy();
  })
});
