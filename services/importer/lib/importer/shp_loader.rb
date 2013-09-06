# encoding: utf-8
require 'forwardable'
require_relative './shp2pgsql'
require_relative './georeferencer'
require_relative './reprojector'

module CartoDB
  module Importer2
    class ShpLoader
      extend Forwardable

      TABLE_PREFIX = 'importer'

      def self.supported?(extension)
        %w{ .shp .tab }.include?(extension)
      end #self.supported?

      def initialize(job, source_file, shp2pgsql=nil)
        self.job          = job
        self.source_file  = source_file
        self.shp2pgsql    = shp2pgsql
      end #initialize

      def run
        job.log "Using database connection #{job.concealed_pg_options}"

        shp2pgsql.run
        job.log "shp2pgsql output:    #{shp2pgsql.command_output}"
        job.log "shp2pgsql exit code: #{shp2pgsql.exit_code}"

        raise LoadError if shp2pgsql.exit_code != 0
        drop_the_geom_webmercator
        reproject
        self
      end #run

      def valid_table_names
        [job.table_name]
      end #valid_table_names

      def shp2pgsql
        @shp2pgsql ||= Shp2pgsql.new(job.table_name, fullpath, pg_options)
      end #shp2pgsql

      def reproject
        raise InvalidShpError unless the_geom?
        job.log "Reprojecting the_geom in #{job.table_name}"
        reprojector.reproject(job.table_name, geometry_column)
      end #reproject

      def geometry_column
        georeferencer.geometry_column_in(job.qualified_table_name)
      end #geometry_column

      def georeferencer
        @georeferencer ||= Georeferencer.new(job.db, job.table_name)
      end #georeferencer

      def reprojector
        @reprojector ||= Reprojector.new(job.db)
      end #reprojector

      def the_geom?
        georeferencer.column_exists_in?(job.table_name, geometry_column)
      end #the_geom?

      def drop_the_geom_webmercator
        georeferencer.drop_the_geom_webmercator
      end #drop_the_geom_webmercator
        
      private

      attr_writer     :shp2pgsql
      attr_accessor   :job, :source_file

      def_delegators  :job,           :log, :id, :pg_options
      def_delegators  :source_file,   :fullpath, :name, :path
      def_delegators  :shp2pgsql,     :exit_code
    end # Loader
  end # Importer2
end # CartoDB
