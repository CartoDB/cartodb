import * as Table from 'new-dashboard/core/table';

describe('table.js', () => {
  describe('getUnqualifiedName', () => {
    it('should return unqualified name', () => {
      expect(Table.getUnqualifiedName('unqualified.untitled_table_2')).toEqual('untitled_table_2');
    });
  });
});
