# encoding: utf-8
require_relative './loader'
require_relative './tiff_loader'
require_relative './sql_loader'
require_relative './unp'
require_relative './column'
require_relative './exceptions'
require_relative './result'
require_relative './importer_stats'
require_relative '../../../datasources/lib/datasources/datasources_factory'

module CartoDB
  module Importer2
    class Runner
      QUOTA_MAGIC_NUMBER      = 0.3
      DEFAULT_AVAILABLE_QUOTA = 2 ** 30
      LOADERS                 = [Loader, TiffLoader]
      DEFAULT_LOADER          = Loader
      UNKNOWN_ERROR_CODE      = 99999

      # @param pg_options Hash
      # @param downloader CartoDB::Importer2::DatasourceDownloader|CartoDB::Importer2::Downloader
      # @param log CartoDB::Log|nil
      # @param available_quota int|nil
      # @param unpacker Unp|nil
      # @param post_import_handler CartoDB::Importer2::PostImportHandler|nil
      def initialize(pg_options, downloader, log=nil, available_quota=nil, unpacker=nil, post_import_handler=nil, \
                     importer_stats_options = nil)
        @pg_options          = pg_options
        @downloader          = downloader
        @log                 = log             || new_logger
        @available_quota     = available_quota || DEFAULT_AVAILABLE_QUOTA
        @unpacker            = unpacker        || Unp.new
        @results             = []
        @stats               = []
        @post_import_handler = post_import_handler || nil
        @loader_options      = {}
        importer_stats_options ||= { host: nil, port: nil}
        @importer_stats = set_importer_stats_options(importer_stats_options[:host], importer_stats_options[:port], \
                                                     importer_stats_options[:queue_id])
      end

      def loader_options=(value)
        @loader_options = value
      end

      def set_importer_stats_options(host, port, queue_id)
        @importer_stats = ImporterStats.instance(host, port, queue_id)
      end

      def new_logger
        # TODO: Inject logging class
        CartoDB::Log.new(type: CartoDB::Log::TYPE_DATA_IMPORT)
      end

      def include_additional_errors_mapping(additional_errors)
        @additional_errors = additional_errors
      end

      def errors_to_code_mapping
        @additional_errors.nil? ? ERRORS_MAP : ERRORS_MAP.merge(@additional_errors)
      end

      def run(&tracker_block)
        @importer_stats.timing('run') do
          run_import(&tracker_block)
        end
      end

      def run_import(&tracker_block)

        @tracker = tracker_block
        tracker.call('uploading')

        if @downloader.multi_resource_import_supported?
          log.append "Starting multi-resources import"
          # [ {:id, :title} ]
          @downloader.item_metadata[:subresources].each { |subresource|
            @importer_stats.timing('subresource') do

              datasource = nil
              item_metadata = nil
              subres_downloader = nil

              @importer_stats.timing('datasource_metadata') do
                # TODO: Support sending user and options to the datasource factory
                datasource = CartoDB::Datasources::DatasourcesFactory.get_datasource(@downloader.datasource.class::DATASOURCE_NAME, nil, nil)
                item_metadata = datasource.get_resource_metadata(subresource[:id])
              end

              @importer_stats.timing('download') do
                subres_downloader = @downloader.class.new(
                datasource, item_metadata, @downloader.options, @downloader.logger, @downloader.repository)

                subres_downloader.run(available_quota)
                next unless remote_data_updated?
              end

              @importer_stats.timing('quota_check') do
                log.append "Starting import for #{subres_downloader.source_file.fullpath}"
                raise_if_over_storage_quota(subres_downloader.source_file)
              end

              @importer_stats.timing('import') do
                tracker.call('unpacking')
                source_file = subres_downloader.source_file
                log.append "Filename: #{source_file.fullpath} Size (bytes): #{source_file.size}"
                @stats << {
                  type: source_file.extension,
                  size: source_file.size
                }

                import(source_file, subres_downloader)
              end

              @importer_stats.timing('cleanup') do
                subres_downloader.clean_up
              end
            end
          }
        else
          @importer_stats.timing('resource') do

            @importer_stats.timing('download') do
              @downloader.run(available_quota)
              return self unless remote_data_updated?
            end

            @importer_stats.timing('quota_check') do
              log.append "Starting import for #{@downloader.source_file.fullpath}"
              raise_if_over_storage_quota(@downloader.source_file)
            end


            @importer_stats.timing('unpack') do
              log.append "Unpacking #{@downloader.source_file.fullpath}"
              tracker.call('unpacking')
              unpacker.run(@downloader.source_file.fullpath)
            end

            @importer_stats.timing('import') do
              begin
              unpacker.source_files.each { |source_file|
                # TODO: Move this stats inside import, for streaming scenarios, or differentiate
                log.append "Filename: #{source_file.fullpath} Size (bytes): #{source_file.size}"
                @stats << {
                  type: source_file.extension,
                  size: source_file.size
                }
                import(source_file, @downloader)
              }
              rescue => exception
                raise exception
              end
            end

            @importer_stats.timing('cleanup') do
              unpacker.clean_up
              @downloader.clean_up
            end

          end
        end

        self
      rescue => exception
        log.append exception.to_s
        log.append exception.backtrace
        @results.push(Result.new(
          error_code: error_for(exception.class),
          log_trace:  report
        ))
      end
      
      def import(source_file, downloader, job=nil, loader_object=nil)
        job     ||= Job.new({ logger: log, pg_options: pg_options })
        loader = loader_object || loader_for(source_file).new(job, source_file)
        if loader.respond_to?(:set_importer_stats)
          loader.set_importer_stats(@importer_stats)
        end
        loader.options = @loader_options

        raise EmptyFileError if source_file.empty?

        tracker.call('importing')
        job.log "Importing data from #{source_file.fullpath}"

        if !downloader.nil? && downloader.provides_stream? && loader.respond_to?(:streamed_run_init)
          job.log "Streaming import load"
          loader.streamed_run_init

          begin
            got_data = downloader.continue_run(available_quota)
            loader.streamed_run_continue(downloader.source_file) if got_data
          end while got_data

          loader.streamed_run_finish(@post_import_handler)
        else
          job.log "File-based import load"
          loader.run(@post_import_handler)
        end

        job.log "Finished importing data from #{source_file.fullpath}"

        job.success_status = true
        @results.push(result_for(job, source_file, loader.valid_table_names, loader.additional_support_tables))
      rescue => exception
        job.log "Errored importing data from #{source_file.fullpath}:"
        job.log "#{exception.class.to_s}: #{exception.to_s}"
        job.log '----------------------------------------------------'
        job.log exception.backtrace
        job.log '----------------------------------------------------'
        job.success_status = false
        @results.push(
          result_for(job, source_file, loader.valid_table_names, loader.additional_support_tables, exception.class))
      end

      def report
        "Log Report: #{log.to_s}"
      end

      def db
        @db = Sequel.postgres(pg_options.merge(:after_connect=>(proc do |conn|
          conn.execute('SET search_path TO "$user", public, cartodb')
        end)))
      end

      def loader_for(source_file)
        LOADERS.find(DEFAULT_LOADER) { |loader_klass|
          loader_klass.supported?(source_file.extension)
        }
      end

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
      end

      def success?
        # TODO: Change this, "runner" can be ok even if no data has changed, should expose "data_changed" attribute
        return true unless remote_data_updated?
        results.select(&:success?).length > 0
      end

      attr_reader :results, :log, :loader, :stats

      private
 
      attr_reader :pg_options, :unpacker, :available_quota
      attr_writer :results, :tracker

      def result_for(job, source_file, table_names, support_table_names=[], exception_klass=nil)
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
          log_trace:      job.logger.to_s,
          support_tables: support_table_names
        )
      end

      def error_for(exception_klass=nil)
        return nil unless exception_klass
        errors_to_code_mapping.fetch(exception_klass, UNKNOWN_ERROR_CODE)
      end

      def raise_if_over_storage_quota(source_file)
        file_size   = File.size(source_file.fullpath)
        over_quota  = available_quota < QUOTA_MAGIC_NUMBER * file_size
        raise StorageQuotaExceededError if over_quota
        self
      end
    end
  end
end

