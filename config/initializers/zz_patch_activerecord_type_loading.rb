# Activerecord every time it mades a connection brings all the `pg_type`
# data into a cache in order to do the relation between pg types and rails
# types
#
# What is the problem?
#
# Well in our users database we have 300K type. AR picks ~142K which leads to
# spent ~1.3s picking the data and ~0.5s in processing those records so we end
# spending about ~2s or more without needed in all our in_database operations
#
# How this fix works?
#
# Well, we filter all the table types (table, analysis tables, overviews) because
# in our app they aren't going to be used and in case they're need, Rails is going
# to query the database for it, so no problem.
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
