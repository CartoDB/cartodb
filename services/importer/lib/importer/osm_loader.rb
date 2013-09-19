# encoding: utf-8
require 'forwardable'
require_relative './osm2pgsql'

module CartoDB
  module Importer2
    class OsmLoader
      extend Forwardable
      TABLE_SUFFIXES    =  %w(line polygon roads point)
      TABLE_PREFIX      = 'importer'
      OSM_GEOM_NAME     = 'way'
      TYPE_CONVERSIONS  = {
        "line"      => "MULTILINESTRING",
        "polygon"   => "MULTIPOLYGON",
        "roads"     => "MULTILINESTRING",
        "points"    => "POINT"
      }

      def self.supported?(extension)
        extension == '.osm'
      end #self.supported?

      def initialize(job, source_file, osm2pgsql=nil)
        self.job            = job
        self.source_file    = source_file
        self.osm2pgsql      = osm2pgsql
      end #initialize

      def run
        job.log "Using database connection #{job.concealed_pg_options}"

        osm2pgsql.run
        job.log "osm2pgsql output:    #{osm2pgsql.command_output}"
        job.log "osm2pgsql exit code: #{osm2pgsql.exit_code}"

        raise LoadError if osm2pgsql.exit_code != 0
        valid_table_names.each    { |table_name| process(table_name) }
        invalid_table_names.each  { |table_name| drop(table_name) }
        self
      end #run

      def osm2pgsql
        @osm2pgsql ||= Osm2Pgsql.new(job.table_name, fullpath, pg_options)
      end #osm2pgsql

      def process(table_name)
        rename_column(table_name, OSM_GEOM_NAME, 'the_geom')
        normalize_the_geom_in(table_name, 'polygon') if polygon?(table_name)
        revoke_all_privileges_from_public_in(table_name)
      end #process

      def suffixed_table_names
        TABLE_SUFFIXES.map { |suffix| "#{job.table_name}_#{suffix}" }
      end #suffixed_table_names

      def valid_table_names
        @valid_table_names ||=
          suffixed_table_names.inject([]) do |valid_table_names, table_name|
            valid_table_names << table_name if data_in?(table_name)
            valid_table_names
          end
      end #valid_table_names

      def invalid_table_names
        suffixed_table_names - valid_table_names
      end #invalid_table_names

      def rename_column(table_name, column_name, new_name)
        job.db.run(%Q{
          ALTER TABLE "#{table_name}"
          RENAME COLUMN "#{column_name}"
          TO #{new_name}
        })
      end #rename_column


      def polygon?(table_name)
        !!table_name =~ /_polygon$/
      end #polygon?

      def normalize_the_geom_in(table_name, type)
        # Get all geoms to the same type instead of rebuilding the full column
        job.db.run(%Q{
          UPDATE "#{table_name}"
          SET the_geom = ST_Multi(the_geom)
          WHERE geometrytype(the_geom) != '#{TYPE_CONVERSIONS.fetch(type)}'
        })
      end #normalize_the_geom_in

      def revoke_all_privileges_from_public_in(table_name)
        job.db.run(%Q{
          REVOKE ALL PRIVILEGES
          ON TABLE "#{table_name}"
          FROM public
        })
      end #revoke_all_privileges_from_public_in

      private

      attr_writer     :osm2pgsql, :georeferencer
      attr_accessor   :job, :source_file

      def_delegators  :job,           :log, :id, :pg_options
      def_delegators  :source_file,   :fullpath, :name, :path
      def_delegators  :osm2pgsql,     :exit_code, :data_in?
    end # OsmLoader
  end # Importer2
end # CartoDB

