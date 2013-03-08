# encoding: utf-8

module CartoDB
  class ColumnTypecaster

    CONVERSION_MAP = {
      'float' => {
        'boolean'           => 'number_to_boolean'
      },
      'boolean' => {
        'double precision'  => 'boolean_to_number'
      },
      'string' => {
        'date'              => 'string_to_datetime',
        'datetime'          => 'string_to_datetime',
        'timestamp'         => 'string_to_datetime',
        'double precision'  => 'string_to_number',
        'boolean'           => 'string_to_boolean'
      }
    }

    def initialize(arguments)
      @user_database        = arguments.fetch(:user_database)
      @table_name           = arguments.fetch(:table_name)
      @column_name          = arguments.fetch(:column_name)
      @new_type             = arguments.fetch(:new_type)
    end #initialize

    def run
      user_database.transaction do straight_cast end
    rescue => exception
      # attempt various lossy conversions by regex nullifying 
      # unmatching data and retrying conversion.
      #
      # conversions ok by default:
      #   * number => string
      #   * boolean => string
      # TODO:
      #   * number  => datetime
      #   * boolean => datetime

      user_database.transaction do
        old_type = column_type(column_name)
        self.send conversion_method_for(old_type, new_type)
        straight_cast
      end
    end #run

    private

    attr_reader :user_database, :table_name, :column_name, :new_type, :old_type

    def conversion_method_for(old_type, new_type)
      CONVERSION_MAP.fetch(old_type.to_s).fetch(new_type.to_s)
    end #conversion_method_for

    def column_type(column_name)
      user_database.schema(table_name).select { |c|
        c[0] == column_name.to_sym
      }.flatten.last.fetch(:type).to_s
    end #column_type

    def straight_cast
      user_database.run(%Q{
        ALTER TABLE "#{table_name}"
        ALTER COLUMN #{column_name}
        TYPE #{new_type}
        USING cast(#{column_name} as #{new_type})
      })
    end #straight_cast

    def string_to_number
      user_database.run(%Q{
        UPDATE "#{table_name}"
        SET #{column_name}=NULL
        WHERE trim(\"#{column_name}\") !~* '^([-+]?[0-9]+(\.[0-9]+)?)$'
      })
    end #string_to_number

    def string_to_boolean
      falsy = "0|f|false"

      # normalise empty string to NULL
      user_database.run(%Q{
        UPDATE "#{table_name}"
        SET #{column_name}=NULL
        WHERE trim(\"#{column_name}\") ~* '^$'
      })

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

    def string_to_datetime
      # normalise empty string to NULL
      user_database.run(%Q{
        UPDATE "#{table_name}"
        SET "#{column_name}" = NULL
        WHERE \"#{column_name}\" = ''
      })
    end #string_to_datetime

    def boolean_to_number
      # first to string
      user_database.run(%Q{
        ALTER TABLE "#{table_name}"
        ALTER COLUMN #{column_name} TYPE text
        USING cast(#{column_name} as text)
      })

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

    def number_to_boolean
      # normalise 0 to falsy else truthy
      # first to string
      user_database.run(%Q{
        ALTER TABLE "#{table_name}"
        ALTER COLUMN #{column_name} TYPE text
        USING cast(#{column_name} as text)
      })

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
  end # ColumnTypecaster
end # CartoDB

