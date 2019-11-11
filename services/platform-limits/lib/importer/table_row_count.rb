module CartoDB
  module PlatformLimits
    module Importer

      # This limit uses User.max_import_table_row_count attribute to limit table size regarding row count.
      # Has no storage.
      #
      # 'context' is expected to be:
      # Hash {
      #   :table_name String
      #   :tables_schema String|nil (Optional, defaults to import schema 'cdb_importer')
      # }
      class TableRowCount < AbstractLimit

        # Where to search for the table if no schema specified at context
        DEFAULT_SCHEMA = 'cdb_importer'

        # This limit needs additional fields present at options Hash:
        # :db
        # :user  (already defined, but mandatory)
        # @see CartoDB::PlatformLimits::AbstractLimit initialize()
        # @throws ArgumentError
        def initialize(options={})
          super(options)

          raise ArgumentError.new('Must supply a user object') if user.nil?
          unless user.respond_to?(:max_import_table_row_count)
            raise ArgumentError.new('Supplied user object must have :max_import_table_row_count')
          end
          unless user.max_import_table_row_count.is_a?(Integer) && user.max_import_file_size > 0
            raise ArgumentError.new('invalid user max_import_table_row_count (must be positive integer)')
          end
          self.max_value = user.max_import_table_row_count

          @db = options.fetch(:db, nil)
          raise ArgumentError.new('Must supply db connection object') if @db.nil?
        end

        protected

        attr_accessor :db

        def subkey
          'Importer:TableRowCount'
        end

        # @param context mixed
        # @return bool
        def is_over_limit(context)
          get(context) > max_value
        end

        # Gets current value of the limit
        # @param context mixed
        # Hash {
        #   :table_name String
        #   :tables_schema String|nil (Optional, defaults to import schema)
        # }
        # @return mixed
        # @throws ArgumentError
        def get(context)
          raise ArgumentError.new('context must be a hash') unless context.is_a?(Hash)

          table_name = context.fetch(:table_name, nil)
          raise ArgumentError.new('context must be a hash') if table_name.nil?
          schema_name = context.fetch(:tables_schema, DEFAULT_SCHEMA)

          db.fetch(%Q{
                      SELECT reltuples::bigint AS row_count
                        FROM pg_class
                        WHERE oid='#{schema_name}.#{table_name}'::regclass;
                   })
            .first[:row_count]
        end

        # Gets the maximum limit value
        # @param context mixed
        # @return mixed
        def get_maximum(context)
          max_value
        end

        # Gets when the limit expires
        # @param context mixed
        # @return integer|nil Timestamp
        def get_time_period(context)
          nil
        end

        # Increases the limit
        # @param context mixed
        # @param amount integer
        def increase(context, amount=1)
          # Not useful here
        end

        # Decreases the limit
        # @param context mixed
        # @param amount integer
        def decrease(context, amount=1)
          # Not useful here
        end

        # Resets the limit
        def expire
          # Does nothing
        end

      end
    end
  end
end
