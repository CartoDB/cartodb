# encoding: utf-8

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
      @table_name           = arguments.fetch(:table_name)
      @column_name          = arguments.fetch(:column_name)
      @new_type             = arguments.fetch(:new_type)
    end #initialize

    def run
      return if nothing_to_do
      user_database.transaction do straight_cast(@new_type.convert_to_db_type) end
    rescue => exception
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

    attr_reader :user_database, :table_name, :old_type

    def nothing_to_do
      @new_type.blank? || @new_type == column_type(@column_name).convert_to_cartodb_type
    end

    def conversion_method_for(old_type, new_type)
      CONVERSION_MAP.fetch(old_type.to_s).fetch(new_type.to_s.convert_to_db_type)
    end #conversion_method_for

    def column_type(column_name)
      user_database.schema(table_name).select { |c|
        c[0] == column_name.to_sym
      }.flatten.last.fetch(:db_type).to_s
    end #column_type

    def straight_cast(new_type=self.new_type, options = {})
      cast = options.fetch(:cast, "cast(#{column_name} as #{new_type})")
      user_database.run(%Q{
        ALTER TABLE "#{table_name}"
        ALTER COLUMN #{column_name}
        TYPE #{new_type}
        USING #{cast}
      })
    end #straight_cast

    def string_to_number
      thousand, decimal = get_digit_separators_for(column_name)
      normalize_digit_separators(thousand, decimal)
      nullify_if_non_convertible
    end #string_to_number

    def string_to_datetime
      raise(
        CartoDB::NonConvertibleData, 'Timestamp format not supported'
      ) unless convertible_to_datetime?(table_name, column_name)
      straight_cast("timestamptz", cast: "to_timestamp(#{column_name}::bigint)")
    rescue => exception
      straight_cast("timestamptz", cast: "CDB_StringToDate(#{column_name})")
    end #string_to_datetime

    def convertible_to_datetime?(table_name, column_name)
      !user_database[table_name.to_sym].with_sql(%Q{
        SELECT CDB_StringToDate(#{column_name})
        FROM #{table_name}
        AS convertible
      }).empty?
    end #convertible_to_datetime?

    def string_to_boolean
      falsy = "0|f|false"

      normalize_empty_string_to_null

      # normalise truthy (anything not false and NULL is true...)
      user_database.run(%Q{
        UPDATE "#{table_name}"
        SET #{column_name}='t'
        WHERE trim(\"#{column_name}\") !~* '^(#{falsy})$'
        AND #{column_name} IS NOT NULL
      })

      # normalise falsy
      user_database.run(%Q{
        UPDATE "#{table_name}"
        SET #{column_name}='f'
        WHERE trim(\"#{column_name}\") ~* '^(#{falsy})$'
      })
    end #string_to_boolean

    def boolean_to_number
      # first to string
      straight_cast('text')

      # normalise truthy to 1
      user_database.run(%Q{
        UPDATE "#{table_name}"
        SET #{column_name}='1'
        WHERE #{column_name} = 'true'
        AND #{column_name} IS NOT NULL
      })

      # normalise falsy to 0
      user_database.run(%Q{
        UPDATE "#{table_name}"
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
        UPDATE "#{table_name}"
        SET #{column_name}='t'
        WHERE #{column_name} !~* '^0$'
        AND #{column_name} IS NOT NULL
      })

      # normalise falsy
      user_database.run(%Q{
        UPDATE "#{table_name}"
        SET #{column_name}='f'
        WHERE #{column_name} ~* '^0$'
      })
    end #number_to_boolean

    def date_to_number
      straight_cast("double precision", cast: "CDB_DateToNumber(#{column_name})")
    end

    def date_to_boolean
      nullify
    end

    def normalize_empty_string_to_null
      user_database.run(%Q{
        UPDATE "#{table_name}"
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
        SELECT t,d
        FROM CDB_DigitSeparator('#{table_name}', '#{column_name}')
      }, &:to_a).first.values
    end #get_digit_separators

    def normalize_digit_separators(thousand=nil, decimal=nil)
      return unless thousand && decimal
      user_database.execute(%Q{
        UPDATE "#{table_name}"
        SET #{column_name} = replace(
          replace(#{column_name}, '#{thousand}', ''), '#{decimal}', '.'
        )
      })
    end #normalize_digit_separators
  end # ColumnTypecaster
end # CartoDB
