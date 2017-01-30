
# This methods filters SQL statements that may include literas containing connector credentials.
def filter_sql_message(sql)
  if sql =~ /INSERT\s+INTO\s+"(data_imports|synchronizations)".+'connector'/mi ||
     sql =~ /UPDATE\s+"(data_imports|synchronizations)".+"service_name"\s*=\s*'connector'/mi ||
     sql =~ /UPDATE\s+"(data_imports|synchronizations)".+"service_item_id"\s*=\s*'{/mi
    # 1. for data_imports/synchronizations INSERTs or UPDATES that have a 'connector' literal
    #    (assuming it is the service_name) JSON-like '{...}' literals are filterered
    #    Note that we assume literals in the
    params = /'{.+}'/
    sql = sql.gsub(params, "'[FILTERED]'")
  elsif sql =~ /CREATE\s+USER\s+MAPPING\s+/mi
    # 2. for USER MAPPINGS we filter all options the statement is truncated at the OPTIONS
    options = /OPTIONS.+/mi
    sql = sql.gsub(options, '[FILTERED]')
  end
  sql
end

# Monkey-patch ActiveRecord logging to use the filtering

require 'active_record'
require 'active_record/log_subscriber'

module ActiveRecord
  class LogSubscriber
    alias :original_sql :sql

    def sql(event)
      event.payload[:sql] = filter_sql_message(event.payload[:sql])
      original_sql event
    end
  end
end

# Monkey-patch Sequel logging to use the filtering

require 'sequel'
require 'sequel/database'

module Sequel
  class Database
    alias :original_log_each :log_each

    def log_each(level, message)
      message = filter_sql_message(message)
      original_log_each level, message
    end
  end
end
