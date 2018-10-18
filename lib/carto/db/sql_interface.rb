module Carto
  module Db
    # Simple database interface that can be used through Sequel or ActiveRecord connections
    # (e.g. as returned by User#in_database and Carto::User#in_database respectively)
    # It provides two operations:
    # * run to execute an SQL statement disregarding any results
    # * fetch to obtain the resulting rows of a SQL SELECT
    #   the result is an array of hashes using symbol keys (with the name of the columns).
    #   The types of tuple values may vary between Sequel and ActiveRecord (ActiveRecord keeps them as text)
    #   If a block is passed to this method it receives each of the rows
    class SqlInterface
      class Error < RuntimeError; end

      module SequelConnection
        def run(sql)
          @db_connection.run(sql)
          nil
        rescue Sequel::DatabaseError => e
          raise Error.new(e.message)
        end

        def fetch(sql, &block)
          if block
            @db_connection.fetch(sql, &block)
            nil
          else
            @db_connection.fetch(sql, &block).all
          end
        rescue Sequel::DatabaseError => e
          raise Error.new(e.message)
        end
      end

      module ActiveRecordConnection
        def run(sql)
          @db_connection.execute(sql)
          nil
        rescue ActiveRecord::StatementInvalid => e
          raise Error.new(e.message)
        end

        def fetch(sql, &block)
          rows = @db_connection.select_all(sql).map(&:symbolize_keys)
          if block
            rows.each &block
            nil
          else
            rows
          end
        rescue ActiveRecord::StatementInvalid => e
          raise Error.new(e.message)
        end
      end

      def initialize(db_connection)
        @db_connection = db_connection
        case db_connection
        when Sequel::Postgres::Database
          extend SequelConnection
        when ActiveRecord::ConnectionAdapters::PostgreSQLAdapter
          extend ActiveRecordConnection
        else
          raise "Invalid database connection"
        end
      end
    end
  end
end
