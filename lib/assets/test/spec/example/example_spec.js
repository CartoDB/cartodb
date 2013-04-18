describe("Util", function() {
  it ("should map some values", function() {
    var array = [1,2,3];
    var results = Util.map(array, function(item) {
      return item * 2;
    });

    expect(results).toEqual([2,4,6]);
  });

  it ("should reduce some values", function() {
    var array = [1,2,3];
    var result = Util.reduce(array, 0, function(acc, item){
      return acc + item;
    });

    expect(result).toEqual(6);
  });

  it ("should fail for the example", function() {
    expect(false).toBeTruthy();
  });
});
