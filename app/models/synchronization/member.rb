require 'virtus'
require_relative 'adapter'
require_relative '../../../services/importer/lib/importer'
require_relative '../visualization/collection'
require_relative '../../../services/importer/lib/importer/datasource_downloader'
require_relative '../../../services/datasources/lib/datasources'
require_relative '../../../services/importer/lib/importer/unp'
require_relative '../../../services/importer/lib/importer/post_import_handler'
require_relative '../../../services/importer/lib/importer/overviews'
require_relative '../../../lib/cartodb/errors'
require_relative '../../../lib/cartodb/import_error_codes'
require_relative '../../../services/platform-limits/platform_limits'

require_dependency 'carto/configuration'

include CartoDB::Datasources

module CartoDB
  module Synchronization

    class << self
      attr_accessor :repository
    end

    class Member

      include ::LoggerHelper
      include Carto::Configuration
      include Virtus.model

      MAX_RETRIES     = 10
      MIN_INTERVAL_SECONDS = 15 * 60

      # Seconds required between manual sync now
      SYNC_NOW_TIMESPAN = 900

      STATE_CREATED   = 'created'
      # Already at resque, waiting for slot
      STATE_QUEUED   = 'queued'
      # Actually syncing
      STATE_SYNCING   = 'syncing'
      STATE_SUCCESS   = 'success'
      STATE_FAILURE   = 'failure'

      attribute :id,                      String
      attribute :name,                    String
      attribute :interval,                Integer,  default: 3600
      attribute :url,                     String
      attribute :state,                   String,   default: STATE_CREATED
      attribute :user_id,                 String
      attribute :created_at,              Time
      attribute :updated_at,              Time
      attribute :run_at,                  Time
      attribute :ran_at,                  Time
      attribute :modified_at,             Time
      attribute :etag,                    String
      attribute :checksum,                String
      attribute :log_id,                  String
      attribute :error_code,              Integer
      attribute :error_message,           String
      attribute :retried_times,           Integer,  default: 0
      attribute :service_name,            String
      attribute :service_item_id,         String
      attribute :type_guessing,           Boolean, default: true
      attribute :quoted_fields_guessing,  Boolean, default: true
      attribute :content_guessing,        Boolean, default: false
      attribute :visualization_id,        String

      def initialize(attributes={}, repository=Synchronization.repository)
        super(attributes)

        @log = nil

        self.log_trace        = nil
        @repository           = repository
        self.id               ||= @repository.next_id
        self.state            ||= STATE_CREATED
        self.ran_at           ||= Time.now
        self.interval         ||= 3600
        self.run_at           ||= Time.now + interval
        self.retried_times    ||= 0
        self.log_id           ||= log.id unless log.nil?
        self.service_name     ||= nil
        self.service_item_id  ||= nil
        self.checksum         ||= ''

        raise InvalidInterval.new unless self.interval >= MIN_INTERVAL_SECONDS

      end

      def to_s
        "<CartoDB::Synchronization::Member id:\"#{@id}\" name:\"#{@name}\" ran_at:\"#{@ran_at}\" run_at:\"#{@run_at}\" " \
        "interval:\"#{@interval}\" state:\"#{@state}\" retried_times:\"#{@retried_times}\" log_id:\"#{self.log_id}\" " \
        "service_name:\"#{@service_name}\" service_item_id:\"#{@service_item_id}\" checksum:\"#{@checksum}\" " \
        "url:\"#{@url}\" error_code:\"#{@error_code}\" error_message:\"#{@error_message}\" modified_at:\"#{@modified_at}\" " \
        " user_id:\"#{@user_id}\" type_guessing:\"#{@type_guessing}\" " \
        "quoted_fields_guessing:\"#{@quoted_fields_guessing}\" visualization_id:\"#{@visualization_id}\">"
      end

      def synchronizations_logger
        @@synchronizations_logger ||= CartoDB.unformatted_logger(log_file_path("synchronizations.log"))
      end

      def interval=(seconds=3600)
        super(seconds.to_i)
        if seconds
          self.run_at = Time.now + (seconds.to_i || 3600)
        end
        seconds
      end

      def store
        raise CartoDB::InvalidMember unless self.valid?
        set_timestamps
        repository.store(id, attributes.to_hash)
        self
      end

      def fetch
        data = repository.fetch(id)
        raise KeyError if data.nil?
        self.attributes = data
        self
      end

      def fetch_by_visualization_id
        data = repository.fetch(visualization_id, "visualization_id")
        raise KeyError if data.nil?
        self.attributes = data
        self
      end

      def delete
        repository.delete(id)
        self.attributes.keys.each { |key| self.send("#{key}=", nil) }
        self
      end

      def enqueue
        Resque.enqueue(Resque::SynchronizationJobs, job_id: id)
        self.error_code = nil
        self.error_message = nil
        self.state = CartoDB::Synchronization::Member::STATE_QUEUED
        self.store
      end

      # @return bool
      def can_manually_sync?
        # Last sync ok, last sync failed, or too much time in queued state
        (  self.state == STATE_SUCCESS ||
           self.state == STATE_FAILURE ||
          (self.state == STATE_QUEUED && self.updated_at + SYNC_NOW_TIMESPAN < Time.now)
         ) && (self.ran_at + SYNC_NOW_TIMESPAN < Time.now)
      end

      # @return bool
      def should_auto_sync?
        self.state == STATE_SUCCESS && (self.run_at < Time.now)
      end

      # This should be joined with data_import to stop the madness of duplicated code
      def run
        importer = nil
        self.state = STATE_SYNCING
        self.store

        # TODO: See if we can remove this code
        # First import is a "normal import" so still has no id, then run gets called and will get log first time
        # but we need this to fix old logs
        if log.nil?
          @log = Carto::Log.new_synchronization(user.id)
          @log.store
          self.log_id = @log.id
          store
        else
          @log.type = Carto::Log::TYPE_SYNCHRONIZATION
          @log.clear
          @log.store
        end

        if user.nil?
          raise "Couldn't instantiate synchronization user. Data: #{to_s}"
        end

        raise "Can't run a synchronization for inactive user: #{user.username}" unless user.reload.active?

        if !authorize?(user)
          raise CartoDB::Datasources::AuthError.new('User is not authorized to sync tables')
        end

        runner = service_name == 'connector' ? get_connector : get_runner

        database = user.in_database
        overviews_creator = CartoDB::Importer2::Overviews.new(runner, user)
        importer = CartoDB::Synchronization::Adapter.new(name, runner, database, user, overviews_creator, id, @log)

        importer.run
        self.ran_at   = Time.now
        self.run_at   = Time.now + interval

        if importer.success?
          set_success_state_from(importer)
        else
          set_failure_state_from(importer)
        end

        store

        notify

      rescue StandardError => exception
        if exception.is_a? CartoDB::Datasources::NotFoundDownloadError
          log_warning(exception: exception, synchronization_member: { id: id })
        else
          log_error(exception: exception, synchronization_member: { id: id })
        end
        log.append_and_store exception.message, truncate = false
        log.append exception.backtrace.join("\n"), truncate = false

        if importer.nil?
          if exception.is_a?(NotFoundDownloadError)
            set_general_failure_state_from(exception, 1017, 'File not found, you must import it again')
          elsif exception.is_a?(CartoDB::Importer2::FileTooBigError)
            set_general_failure_state_from(exception, exception.error_code,
                                           CartoDB::IMPORTER_ERROR_CODES[exception.error_code][:title])
          elsif exception.is_a?(AuthError)
            set_general_failure_state_from(exception, 1011, 'Unauthorized')
          else
            set_general_failure_state_from(exception)
          end
        else
          set_failure_state_from(importer)
        end

        store

        if exception.is_a?(TokenExpiredOrInvalidError)
          begin
            user.oauths.remove(exception.service_name)
          rescue StandardError => ex
            log.append "Exception removing OAuth: #{ex.message}"
            log.append ex.backtrace
          end
        end
        notify
        self
      ensure
        CartoDB::PlatformLimits::Importer::UserConcurrentSyncsAmount.new(
          user: user, redis: { db: $users_metadata }
        ).decrement!

      end

      def get_runner
        downloader = get_downloader

        post_import_handler = CartoDB::Importer2::PostImportHandler.new
        unless downloader.datasource.nil?
          case downloader.datasource.class::DATASOURCE_NAME
          when Url::ArcGIS::DATASOURCE_NAME
            post_import_handler.add_fix_geometries_task
          when Search::Twitter::DATASOURCE_NAME
            post_import_handler.add_transform_geojson_geom_column
          end
        end

        runner = CartoDB::Importer2::Runner.new(
          pg: pg_options,
          downloader: downloader,
          log: log,
          user: user,
          unpacker: CartoDB::Importer2::Unp.new(Cartodb.config[:importer], Cartodb.config[:ogr2ogr]),
          post_import_handler: post_import_handler,
          importer_config: Cartodb.config[:importer]
        )
        runner.loader_options = ogr2ogr_options.merge content_guessing_options

        runner.include_additional_errors_mapping(
          AuthError                   => 1011,
          DataDownloadError           => 1011,
          TokenExpiredOrInvalidError  => 1012,
          DatasourceBaseError         => 1012,
          InvalidServiceError         => 1012,
          MissingConfigurationError   => 1012,
          UninitializedError          => 1012
        )

        runner
      end

      def get_connector
        # get_runner passes the synchronization `modified_at` time (which corresponds to the
        # last-modified time of the external data at the last synchronization) through the
        # downloader provided to the runner.
        # For connectors we need to pass it directly to the connector runner.
        provider_name = get_provider_name_from_id(service_item_id)
        CartoDB::Importer2::ConnectorRunner.check_availability!(user, provider_name)
        CartoDB::Importer2::ConnectorRunner.new(
          service_item_id,
          user: user,
          pg: pg_options,
          log: log,
          previous_last_modified: modified_at
        )
      end

      def notify
        sync_log = {
          'name'              => self.name,
          'sync_time'         => self.updated_at - self.created_at,
          'sync_timestamp'    => Time.now,
          'user'              => user.username,
          'queue_server'      => `hostname`.strip,
          'resque_ppid'       => Process.ppid,
          'state'             => self.state,
          'user_timeout'      => ::DataImport.http_timeout_for(user)
        }
        synchronizations_logger.info(sync_log.to_json)
      end

      def get_downloader
        datasource_name = (service_name.nil? || service_name.size == 0) ? Url::PublicUrl::DATASOURCE_NAME : service_name
        if service_item_id.nil? || service_item_id.size == 0
          self.service_item_id = url
        end

        datasource_provider = get_datasource(datasource_name)
        if datasource_provider.nil?
          raise CartoDB::DataSourceError.new("Datasource #{datasource_name} could not be instantiated")
        end

        if service_item_id.nil?
          raise CartoDB::DataSourceError.new("Datasource #{datasource_name} without item id")
        end

        log.append "Fetching datasource #{datasource_provider.to_s} metadata for item id #{service_item_id} from user #{user.id}"
        metadata = datasource_provider.get_resource_metadata(service_item_id)

        if hit_platform_limit?(datasource_provider, metadata, user)
          raise CartoDB::Importer2::FileTooBigError.new(metadata.inspect)
        end

        if datasource_provider.providers_download_url?
          metadata_url = metadata[:url]
          resource_url = (metadata_url.present? && datasource_provider.providers_download_url?) ? metadata_url : url

          raise CartoDB::DataSourceError.new("Missing resource URL to download. Data:#{self}") unless resource_url

          log.append "File will be downloaded from #{resource_url}"

          http_options = {
            http_timeout: DataImport.http_timeout_for(user),
            etag: etag,
            last_modified: modified_at,
            checksum: checksum,
            verify_ssl_cert: false
          }

          CartoDB::Importer2::Downloader.new(user.id,
                                             resource_url,
                                             http_options,
                                             importer_config: Cartodb.config[:importer])
        else
          log.append 'Downloading file data from datasource'

          options = {
            http_timeout: DataImport.http_timeout_for(user),
            checksum: checksum,
            importer_config: Cartodb.config[:importer],
            user_id: user.id
          }

          CartoDB::Importer2::DatasourceDownloader.new(datasource_provider, metadata, options, log)
        end
      end

      def hit_platform_limit?(datasource, metadata, user)
        if datasource.has_resource_size?(metadata)
          CartoDB::PlatformLimits::Importer::InputFileSize.new({ user: user })
                                                          .is_over_limit!(metadata[:size])
        else
          false
        end
      end

      def set_success_state_from(importer)
        log.append_and_store     '******** synchronization succeeded ********'
        self.log_trace      = importer.runner_log_trace
        self.state          = STATE_SUCCESS
        self.etag           = importer.etag
        self.checksum       = importer.checksum
        self.error_code     = nil
        self.error_message  = nil
        self.retried_times  = 0
        self.run_at         = Time.now + interval
        self.modified_at    = importer.last_modified
      rescue StandardError => exception
        log_error(
          exception: exception, message: 'Error updating state for sync table',
          synchronization_member: { id: id }
        )
        self
      end

      def set_failure_state_from(importer)
        log.append_and_store     '******** synchronization failed ********'
        self.log_trace      = importer.runner_log_trace
        log.append     "*** Runner log: #{self.log_trace} \n***" unless self.log_trace.nil?
        self.state          = STATE_FAILURE
        self.error_code     = importer.error_code.blank? ? 9999 : importer.error_code
        self.error_message  = importer.error_message
        # Try to fill empty messages with the list
        if self.error_message.blank? && !self.error_code.nil?
          default_message = CartoDB::IMPORTER_ERROR_CODES.fetch(self.error_code, {})
          self.error_message = default_message.fetch(:title, '')
        end
        if self.retried_times < MAX_RETRIES
          self.retried_times  += 1
          self.run_at         = Time.now + interval
        else
          ::Resque.enqueue(::Resque::UserJobs::Mail::Sync::MaxRetriesReached, self.user_id,
                           self.visualization_id, self.name, self.error_code, self.error_message)
        end

        track_failure
      end

      def set_general_failure_state_from(exception, error_code = 99999, error_message = 'Unknown error, please try again')
        log.append_and_store     '******** synchronization raised exception ********'
        self.log_trace      = exception.message + ' ' + exception.backtrace.join("\n")
        self.state          = STATE_FAILURE
        self.error_code     = error_code
        self.error_message  = error_message
        if self.retried_times < MAX_RETRIES
          self.retried_times  += 1
          self.run_at         = Time.now + interval
        else
          ::Resque.enqueue(::Resque::UserJobs::Mail::Sync::MaxRetriesReached, self.user_id,
                           self.visualization_id, self.name, self.error_code, self.error_message)
        end

        track_failure
      rescue StandardError => e
        CartoDB.notify_exception(e,
          {
            error_code: error_code,
            error_message: error_message,
            retried_times: self.retried_times
          }
        )
      end

      def track_failure
        properties = {
          user_id: self.user_id,
          connection: {
            imported_from: service_name,
            error_code: self.error_code
          }
        }

        if service_name == 'connector'
          connector_params = JSON.parse(service_item_id)
          properties[:connection][:provider] = connector_params['provider']
        end

        Carto::Tracking::Events::FailedSync.new(self.user_id, properties).report
      end

      def to_hash
        attributes.merge({from_external_source: from_external_source?}).to_hash
      end

      def to_json(*args)
        attributes.merge({from_external_source: from_external_source?}).to_json(*args)
      end

      def valid?
        true
      end

      def set_timestamps
        self.created_at ||= Time.now
        self.updated_at = Time.now
        self
      end

      def user
        @user ||= ::User.where(id: user_id).first
      end

      def table
        if @table.nil?
          @table = ::Table.new(name: name, user_id: user.id)
        end
        @table
      end

      def visualization
        @visualization ||= CartoDB::Visualization::Member.new(id: @visualization_id).fetch
      rescue KeyErrror
        @visualization = nil
      end

      def authorize?(user)
        user.id == user_id && (!!user.sync_tables_enabled || from_external_source?)
      end

      def pg_options
        SequelRails.configuration.environment_for(Rails.env)
          .merge(
            username:     user.database_username,
            password: user.database_password,
            database: user.database_name,
	          host:     user.user_database_host
          )
      end

      def ogr2ogr_options
        options = Cartodb.config.fetch(:ogr2ogr, {})
        if options['binary'].nil? || options['csv_guessing'].nil?
          {}
        else
          ogr_options = {
            ogr2ogr_binary:         options['binary'],
            ogr2ogr_csv_guessing:   options['csv_guessing'] && @type_guessing,
            quoted_fields_guessing: @quoted_fields_guessing,
          }
          if options['memory_limit'].present?
            ogr_options.merge!(ogr2ogr_memory_limit: options['memory_limit'])
          end
          return ogr_options
        end
      end

      # TODO code duplicated from data_import.rb, refactor
      def content_guessing_options
        guessing_config = Cartodb.config.fetch(:importer, {}).deep_symbolize_keys.fetch(:content_guessing, {})
        geocoder_config = Cartodb.config.fetch(:geocoder, {}).deep_symbolize_keys
        if guessing_config[:enabled] and self.content_guessing and geocoder_config
          { guessing: guessing_config, geocoder: geocoder_config }
        else
          { guessing: { enabled: false } }
        end
      end

      def log
        return @log unless @log.nil?

        log_attributes = {
          id: self.log_id
        }

        log_attributes.merge(user_id: user.id) if user

        @log = Carto::Log.find_by(log_attributes)
      end

      def get_datasource(datasource_name)
        begin
          datasource = DatasourcesFactory.get_datasource(datasource_name, user, {
            http_timeout: ::DataImport.http_timeout_for(user)
          })
          if datasource.kind_of? BaseOAuth
            oauth = user.oauths.select(datasource_name)
            datasource.token = oauth.token unless oauth.nil?
          end
        rescue StandardError => ex
          log.append "Exception: #{ex.message}"
          log.append ex.backtrace
          datasource = nil
        end
        datasource
      end

      def from_external_source?
        Carto::ExternalDataImport.where(synchronization_id: self.id).first != nil
      end

      attr_reader :repository

      attr_accessor :log_trace, :service_name, :service_item_id

      private

      def get_provider_name_from_id(service_item_id)
        begin
          connector_params = JSON.parse(service_item_id)
          return connector_params['provider']
        rescue StandardError
          return nil
        end
      end

    end
  end
end
