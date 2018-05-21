const styles = require('builder/data/default-cartography.json');

describe('views/public-dataset/map-view', function () {
  // Just in case somebody unpurposefully changes the shape of the default cartography
  it('default geography should have the proper shape', function () {
    expect(styles.simple.line.stroke.color.fixed).not.toBeUndefined();
    expect(styles.simple.line.stroke.size.fixed).not.toBeUndefined();
    expect(styles.simple.line.stroke.color.opacity).not.toBeUndefined();
    expect(styles.simple.point.fill.size.fixed).not.toBeUndefined();
    expect(styles.simple.point.fill.color.fixed).not.toBeUndefined();
    expect(styles.simple.point.fill.color.opacity).not.toBeUndefined();
    expect(styles.simple.point.stroke.color.fixed).not.toBeUndefined();
    expect(styles.simple.point.stroke.size.fixed).not.toBeUndefined();
    expect(styles.simple.point.stroke.color.opacity).not.toBeUndefined();
    expect(styles.simple.polygon.fill.color.fixed).not.toBeUndefined();
    expect(styles.simple.polygon.fill.color.opacity).not.toBeUndefined();
    expect(styles.simple.polygon.stroke.color.fixed).not.toBeUndefined();
    expect(styles.simple.polygon.stroke.size.fixed).not.toBeUndefined();
    expect(styles.simple.polygon.stroke.color.opacity).not.toBeUndefined();
  });
});
