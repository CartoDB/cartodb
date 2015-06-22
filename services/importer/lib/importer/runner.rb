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
require_relative '../../../platform-limits/platform_limits'

module CartoDB
  module Importer2
    class Runner
      # Legacy guessed average "final size" of an imported file
      # e.g. a Shapefile shrinks after import. This won't help in scenarios like CSVs (which tend to grow)
      QUOTA_MAGIC_NUMBER      = 0.3

      DEFAULT_AVAILABLE_QUOTA = 2 ** 30
      LOADERS                 = [Loader, TiffLoader]
      DEFAULT_LOADER          = Loader
      UNKNOWN_ERROR_CODE      = 99999

      # @param options Hash
      # {
      #   :pg Hash { ... }
      #   :downloader CartoDB::Importer2::DatasourceDownloader|CartoDB::Importer2::Downloader
      #   :log CartoDB::Log|nil
      #   :job CartoDB::Importer2::Job|nil
      #   :user User|nil
      #   :unpacker Unp|nil
      #   :post_import_handler CartoDB::Importer2::PostImportHandler|nil
      #   :importer_stats Hash|nil
      #   :limits Hash|nil {
      #       :import_file_size_instance CartoDB::PlatformLimits::Importer::InputFileSize|nil
      #       :table_row_count_limit_instance CartoDB::PlatformLimits::Importer::TableRowCount|nil
      #   }
      # }
      # @throws KeyError
      def initialize(options={})
        @loader = nil
        @pg_options          = options.fetch(:pg)
        @log                 = options.fetch(:log, nil) || new_logger
        @job                 = options.fetch(:job, nil) || new_job(log, pg_options)
        @downloader          = options.fetch(:downloader)

        @user = options.fetch(:user, nil)
        @available_quota =
          !@user.nil? && @user.respond_to?(:remaining_quota) ? @user.remaining_quota : DEFAULT_AVAILABLE_QUOTA
        @unpacker            = options.fetch(:unpacker, nil) || Unp.new
        @post_import_handler = options.fetch(:post_import_handler, nil)
        importer_stats_options = options.fetch(:importer_stats, { host: nil, port: nil, queue_id: nil})
        @importer_stats = set_importer_stats_options(importer_stats_options[:host], importer_stats_options[:port],
                                                     importer_stats_options[:queue_id])
        limit_instances = options.fetch(:limits, {})

        @import_file_limit = limit_instances.fetch(:import_file_size_instance, input_file_size_limit_instance(@user))
        @table_row_count_limit =
          limit_instances.fetch(:table_row_count_limit_instance, table_row_count_limit_instance(@user, db))
        @loader_options      = {}
        @results             = []
        @stats               = []
      end

      def loader_options=(value)
        @loader_options = value
      end

      def set_importer_stats_options(host, port, queue_id)
        @importer_stats = ImporterStats.instance(host, port, queue_id)
      end

      def new_logger
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
        @downloader.multi_resource_import_supported? ? multi_resource_import : single_resource_import
        self
      rescue => exception
        log.append "Errored importing data:"
        log.append "#{exception.class.to_s}: #{exception.to_s}"
        log.append '----------------------------------------------------'
        log.append exception.backtrace
        log.append '----------------------------------------------------'
        @results.push(Result.new(error_code: error_for(exception.class), log_trace: report))
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
        loaders = LOADERS
        loaders.find(DEFAULT_LOADER) { |loader_klass|
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

      def import(source_file, downloader, loader_object=nil)
        # noinspection RubyArgCount
        loader = loader_object || loader_for(source_file).new(@job, source_file)

        raise EmptyFileError if source_file.empty?

        loader.set_importer_stats(@importer_stats) if loader.respond_to?(:set_importer_stats)
        loader.options = @loader_options.merge(tracker: tracker)

        tracker.call('importing')
        @job.log "Importing data from #{source_file.fullpath}"

        @importer_stats.timing('resource') do
          @importer_stats.timing('quota_check') do
            raise_if_over_storage_quota(source_file)
          end

          @importer_stats.timing('file_size_limit_check') do
            if hit_platform_file_size_limit?(source_file)
              raise CartoDB::Importer2::FileTooBigError.new("#{source_file.fullpath}")
            end
          end
        end

        if !downloader.nil? && downloader.provides_stream? && loader.respond_to?(:streamed_run_init)
          streamed_loader_run(@job, loader, downloader)
        else
          file_based_loader_run(@job, loader)
        end

        @importer_stats.timing('table_row_count_limits') do
          if hit_platform_table_row_count_limit?(@job)
            raise CartoDB::Importer2::TooManyTableRowsError.new("#{@job.table_name}")
          end
        end

        @job.log "Finished importing data from #{source_file.fullpath}"

        @job.success_status = true
        @results.push(result_for(@job, source_file, loader.valid_table_names, loader.additional_support_tables))
      rescue => exception
        if loader.nil?
          valid_table_names = []
          additional_support_tables = []
        else
          valid_table_names = loader.valid_table_names
          additional_support_tables = loader.additional_support_tables
        end

        @job.log "Errored importing data from #{source_file.fullpath}:"
        @job.log "#{exception.class.to_s}: #{exception.to_s}"
        @job.log '----------------------------------------------------'
        @job.log exception.backtrace
        @job.log '----------------------------------------------------'
        @job.success_status = false
        @results.push(result_for(@job, source_file, valid_table_names, additional_support_tables, exception.class))
      end

      def streamed_loader_run(job, loader, downloader)
        job.log "Streaming import load"
        loader.streamed_run_init

        begin
          got_data = downloader.continue_run(available_quota)
          loader.streamed_run_continue(downloader.source_file) if got_data
        end while got_data

        loader.streamed_run_finish(@post_import_handler)
      end

      def file_based_loader_run(job, loader)
        job.log "File-based import load"
        loader.run(@post_import_handler)
      end

      def single_resource_import
        @importer_stats.timing('resource') do
          @importer_stats.timing('download') do
            @downloader.run(available_quota)
            return self unless remote_data_updated?
          end

          log.append "Starting import for #{@downloader.source_file.fullpath}"

          # Leaving this limit check as if a compressed source weights too much we avoid even decompressing it
          @importer_stats.timing('file_size_limit_check') do
            if hit_platform_file_size_limit?(@downloader.source_file)
              raise CartoDB::Importer2::FileTooBigError.new("#{@downloader.source_file.fullpath}")
            end
          end

          @importer_stats.timing('unpack') do
            log.append "Unpacking #{@downloader.source_file.fullpath}"
            tracker.call('unpacking')
            unpacker.run(@downloader.source_file.fullpath)
          end

          @importer_stats.timing('import') do
            unpacker.source_files.each { |source_file|
              # TODO: Move this stats inside import, for streaming scenarios, or differentiate
              log.append "Filename: #{source_file.fullpath} Size (bytes): #{source_file.size}"
              @stats << {
                type: source_file.extension,
                size: source_file.size
              }
              import(source_file, @downloader)
            }
          end

          @importer_stats.timing('cleanup') do
            unpacker.clean_up
            @downloader.clean_up
          end

        end
      end

      def multi_resource_import
        log.append "Starting multi-resources import"
        # [ {:id, :title} ]
        @downloader.item_metadata[:subresources].each { |subresource|
          @importer_stats.timing('subresource') do
            datasource = nil
            item_metadata = nil
            subres_downloader = nil

            @importer_stats.timing('datasource_metadata') do
              # TODO: Support sending user and options to the datasource factory
              datasource = CartoDB::Datasources::DatasourcesFactory.get_datasource(
                @downloader.datasource.class::DATASOURCE_NAME, nil, nil)
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
      end

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

      def new_job(log, pg_options)
        Job.new({ logger: log, pg_options: pg_options })
      end

      def hit_platform_file_size_limit?(source_file)
        file_size = File.size(source_file.fullpath)
        @import_file_limit.is_over_limit!(file_size)
      end

      def hit_platform_table_row_count_limit?(job)
        @table_row_count_limit.is_over_limit!({ table_name: job.table_name, tables_schema: job.schema})
      end

      def input_file_size_limit_instance(user)
        CartoDB::PlatformLimits::Importer::InputFileSize.new({ user: user })
      end

      def table_row_count_limit_instance(user, db)
        CartoDB::PlatformLimits::Importer::TableRowCount.new({
                                                               user: user,
                                                               db: db
                                                             })
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
