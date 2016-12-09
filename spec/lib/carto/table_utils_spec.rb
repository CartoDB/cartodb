require_relative '../../../lib/carto/table_utils'

describe Carto::TableUtils do
  class TableUtilsTest
    include Carto::TableUtils
  end

  table_utils = TableUtilsTest.new

  shared_examples 'safe quoting' do
    # https://www.postgresql.org/docs/9.3/static/sql-syntax-lexical.html#SQL-SYNTAX-IDENTIFIERS
    it 'does not quotes table names if not needed' do
      table_utils.safe_table_name_quoting('mytable1').should eq 'mytable1'
      table_utils.safe_table_name_quoting('my_table').should eq 'my_table'
      table_utils.safe_table_name_quoting('my$table').should eq 'my$table'
    end

    it 'quotes table names if needed' do
      table_utils.safe_table_name_quoting('my-table').should eq '"my-table"'
      table_utils.safe_table_name_quoting('02-34').should eq '"02-34"'
      table_utils.safe_table_name_quoting('my""ta-ble').should eq '"my""ta-ble"'
    end

    it 'does not quote already quoted strings' do
      table_utils.safe_table_name_quoting('"my-table"').should eq '"my-table"'
      table_utils.safe_table_name_quoting('"my""ta-ble"').should eq '"my""ta-ble"'
    end

    it 'does not quote names with schema, even if they are wrong (quoting should be fixed upstream)' do
      ['user.table', '"user".table', 'user."table"', '"user"."table"',
       'u-ser.t-able', '"u-ser".t-able', 'u-ser."t-able"', '"u-ser"."t-able"'].each do |table_name|
        table_utils.safe_table_name_quoting(table_name).should eq table_name
      end
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

    it 'quotes table names starting with numbers' do
      table_utils.safe_schema_and_table_quoting('public', '42').should eq 'public."42"'
      table_utils.safe_schema_and_table_quoting('public', 'a42').should eq 'public.a42'
    end

    it 'does not quote already quoted strings' do
      table_utils.safe_schema_and_table_quoting('public', '"my-table"').should eq 'public."my-table"'
      table_utils.safe_schema_and_table_quoting('public', '"my""ta-ble"').should eq 'public."my""ta-ble"'
    end
  end
end
