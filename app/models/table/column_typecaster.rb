module CartoDB
  class ColumnTypecaster

    CONVERSION_MAP = {
      'number' => {
        'boolean'           => 'number_to_boolean',
        'date'              => 'number_to_datetime',
        'datetime'          => 'number_to_datetime',
        'timestamp'         => 'number_to_datetime',
        'timestamptz'       => 'number_to_datetime'
      },
      'boolean' => {
        'double precision'  => 'boolean_to_number',
        'date'              => 'boolean_to_datetime',
        'datetime'          => 'boolean_to_datetime',
        'timestamp'         => 'boolean_to_datetime',
        'timestamptz'       => 'boolean_to_datetime'
      },
      'string' => {
        'date'              => 'string_to_datetime',
        'datetime'          => 'string_to_datetime',
        'timestamp'         => 'string_to_datetime',
        'timestamptz'       => 'string_to_datetime',
        'double precision'  => 'string_to_number',
        'boolean'           => 'string_to_boolean'
      },
      'date' => {
        'double precision'  => 'date_to_number',
        'boolean'           => 'date_to_boolean'
      }
    }

    def initialize(arguments)
      @user_database        = arguments.fetch(:user_database)
      @schema               = arguments.fetch(:schema)
      @table_name           = arguments.fetch(:table_name)
      @column_name          = arguments.fetch(:column_name)
      @new_type             = arguments.fetch(:new_type)
    end

    def run
      return if nothing_to_do
      user_database.transaction do straight_cast(@new_type.convert_to_db_type) end
    rescue StandardError
      # attempt various lossy conversions by regex nullifying
      # unmatching data and retrying conversion.
      #
      # conversions ok by default:
      #   * number => string
      #   * boolean => string
      user_database.transaction do
        old_type = column_type(column_name).convert_to_cartodb_type
        self.send conversion_method_for(old_type, new_type)
        straight_cast(@new_type.convert_to_db_type)
      end
    end #run

    protected

    attr_reader :new_type, :column_name

    private

    attr_reader :user_database, :table_name, :schema, :old_type

    def qualified_table
      "\"#{schema}\".\"#{table_name}\""
    end

    def nothing_to_do
      @new_type.blank? || @new_type == column_type(@column_name).convert_to_cartodb_type
    end

    def conversion_method_for(old_type, new_type)
      CONVERSION_MAP.fetch(old_type.to_s).fetch(new_type.to_s.convert_to_db_type)
    end #conversion_method_for

    def column_type(column_name)
      user_database.schema(table_name, schema: @schema, reload: true).select { |c|
        c[0] == column_name.to_sym
      }.flatten.last.fetch(:db_type).to_s
    end #column_type

    def straight_cast(new_type=self.new_type, options = {})
      cast = options.fetch(:cast, "cast(#{column_name} as #{new_type})")
      user_database.run(%Q{
        ALTER TABLE #{qualified_table}
        ALTER COLUMN #{column_name}
        TYPE #{new_type}
        USING #{cast}
      })
    end #straight_cast

    def string_to_number
      thousand_separator, decimal_separator = get_digit_separators_for(column_name)
      normalize_number(thousand_separator, decimal_separator)
      nullify_if_non_convertible
    end

    def string_to_datetime
      straight_cast('timestamptz', cast: "cartodb.CDB_StringToDate(#{column_name})")
    end #string_to_datetime

    def string_to_boolean
      falsy = '0|f|false'

      normalize_empty_string_to_null

      # normalise truthy (anything not false and NULL is true...)
      user_database.run(%Q{
        UPDATE #{qualified_table}
        SET #{column_name}='t'
        WHERE trim(\"#{column_name}\") !~* '^(#{falsy})$'
        AND #{column_name} IS NOT NULL
      })

      # normalise falsy
      user_database.run(%Q{
        UPDATE #{qualified_table}
        SET #{column_name}='f'
        WHERE trim(\"#{column_name}\") ~* '^(#{falsy})$'
      })
    end #string_to_boolean

    def boolean_to_number
      # first to string
      straight_cast('text')

      # normalise truthy to 1
      user_database.run(%Q{
        UPDATE #{qualified_table}
        SET #{column_name}='1'
        WHERE #{column_name} = 'true'
        AND #{column_name} IS NOT NULL
      })

      # normalise falsy to 0
      user_database.run(%Q{
        UPDATE #{qualified_table}
        SET #{column_name}='0'
        WHERE #{column_name} = 'false'
        AND #{column_name} IS NOT NULL
      })
    end #boolean_to_number

    def boolean_to_datetime
      straight_cast('text')
      nullify(column_name)
    end #boolean_to_datetime

    alias_method :number_to_datetime, :boolean_to_datetime

    def number_to_boolean
      straight_cast('text')

      # normalise 0 to falsy else truthy
      # normalise truthy
      user_database.run(%Q{
        UPDATE #{qualified_table}
        SET #{column_name}='t'
        WHERE #{column_name} !~* '^0$'
        AND #{column_name} IS NOT NULL
      })

      # normalise falsy
      user_database.run(%Q{
        UPDATE #{qualified_table}
        SET #{column_name}='f'
        WHERE #{column_name} ~* '^0$'
      })
    end #number_to_boolean

    def date_to_number
      straight_cast('double precision', cast: "cartodb.CDB_DateToNumber(#{column_name})")
    end

    def date_to_boolean
      nullify
    end

    def normalize_empty_string_to_null
      user_database.run(%Q{
        UPDATE #{qualified_table}
        SET "#{column_name}" = NULL
        WHERE \"#{column_name}\" = ''
      })
    end #normalize_empty_string_to_null

    def nullify(column_name=self.column_name)
      user_database.run(%Q{
        UPDATE "#{table_name}"
        SET #{column_name} = NULL
      })
    end #nullify

    def nullify_if_non_convertible
      user_database.run(%Q{
        UPDATE "#{table_name}"
        SET #{column_name}=NULL
        WHERE trim(\"#{column_name}\") !~* '^([-+]?[0-9]+(\.[0-9]+)?)$'
      })
    end #nullify_if_non_convertible

    def get_digit_separators_for(column_name)
      user_database.execute(%Q{
        SELECT t,d FROM cartodb.CDB_DigitSeparator('#{table_name}', '#{column_name}')
      }, &:to_a).first.values
    end #get_digit_separators

    def normalize_number(thousand_separator=nil, decimal_separator=nil)
      return unless thousand_separator && decimal_separator

      replacements = [
        [thousand_separator, ''],
        [decimal_separator, '.'],
        ['$', ''],
        ['€', '']
      ]

      user_database.execute(%Q{
        UPDATE #{qualified_table}
        SET "#{column_name}" = trim(#{pg_replace_expression(column_name, replacements)})
      })
    end

    # Takes a column_name and a mapping of replacements and returns an expression such as:
    #   replace(replace(replace(column_name, k1, v1), k2, v2), k3, v3)
    def pg_replace_expression(column_name, replacement_map=[])
      # base case
      k1, v1 = replacement_map.shift
      expression = %Q{replace("#{column_name}", '#{k1}', '#{v1}')}

      # rest
      replacement_map.each do |k, v|
        expression = %Q{replace(#{expression}, '#{k}', '#{v}')}
      end

      return expression
    end
  end
end
