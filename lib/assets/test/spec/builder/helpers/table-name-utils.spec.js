var TableNameUtils = require('builder/helpers/table-name-utils');

describe('helpers/sql-utils', function () {
  it('._quoteIfNeeded', function () {
    expect(TableNameUtils._quoteIfNeeded('pepe')).toBe('pepe');
    expect(TableNameUtils._quoteIfNeeded('juanito_veinti3')).toBe('juanito_veinti3');
    expect(TableNameUtils._quoteIfNeeded('my-hyphen')).toBe('"my-hyphen"');
    expect(TableNameUtils._quoteIfNeeded('number42')).toBe('number42');
    expect(TableNameUtils._quoteIfNeeded('42numbers')).toBe('"42numbers"');
  });

  it('.getUnqualifiedName', function () {
    expect(TableNameUtils.getUnqualifiedName('pepe')).toBe('pepe');
    expect(TableNameUtils.getUnqualifiedName('juanito_veinti3')).toBe('juanito_veinti3');
    expect(TableNameUtils.getUnqualifiedName('"my-hyphen"')).toBe('my-hyphen');
    expect(TableNameUtils.getUnqualifiedName('pepe.juan')).toBe('juan');
    expect(TableNameUtils.getUnqualifiedName('"a-1"."33"')).toBe('33');
  });

  it('.getUsername', function () {
    expect(TableNameUtils.getUsername('pepe')).toBe('');
    expect(TableNameUtils.getUsername('"my-hyphen"')).toBe('');
    expect(TableNameUtils.getUsername('pepe.juan')).toBe('pepe');
    expect(TableNameUtils.getUsername('"a-1"."33"')).toBe('a-1');
  });

  it('.getQualifiedTableName', function () {
    expect(TableNameUtils.getQualifiedTableName('table', 'user', false)).toBe('table');
    expect(TableNameUtils.getQualifiedTableName('table', 'user', true)).toBe('user.table');
    expect(TableNameUtils.getQualifiedTableName('table', undefined, true)).toBe('table');

    expect(TableNameUtils.getQualifiedTableName('1table', 'user', false)).toBe('"1table"');
    expect(TableNameUtils.getQualifiedTableName('1table', 'user', true)).toBe('user."1table"');
    expect(TableNameUtils.getQualifiedTableName('1table', undefined, true)).toBe('"1table"');

    expect(TableNameUtils.getQualifiedTableName('table', 'user-me', false)).toBe('table');
    expect(TableNameUtils.getQualifiedTableName('table', 'user-me', true)).toBe('"user-me".table');
    expect(TableNameUtils.getQualifiedTableName('table', undefined, true)).toBe('table');

    expect(TableNameUtils.getQualifiedTableName('tabl-e', '1stuser', false)).toBe('"tabl-e"');
    expect(TableNameUtils.getQualifiedTableName('tabl-e', '1stuser', true)).toBe('"1stuser"."tabl-e"');
    expect(TableNameUtils.getQualifiedTableName('tabl-e', undefined, true)).toBe('"tabl-e"');
  });

  it('.isSameTableName', function () {
    expect(TableNameUtils.isSameTableName('table', 'table', 'user')).toBe(true);
    expect(TableNameUtils.isSameTableName('table', 'table2', 'user')).toBe(false);
    expect(TableNameUtils.isSameTableName('table', '"table"', 'user')).toBe(true);

    expect(TableNameUtils.isSameTableName('user.table', 'table', 'user')).toBe(true);
    expect(TableNameUtils.isSameTableName('user.table', 'user2.table', 'user')).toBe(false);
    expect(TableNameUtils.isSameTableName('user2.table', 'user2.table', 'user')).toBe(true);
  });
});
