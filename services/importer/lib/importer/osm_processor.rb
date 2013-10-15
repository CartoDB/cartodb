# encoding: utf-8

module CartoDB
  module Importer2
    class OsmProcessor
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
      end #initialize

      def run
        job.log "Postprocessing OSM"
        wait_for_table_present("#{job.table_name}_line")
        valid_table_names.each    { |table_name| process(table_name) }
        invalid_table_names.each  { |table_name| drop(table_name) }
        self
      end #run

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

      def data_in?(table_name)
        job.db[%Q(
          SELECT count(*)
          AS count
          FROM "#{table_name}"
        )].first.fetch(:count) > 0
      end #data_in?

      def wait_for_table_present(table_name, started_at=Time.now)
        sleep 1
        data_in?(table_name)
        self
      rescue => exception
        raise if timeout?(started_at)
        retry
      end #wait_for_table_present

      def timeout?(started_at)
        (Time.now - started_at) > 20
      end #timeout?

      private

      attr_writer     :georeferencer
      attr_accessor   :job, :source_file
    end # OsmLoader
  end # Importer2
end # CartoDB

