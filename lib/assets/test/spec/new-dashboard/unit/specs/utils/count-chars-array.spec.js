import countCharsArray from 'new-dashboard/utils/count-chars-array';

describe('count-chars-array.js', () => {
  it('count correctly the number of total chars in array', () => {
    const array1 = null;
    const array2 = [];
    const array3 = ['abc'];
    const array4 = ['abcd', '1234', 'my own test'];

    expect(countCharsArray(array1, '')).toBe(0);
    expect(countCharsArray(array1, '--')).toBe(0);
    expect(countCharsArray(array2, '')).toBe(0);
    expect(countCharsArray(array2, '...')).toBe(0);
    expect(countCharsArray(array3)).toBe(3);
    expect(countCharsArray(array3, '<--->')).toBe(3);
    expect(countCharsArray(array4)).toBe(19);
    expect(countCharsArray(array4, null)).toBe(19);
    expect(countCharsArray(array4, ' && ')).toBe(27);
  });
});
