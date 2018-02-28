var populateRoute = require('builder/routes/populate-route');

describe('routes/populateRoute', function () {
  it('should return the route if no arguments', function () {
    expect(populateRoute('settings')).toBe('settings');
  });

  it('should replace a single mandatory argument with the provided value', function () {
    expect(populateRoute('rick/:rickId', { rickId: 'c-137' })).toBe('rick/c-137');
  });

  it('should replace multiple mandatory arguments with the provided values', function () {
    var args = { meeseeksId: '19871806', taskName: 'makesummerpopular' };
    var result = populateRoute('meeseeks/:meeseeksId/:taskName', args);
    expect(result).toBe('meeseeks/19871806/makesummerpopular');
  });

  it('should ignore optional arguments if not provided', function () {
    expect(populateRoute('morty(/:mortyId)')).toBe('morty');
  });

  it('should replace optional arguments properly', function () {
    expect(populateRoute('morty(/:mortyId)', { mortyId: 'c-137' })).toBe('morty/c-137');
  });
});
