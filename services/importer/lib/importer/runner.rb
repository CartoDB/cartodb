# encoding: utf-8
require_relative './loader'
require_relative './osm_loader'
require_relative './tiff_loader'
require_relative './sql_loader'
require_relative './unp'
require_relative './column'
require_relative './exceptions'
require_relative './result'

module CartoDB
  module Importer2
    class Runner
      QUOTA_MAGIC_NUMBER      = 0.3
      DEFAULT_AVAILABLE_QUOTA = 2 ** 30
      LOADERS                 = [Loader, OsmLoader, TiffLoader]
      DEFAULT_LOADER          = Loader

      def initialize(pg_options, downloader, log=nil, available_quota=nil,
      unpacker=nil)
        self.pg_options       = pg_options
        self.downloader       = downloader
        self.log              = log || TrackRecord::Log.new
        self.results          = []
        self.unpacker         = unpacker || Unp.new
        self.available_quota  = available_quota || DEFAULT_AVAILABLE_QUOTA
      end #initialize

      def run(&tracker_block)
        self.tracker = tracker_block
        tracker.call('uploading')
        log.append "Getting file from #{downloader.url}"
        downloader.run(available_quota)

        log.append "Starting import for #{downloader.source_file.fullpath}"
        log.append "Unpacking #{downloader.source_file.fullpath}"

        raise_if_over_storage_quota

        tracker.call('unpacking')
        unpacker.run(downloader.source_file.fullpath)
        unpacker.source_files.each { |source_file| import(source_file) }
        unpacker.clean_up
        self
      rescue => exception
        log.append exception.to_s
        log.append exception.backtrace
        self.results.push(Result.new(error: error_for(exception.class)))
      end #run
      
      def import(source_file, job=nil, loader=nil)
        job     ||= Job.new(logger: log, pg_options: pg_options)
        loader  ||= loader_for(source_file).new(job, source_file)

        raise EmptyFileError if source_file.empty?

        self.tracker.call('importing')
        job.log "Importing data from #{source_file.fullpath}"
        loader.run

        job.success_status = true
        self.results.push(result_for(job, source_file, loader.valid_table_names))
      rescue => exception
        job.log exception.to_s
        job.log exception.backtrace
        job.success_status = false
        self.results.push(
          result_for(job, source_file, loader.valid_table_names, exception.class)
        )
      end #import

      def report
        log.to_s
      end #report

      def db
        @db ||= Sequel.postgres(pg_options)
      end #db

      def loader_for(source_file)
        LOADERS.find(DEFAULT_LOADER) { |loader_klass| 
          loader_klass.supported?(source_file.extension)
        }
      end #loader_for

      def columns_in(table_name, schema='cdb_importer')
        db.schema(table_name, schema: schema)
          .map { |s| s[0] }
          .map { |column_name| Column.new(db, table_name, column_name, schema) }
      end #columns_in

      def tracker
        @tracker || lambda { |state| }
      end #tracker

      def success?
        results.select(&:success?).length > 0
      end

      def drop_all
        results.each(&:drop)
      end

      attr_reader   :results, :log
      attr_accessor :available_quota

      private

      attr_accessor :downloader, :pg_options, :unpacker
      attr_writer   :results, :log, :tracker

      def result_for(job, source_file, table_names, exception_klass=nil)
        Result.new(
          name:       source_file.name,
          schema:     source_file.target_schema,
          extension:  source_file.extension,
          tables:     table_names,
          success:    job.success_status,
          error_code: error_for(exception_klass)
        )
      end #results

      def error_for(exception_klass=nil)
        return nil unless exception_klass
        ERRORS_MAP.fetch(exception_klass, UnknownError)
      end #error_for

      def raise_if_over_storage_quota
        file_size   = File.size(downloader.source_file.fullpath)
        over_quota  = available_quota < QUOTA_MAGIC_NUMBER * file_size

        raise StorageQuotaExceededError if over_quota
        self
      end #raise_if_over_storage_quota
    end # Runner
  end # Importer2
end # CartoDB

