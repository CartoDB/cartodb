# encoding: utf-8

module CartoDB
  module Connector
    class Importer
      ORIGIN_SCHEMA       = 'cdb_importer'
      DESTINATION_SCHEMA  = 'public'

      attr_accessor :table

      def initialize(runner, quota_checker, database, data_import_id, user)
        @runner           = runner
        @quota_checker    = quota_checker
        @database         = database
        @data_import_id   = data_import_id
        @user             = user
      end

      def run(tracker)
        runner.run(&tracker)

        if quota_checker.will_be_over_table_quota?(results.length)
          drop(results)
        else
          results.select(&:success?).each { |result| register(result) }
        end

        self
      end

      def register(result)
        name = rename(result.table_name, result.name)
        move_to_schema(name, result.schema, DESTINATION_SCHEMA)
      end

      def success?
        !quota_checker.over_table_quota? && runner.success?
      end

      def drop_all(results)
        results.each { |result| drop(result.qualified_table_name) }
      end

      def drop(table_name)
        database.execute(%Q(DROP TABLE #{table_name}))
      rescue
        self
      end

      def move_to_schema(name, origin_schema,
      destination_schema=DESTINATION_SCHEMA)
        return self if origin_schema == destination_schema
        database.execute(%Q{
          ALTER TABLE "#{origin_schema}"."#{name}"
          SET SCHEMA "#{DESTINATION_SCHEMA}"
        })
      end

      def rename(current_name, new_name, schema=ORIGIN_SCHEMA, rename_attempts=0)
        rename_attempts = rename_attempts + 1
        new_name = ::Table.get_valid_table_name(
          new_name, name_candidates: user.taken_table_names
        )
      
        database.execute(%Q{
          ALTER TABLE "#{schema}"."#{current_name}"
          RENAME TO "#{new_name}"
        })
        self.table_name = new_name

        rename_the_geom_index_if_exists(current_name, new_name)
        new_name
      rescue => exception
        retry unless rename_attempts > 1
      end

      def rename_the_geom_index_if_exists(current_name, new_name)
        database.execute(%Q{
          ALTER INDEX "#{ORIGIN_SCHEMA}"."#{current_name}_geom_idx"
          RENAME TO "#{new_name}_the_geom_idx"
        })
      rescue => exception
      end

      def persist_metadata(name, data_import_id)
        table_registrar.register(name, data_import_id)
        self.table = table_registrar.table
        self
      end

      def results
        runner.results
      end 

      def error_code
        return 8002 if quota_checker.over_table_quota?
        results.map(&:error_code).compact.first
      end #errors_from

      attr_reader :table_name

      private

      attr_reader :runner, :quota_checker, :database,
      :data_import_id, :user
      attr_writer :table_name
    end # Importer
  end # Connector
end # CartoDB

