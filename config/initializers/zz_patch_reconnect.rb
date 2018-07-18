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

module PostgreSQLAutoReconnectionPatch
  # Queries the database and returns the results in an Array-like object
  def query(sql, name = nil) #:nodoc:
    with_auto_reconnect do
      super
    end
  end

  # Executes an SQL statement, returning a PGresult object on success
  # or raising a PGError exception otherwise.
  def execute(sql, name = nil)
    with_auto_reconnect do
      super
    end
  end

  def exec_query(sql, name = 'SQL', binds = [])
    with_auto_reconnect do
      super
    end
  end

  def exec_delete(sql, name = 'SQL', binds = [])
    with_auto_reconnect do
      super
    end
  end

  private

  def with_auto_reconnect
    yield
  rescue ActiveRecord::StatementInvalid
    raise unless @connection.status == PG::CONNECTION_BAD
    raise unless open_transactions.zero?

    reconnect!
    yield
  rescue PG::Error => e
    unless @connection.status == PG::CONNECTION_BAD
      raise "Not valid connection status: #{@connection.status}. Error: #{e.message}"
    end
    raise unless open_transactions.zero?
    raise unless e.message =~ /result has been cleared/

    reconnect!
    yield
  end
end

module ActiveRecord
  module ConnectionAdapters
    class PostgreSQLAdapter
      prepend PostgreSQLAutoReconnectionPatch
    end
  end
end
