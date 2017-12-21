# Connector context
# provides logging services and execution of SQL in the user database

module Carto
  # This class provides remote database connection services based on FDW
  class Connector

    class Context

      attr_reader :user

      def initialize(logger:, user:)
        @logger     = logger
        @user       = user
      end

      def self.cast(arg)
        case arg
        when Context
          arg
        else
          new arg
        end
      end

      def log(message, truncate = true)
        @logger.append message, truncate if @logger
      end

      def execute_as_superuser(command)
        execute_in_user_database command, as: :superuser
      end

      def execute(command)
        execute_in_user_database command
      end

      # Execute SQL command returning array of results.
      # Commands with no results (e.g. UPDATE, etc.) will return an empty array (`[]`).
      # Result rows are returned as hashes with indifferent access.
      def execute_in_user_database(command, *args)
        # This admits Carto::User or User users
        db = @user.in_database(*args)
        data = case db
               when Sequel::Database
                 db.fetch(command).all
               else
                 db.execute command
               end
        data.map(&:with_indifferent_access)
      end

      def username
        @user.username
      end

      def database_username
        @user.database_username
      end
    end
  end
end
