# encoding: utf-8

module CartoDB
  class ColumnConverter
    def initialize(arguments)
      @user_database  = arguments.fetch(:user_database)
      @table_name     = arguments.fetch(:table_name)
      @column_name    = arguments.fetch(:column_name)
      @new_type       = arguments.fetch(:new_type)
      @old_type       = col_type(column_name)
    end #initialize

    def run
      user_database.transaction { straight_cast }
    rescue => exception
      # attempt various lossy conversions by regex nullifying 
      # unmatching data and retrying conversion.
      #
      # conversions ok by default:
      #   number => string
      #   boolean => string

      user_database.transaction do
        string_to_number    if string_to_number?
        string_to_boolean   if string_to_boolean?
        number_to_boolean   if number_to_boolean?
        boolean_to_number   if boolean_to_number?
        string_to_datetime  if string_to_datetime?

        retry_conversion
      end
    end #run

    private

    attr_reader :user_database, :table_name, :column_name, :new_type, :old_type

    def number_to_boolean?
      old_type == 'float' && new_type == 'boolean'
    end #number_to_boolean?

    def boolean_to_number?
      old_type == 'boolean' && new_type == 'double precision'
    end #boolean_to_number?

    def string_to_datetime?
      old_type == 'string' && %w(date datetime timestamp).include?(new_type)
    end #string_to_datetime?

    def string_to_number?
      old_type == 'string' && new_type == 'double precision'
    end #string_to_number?

    def string_to_boolean?
      old_type == 'string' && new_type == 'boolean'
    end #string_to_boolean?

    def col_type(column_name)
      user_database.schema(table_name).select { |c|
        c[0] == column_name.to_sym
      }.flatten.last.fetch(:type)
    end #col_type

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
        WHERE #{column_name} = 'true' AND #{column_name} IS NOT NULL
      })

      # normalise falsy to 0
      user_database.run(%Q{
        UPDATE "#{table_name}"
        SET #{column_name}='0'
        WHERE #{column_name} = 'false' AND #{column_name} IS NOT NULL
      })
    end #boolean_to_numer

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
        WHERE #{column_name} !~* '^0$' AND #{column_name} IS NOT NULL
      })

      # normalise falsy
      user_database.run(%Q{
        UPDATE "#{table_name}"
        SET #{column_name}='f'
        WHERE #{column_name} ~* '^0$'
      })
    end #number_to_boolean

    def retry_conversion
      # TODO:
      # * number  => datetime
      # * boolean => datetime
      #
      # Maybe do nothing? Does it even make sense? 
      # Best to throw error here for now.
      #
      # try to update normalised column to new type 
      # (if fails here, well, we have not lost anything)
      user_database.run(%Q{
        ALTER TABLE "#{table_name}"
        ALTER COLUMN #{column_name}
        TYPE #{new_type}
        USING cast(#{column_name} as #{new_type})
      })
    end #retry_conversion
  end # ColumnConverter
end # CartoDB

