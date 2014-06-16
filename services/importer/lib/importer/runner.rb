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
      UNKNOWN_ERROR_CODE      = 99999

      # @param pg_options Hash
      # @param downloader CartoDB::Datasources::Base|CartoDB::Importer2::Downloader
      # @param log TrackRecord::Log|nil
      # @param available_quota int|nil
      # @param unpacker Unp|nil
      def initialize(pg_options, downloader, log=nil, available_quota=nil, unpacker=nil)
        @pg_options         = pg_options
        @downloader         = downloader
        @log                = log             || TrackRecord::Log.new
        @available_quota    = available_quota || DEFAULT_AVAILABLE_QUOTA
        @unpacker           = unpacker        || Unp.new
        @results            = []
      end #initialize

      def include_additional_errors_mapping(additional_errors)
        @additional_errors = additional_errors
      end #include_additional_errors_mapping

      def errors_to_code_mapping
        @additional_errors.nil? ? ERRORS_MAP : ERRORS_MAP.merge(@additional_errors)
      end #errors_to_code_mapping

      def run(&tracker_block)
        @tracker = tracker_block
        tracker.call('uploading')

        @downloader.run(available_quota)

        return self unless remote_data_updated?

        log.append "Starting import for #{@downloader.source_file.fullpath}"
        log.append "Unpacking #{@downloader.source_file.fullpath}"

        raise_if_over_storage_quota

        tracker.call('unpacking')
        unpacker.run(@downloader.source_file.fullpath)
        unpacker.source_files.each { |source_file| import(source_file) }
        unpacker.clean_up
        self
      rescue => exception
        log.append exception.to_s
        log.append exception.backtrace
        @results.push(Result.new(
          error_code: error_for(exception.class),
          log_trace:  report
        ))
      end #run
      
      def import(source_file, job=nil, loader=nil)
        job     ||= Job.new(logger: log, pg_options: pg_options)
        loader  ||= loader_for(source_file).new(job, source_file)

        raise EmptyFileError if source_file.empty?

        tracker.call('importing')
        job.log "Importing data from #{source_file.fullpath}"
        loader.run
        job.log "Finished importing data from #{source_file.fullpath}"

        job.success_status = true
        @results.push(result_for(job, source_file, loader.valid_table_names))
      rescue => exception
        job.log "Errored importing data from #{source_file.fullpath}:"
        job.log "#{exception.class.to_s}: #{exception.to_s}"
        job.log '----------------------------------------------------'
        job.log exception.backtrace
        job.log '----------------------------------------------------'
        job.success_status = false
        @results.push(result_for(job, source_file, loader.valid_table_names, exception.class))
      end #import

      def report
        "Log Report: #{log.to_s}"
      end #report

      def db
        @db = Sequel.postgres(pg_options.merge(:after_connect=>(proc do |conn|
          conn.execute('SET search_path TO "$user", public, cartodb')
        end)))
      end #db

      def loader_for(source_file)
        LOADERS.find(DEFAULT_LOADER) { |loader_klass| 
          loader_klass.supported?(source_file.extension)
        }
      end #loader_for

      def remote_data_updated?
        @downloader.modified?
      end

      def last_modified
        @downloader.last_modified
      end

      def etag
        @downloader.etag
      end

      def checksum
        @downloader.checksum
      end

      # If not specified, fake
      def tracker
        @tracker || lambda { |state| state }
      end #tracker

      def success?
        # TODO: Change this, "runner" can be ok even if no data has changed, should expose "data_changed" attribute
        return true unless remote_data_updated?
        results.select(&:success?).length > 0
      end

      attr_reader :results, :log

      private
 
      attr_reader :pg_options, :unpacker, :available_quota
      attr_writer :results, :tracker

      def result_for(job, source_file, table_names, exception_klass=nil)
        Result.new(
          name:           source_file.name,
          schema:         source_file.target_schema,
          extension:      source_file.extension,
          etag:           source_file.etag,
          checksum:       source_file.checksum,
          last_modified:  source_file.last_modified,
          tables:         table_names,
          success:        job.success_status,
          error_code:     error_for(exception_klass),
          log_trace:      job.logger.to_s
        )
      end #results

      def error_for(exception_klass=nil)
        return nil unless exception_klass
        errors_to_code_mapping.fetch(exception_klass, UNKNOWN_ERROR_CODE)
      end #error_for

      def raise_if_over_storage_quota
        file_size   = File.size(@downloader.source_file.fullpath)
        over_quota  = available_quota < QUOTA_MAGIC_NUMBER * file_size
        raise StorageQuotaExceededError if over_quota
        self
      end #raise_if_over_storage_quota
    end # Runner
  end # Importer2
end # CartoDB

