# Every time Activerecord makes a connection, it brings all the `pg_type`
# data into a cache in order to do mapping between pg types and rails types
#
# What is the problem?
#
# Well in our users database we have 300K type. AR picks ~142K which leads to
# spending ~1.3s picking the data and ~0.5s in processing those records so we end
# spending about ~2s or more without a need in all our in_database operations
#
# How does this fix work?
#
# Well, we filter all the table types (table, analysis tables, overviews) because
# in our app they aren't going to be used and in case they're needed, Rails is going
# to query the database for it, so no problem.
#
# This patch was developed for rails 4.2.10, in case of update you need to review it
# to verify if it needs to be modified or even removed.
module ActiveRecord
  module ConnectionAdapters
    module PostgreSQL
      module OID # :nodoc:
        class TypeMapInitializer # :nodoc:
          def query_conditions_for_initial_load(type_map)
            known_type_names = type_map.keys.map { |n| "'#{n}'" }
            known_type_types = %w('r' 'e' 'd')
            <<-SQL % [known_type_names.join(", "), known_type_types.join(", ")]
              LEFT JOIN pg_type as tt ON (tt.typtype = 'c' AND tt.typarray = t.oid AND tt.typinput = 'record_in(cstring,oid,integer)'::regprocedure)
              WHERE
                tt.oid is null
                AND (t.typname IN (%s)
                OR t.typtype IN (%s)
                OR t.typinput = 'array_in(cstring,oid,integer)'::regprocedure
                OR t.typelem != 0)
            SQL
          end
        end
      end
    end
  end
end
