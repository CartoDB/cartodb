require_relative '../../../lib/carto/table_utils'

describe Carto::TableUtils do
  class TableUtilsTest
    include Carto::TableUtils
  end

  table_utils = TableUtilsTest.new

  shared_examples 'safe quoting' do
    # https://www.postgresql.org/docs/9.3/static/sql-syntax-lexical.html#SQL-SYNTAX-IDENTIFIERS
    it 'quotes table names only if needed' do
      table_utils.safe_table_name_quoting('my_table').should eq 'my_table'
      table_utils.safe_table_name_quoting('my-table').should eq '"my-table"'
      table_utils.safe_table_name_quoting('my""ta-ble').should eq '"my""ta-ble"'
    end

    it 'does not quote already quoted strings' do
      table_utils.safe_table_name_quoting('"my-table"').should eq '"my-table"'
      table_utils.safe_table_name_quoting('"my""ta-ble"').should eq '"my""ta-ble"'
    end
  end

  describe '#safe_table_name_quoting' do
    include_examples 'safe quoting'
  end

  describe '#safe_schema_name_quoting' do
    include_examples 'safe quoting'
  end

  describe '#safe_schema_and_table_quoting' do
  it 'quotes table names only if needed' do
    table_utils.safe_schema_and_table_quoting('public', 'my_table').should eq 'public.my_table'
    table_utils.safe_schema_and_table_quoting('public', 'my-table').should eq 'public."my-table"'
    table_utils.safe_schema_and_table_quoting('public', 'my""ta-ble').should eq 'public."my""ta-ble"'
  end

  it 'does not quote already quoted strings' do
    table_utils.safe_schema_and_table_quoting('public', '"my-table"').should eq 'public."my-table"'
    table_utils.safe_schema_and_table_quoting('public', '"my""ta-ble"').should eq 'public."my""ta-ble"'
  end
  end
end
