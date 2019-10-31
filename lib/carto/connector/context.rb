# Connector context
# provides logging services and execution of SQL in the user database

module Carto
  # This class provides remote database connection services based on FDW
  class Connector

    class Context

      attr_reader :user

      def initialize(logger:, user:)
        @logger        = logger
        @user          = user
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

      def execute_with_timeout(command, timeout)
        execute_in_user_database command, statement_timeout: timeout
      end

      def execute_as_superuser_with_timeout(command, timeout)
        execute_in_user_database command, as: :superuser, statement_timeout: timeout
      end

      # Execute SQL command returning array of results.
      # Commands with no results (e.g. UPDATE, etc.) will return an empty array (`[]`).
      # Result rows are returned as hashes with indifferent access.
      def execute_in_user_database(command, *args)
        # FIXME: consider using ::User#transaction_with_timeout or in_database_direct_connection

        statement_timeout = args.first.delete :statement_timeout if args.first

        data = nil
        @user.in_database(*args) do |db|
          db.transaction do
            unless statement_timeout.nil?
              old_timeout = db.fetch("SHOW statement_timeout;").first[:statement_timeout]
              exec_sql(db, "SET statement_timeout TO '#{statement_timeout}'")
            end

            begin
              data = exec_sql(db, command)
            ensure
              unless statement_timeout.nil?
                exec_sql(db, "SET statement_timeout TO '#{old_timeout}';")
              end
            end
          end
        end
        data
      end

      def username
        @user.username
      end

      def database_username
        @user.database_username
      end

      attr_reader :user

      private
      def exec_sql(db, sql)
        case db
        when  Sequel::Database
          db.fetch(command).all
        else
          db.execute command
        end.map(&:with_indifferent_access)
      end
    end
  end
end
