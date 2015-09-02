# encoding: utf-8

require_relative '../../rspec_configuration'
require_relative '../../../app/models/table/column_typecaster'
require_relative '../../spec_helper'

describe CartoDB::ColumnTypecaster do

  describe '#pg_replace_expression' do
    before(:all) do
      @column_typecaster = CartoDB::ColumnTypecaster.new({
          user_database: nil,
          schema: nil,
          table_name: nil,
          column_name: nil,
          new_type: nil
        })
    end

    it 'takes a column_name and a set of replacements and returns a postgres expression that implements them' do
      # e.g.: as it if where in spanish locale
      thousand_separator = '.'
      decimal_separator = ','

      # order matters, the innermost expression will be applied first
      replacements = [
        [thousand_separator, ''],
        [decimal_separator, '.'],
        ['$', '']
      ]

      @column_typecaster.send(:pg_replace_expression, 'my_column', replacements)
        .should == %Q{replace(replace(replace("my_column", '.', ''), ',', '.'), '$', '')}
    end

    it 'returns an expression quasi-equivalent to the previous implementation' do
      # us locale
      thousand_separator = ','
      decimal_separator = '.'

      replacements = [
        [thousand_separator, ''],
        [decimal_separator, '.']
      ]

      @column_typecaster.send(:pg_replace_expression, 'my_column', replacements)
        .should == %Q{replace(replace("my_column", ',', ''), '.', '.')}
    end
  end

  describe '#date_to_number' do
    it 'casts a date column to its unix timestamp' do
      stub_named_maps_calls
      table = new_table(:user_id => $user_1.id)
      table.force_schema = "mydate timestamp with time zone"
      table.save

      birthday = '1980-05-31'.to_time
      table.insert_row!(mydate: birthday)
      table.insert_row!(mydate: nil)

      column_typecaster = CartoDB::ColumnTypecaster.new({
          user_database: $user_1.in_database,
          schema: $user_1.database_schema,
          table_name: table.name,
          column_name: 'mydate',
          new_type: 'number'
        })
      column_typecaster.run

      table.schema(reload: true).should include([:mydate, "number"])
      rows = table.run_query("select mydate from #{table.name} order by cartodb_id")[:rows]
      rows.first[:mydate].to_i.should == birthday.to_i
      rows.last[:mydate].should == nil

      table.destroy
    end
  end

end
