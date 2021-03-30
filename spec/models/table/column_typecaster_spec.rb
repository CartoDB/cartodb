require_relative '../../../app/models/table/column_typecaster'

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
end
