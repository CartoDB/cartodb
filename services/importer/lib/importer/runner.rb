# encoding: utf-8
require_relative './loader'
require_relative './shp_loader'
require_relative './indexer'
require_relative './unp'
require_relative './column'

module CartoDB
  module Importer2
    class Runner
      LOADERS = {
        csv:      Loader,
        txt:      Loader,
        xls:      Loader,
        xlsx:     Loader,
        json:     Loader,
        geojson:  Loader,
        kml:      Loader,
        shp:      ShpLoader
      }

      def initialize(pg_options, downloader, log=TrackRecord::Log.new)
        self.pg_options   = pg_options
        self.downloader   = downloader
        self.log          = log
        self.results      = []
      end #initialize

      def run
        log.append "Getting file from #{downloader.url}"
        downloader.run

        unpacker = Unp.new
        unpacker.run(downloader.source_file.fullpath)
        unpacker.source_files.each { |source_file| import(source_file) }

        self
      end #run
      
      def import(source_file, job=nil, loader=nil)
        job     ||= Job.new(logger: log, pg_options: pg_options)
        loader  ||= loader_for(source_file).new(job, source_file)

        job.log "Importing data from #{source_file.fullpath}"
        loader.run
        job.log "Loader exit code: #{loader.exit_code}"

        columns_in(job.table_name).each(&:sanitize)
        Indexer.new(job.db).add(job.table_name)
        self.results.push(result_for(job, source_file))
      end #import

      def report
        log.to_s
      end #report

      def db
        @db ||= Sequel.postgres(pg_options)
      end #db

      def loader_for(source_file)
        LOADERS.fetch(source_file.extension.delete('.').to_sym)
      end #loader_for

      def columns_in(table_name)
        db.schema(table_name, schema: 'importer')
          .map { |s| s[0] }
          .map { |column_name| Column.new(db, table_name, column_name) }
      end #columns_in

      attr_reader :results

      private

      attr_accessor :downloader, :log, :pg_options
      attr_writer   :results

      def result_for(job, source_file)
        { 
          name:                 source_file.name,
          table_name:           job.table_name,
          qualified_table_name: job.qualified_table_name
        } 
      end #results
    end # Runner
  end # Importer2
end # CartoDB

