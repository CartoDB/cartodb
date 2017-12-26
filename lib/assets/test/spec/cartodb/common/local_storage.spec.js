var LocalStorage = require('../../../../javascripts/cartodb/common/local_storage');

describe('common/local_storage', function () {
  var storage;

  beforeAll(function () {
    localStorage.removeItem('tests');
  });

  beforeEach(function () {
    localStorage.clear();
    storage = new LocalStorage('tests');
  });

  afterEach(function () {
    localStorage.clear();
  });

  afterAll(function () {
    localStorage.removeItem('tests');
  });

  it('should contain an empty array after initialized', function () {
    expect(storage.get()).toEqual({});
  });

  it('add a element to localStorage', function () {
    var obj = {'test': true};
    storage.add(obj);
    expect(storage.get('test')).toEqual(true);
  });

  it('should be able to set the whole array', function () {
    storage.set({testing: [1, 2, 3, 4]});
    expect(storage.get()).toEqual({testing: [1, 2, 3, 4]});
  });

  it('should be able to retrieve the n element', function () {
    storage.add({v1: 1});
    storage.add({v2: 2});
    storage.add({v3: 3});
    expect(storage.get('v1')).toEqual(1);
    expect(storage.get(0)).toEqual(undefined);
  });

  it('should be able to retrieve the n element and transform it on an object', function () {
    storage.add({'hello': 'bye'});
    expect(storage.get('hello')).toEqual('bye');
    expect(storage.get('bye')).not.toEqual('hello');
  });

  it('should persist on localStorage when added', function () {
    storage.add({ value: '2' });
    expect(localStorage.getItem('tests')).toBeDefined();
    expect(localStorage.getItem('tests')).toBe('{"value":"2"}');
  });

  it('should remove an element', function () {
    storage.add({v1: 1});
    storage.add({v2: 2});
    storage.add({v3: 3});
    storage.remove('v1');
    expect(storage.get()).toEqual({v2: 2, v3: 3});
  });

  it('should destroy the storage', function () {
    storage.add({value: 1});
    storage.destroy();
    expect(localStorage.getItem('tests')).toBeFalsy();
  });
});
