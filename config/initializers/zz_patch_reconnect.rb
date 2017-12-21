# This patches the default behavior of ActiveRecord not recovering from PG::Error
# connection failures.
#
# When an ActiveRecord connection to PostgreSQL fails, it returns a
# PG::Error: connection not open.
#
# However, this does not close the connection, which is reused over and over,
# causing a failure even if the PostgreSQL server is already back.
#
# The original code was taken from:
# https://github.com/rails/rails/pull/6557
# which was not merged for some reason - instead
# https://github.com/rails/rails/pull/6654
# was merged, which does not fix the issue as, even though verify! now works,
# it is never called actively by Rails (tested on latest 3.2.x version).
#

module ActiveRecord
  module ConnectionAdapters
    class PostgreSQLAdapter

      # Queries the database and returns the results in an Array-like object
      def query(sql, name = nil) #:nodoc:
        wrap_execute(sql, name) do
          result_as_array @connection.async_exec(sql)
        end
      end

      # Executes an SQL statement, returning a PGresult object on success
      # or raising a PGError exception otherwise.
      def execute(sql, name = nil)
        wrap_execute(sql, name) do
          @connection.async_exec(sql)
        end
      end


      def exec_query(sql, name = 'SQL', binds = [])
        wrap_execute(sql, name, binds) do
          result = binds.empty? ? exec_no_cache(sql, binds) :
                                  exec_cache(sql, binds)

          ret = ActiveRecord::Result.new(result.fields, result_as_array(result))
          result.clear
          return ret
        end
      end

      def exec_delete(sql, name = 'SQL', binds = [])
        wrap_execute(sql, name, binds) do
          result = binds.empty? ? exec_no_cache(sql, binds) :
                                  exec_cache(sql, binds)
          affected = result.cmd_tuples
          result.clear
          affected
        end
      end

      def wrap_execute(sql, name = "SQL", binds = [])
        with_auto_reconnect do
          log(sql, name, binds) do
            yield
          end
        end
      end

      def with_auto_reconnect
        yield

      rescue ActiveRecord::StatementInvalid
        raise unless @connection.status == PG::CONNECTION_BAD
        raise unless open_transactions == 0

        reconnect!
        yield
      rescue PG::Error => e
        unless @connection.status == PG::CONNECTION_BAD
          raise "Not valid connection status: #{@connection.status}. Error: #{e.message}"
        end
        raise unless open_transactions == 0
        raise unless e.message =~ /result has been cleared/

        reconnect!
        yield
      end
    end
  end
end
