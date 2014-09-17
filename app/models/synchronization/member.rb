# encoding: utf-8
require 'virtus'
require_relative 'adapter'
require_relative '../../../services/importer/lib/importer' 
require_relative '../visualization/collection'
require_relative '../../../services/importer/lib/importer/datasource_downloader'
require_relative '../../../services/datasources/lib/datasources'
require_relative '../log'
include CartoDB::Datasources


module CartoDB
  module Synchronization
    class << self
      attr_accessor :repository
    end

    class Member
      include Virtus.model

      MAX_RETRIES     = 5

      # Seconds required between manual sync now
      SYNC_NOW_TIMESPAN = 900

      STATE_CREATED   = 'created'
      STATE_SYNCING   = 'syncing'
      STATE_SUCCESS   = 'success'
      STATE_FAILURE   = 'failure'

      STATES                        = %w{ success failure syncing }

      attribute :id,              String
      attribute :name,            String
      attribute :interval,        Integer,  default: 3600
      attribute :url,             String
      attribute :state,           String,   default: STATE_CREATED
      attribute :user_id,         String
      attribute :created_at,      Time
      attribute :updated_at,      Time
      attribute :run_at,          Time     
      attribute :ran_at,          Time
      attribute :modified_at,     Time
      attribute :etag,            String
      attribute :checksum,        String
      attribute :log_id,          String
      attribute :error_code,      Integer
      attribute :error_message,   String
      attribute :retried_times,   Integer,  default: 0
      attribute :service_name,    String
      attribute :service_item_id, String

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
      end

      def to_s
        "<CartoDB::Synchronization::Member id:\"#{@id}\" name:\"#{@name}\" ran_at:\"#{@ran_at}\" run_at:\"#{@run_at}\" " \
        "interval:\"#{@interval}\" state:\"#{@state}\" retried_times:\"#{@retried_times}\" log_id:\"#{log.id}\" " \
        "service_name:\"#{@service_name}\" service_item_id:\"#{@service_item_id}\" checksum:\"#{@checksum}\" " \
        "url:\"#{@url}\" error_code:\"#{@error_code}\" error_message:\"#{@error_message}\" modified_at:\"#{@modified_at}\" " \
        " user_id:\"#{@user_id}\" >"
      end #to_s

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

      def delete
        repository.delete(id)
        self.attributes.keys.each { |key| self.send("#{key}=", nil) }
        self
      end

      def enqueue
        Resque.enqueue(Resque::SynchronizationJobs, job_id: id)
      end

      # @return bool
      def can_manually_sync?
        self.state == STATE_SUCCESS && (self.ran_at + SYNC_NOW_TIMESPAN < Time.now)
      end #can_manually_sync?

      # @return bool
      def should_auto_sync?
        self.state == STATE_SUCCESS && (self.run_at < Time.now)
      end #should_run?

      def run
        importer = nil
        self.state    = STATE_SYNCING

        @log = CartoDB::Log.new(type: CartoDB::Log::TYPE_SYNCHRONIZATION, user_id: user.id)
        self.log_id = @log.id
        store

        if user.nil?
          raise "Couldn't instantiate synchronization user. Data: #{to_s}"
        end

        downloader    = get_downloader

        runner        = CartoDB::Importer2::Runner.new(pg_options, downloader, log, user.remaining_quota)

        runner.include_additional_errors_mapping(
          {
              AuthError                   => 1011,
              DataDownloadError           => 1011,
              TokenExpiredOrInvalidError  => 1012,
              DatasourceBaseError         => 1012,
              InvalidServiceError         => 1012,
              MissingConfigurationError   => 1012,
              UninitializedError          => 1012
          }
        )

        database = user.in_database
        importer = CartoDB::Synchronization::Adapter.new(name, runner, database, user)

        importer.run
        self.ran_at   = Time.now
        self.run_at   = Time.now + interval

        if importer.success?
          set_success_state_from(importer)
        elsif retried_times < MAX_RETRIES
          set_retry_state_from(importer)
        else
          set_failure_state_from(importer)
        end

        store
      rescue => exception
        Rollbar.report_exception(exception)
        log.append exception.message
        log.append exception.backtrace
        puts exception.message
        puts exception.backtrace

        if importer.nil?
          set_general_failure_state_from(exception)
        else
          set_failure_state_from(importer)
        end

        store

        if exception.kind_of?(TokenExpiredOrInvalidError)
          begin
            user.oauths.remove(exception.service_name)
          rescue => ex
            log.append "Exception removing OAuth: #{ex.message}"
            log.append ex.backtrace
          end
        end
        self
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

        log.append "Fetching datasource #{datasource_provider.to_s} metadata for item id #{service_item_id}"
        metadata = datasource_provider.get_resource_metadata(service_item_id)

        if datasource_provider.providers_download_url?
          resource_url = (metadata[:url].present? && datasource_provider.providers_download_url?) ? metadata[:url] : url

          if resource_url.nil?
            raise CartoDB::DataSourceError.new("Missing resource URL to download. Data:#{to_s}" )
          end

          downloader    = CartoDB::Importer2::Downloader.new(
              resource_url,
              etag:             etag,
              last_modified:    modified_at,
              checksum:         checksum,
              verify_ssl_cert:  false
          )
          log.append "File will be downloaded from #{downloader.url}"
        else
          log.append 'Downloading file data from datasource'
          downloader = CartoDB::Importer2::DatasourceDownloader.new(datasource_provider, metadata, \
            {checksum: checksum}, log)
        end

        downloader
      end

      def set_success_state_from(importer)
        log.append     '******** synchronization succeeded ********'
        self.log_trace      = importer.runner_log_trace
        self.state          = STATE_SUCCESS
        self.etag           = importer.etag
        self.checksum       = importer.checksum
        self.error_code     = nil
        self.error_message  = nil
        self.retried_times  = 0
        self.run_at         = Time.now + interval
        self.modified_at    = importer.last_modified
        geocode_table
      rescue
        self
      end

      def set_retry_state_from(importer)
        log.append     '******** synchronization failed, will retry ********'
        self.log_trace      = importer.runner_log_trace
        self.log.append     "*** Runner log: #{self.log_trace} \n***" unless self.log_trace.nil?
        self.state          = STATE_SUCCESS
        self.error_code     = importer.error_code
        self.error_message  = importer.error_message
        self.retried_times  = self.retried_times + 1
      end

      def set_failure_state_from(importer)
        log.append     '******** synchronization failed ********'
        self.log_trace      = importer.runner_log_trace
        log.append     "*** Runner log: #{self.log_trace} \n***" unless self.log_trace.nil?
        self.state          = STATE_FAILURE
        self.error_code     = importer.error_code
        self.error_message  = importer.error_message
        self.retried_times  = self.retried_times + 1
      end

      def set_general_failure_state_from(exception)
        log.append     '******** synchronization raised exception ********'
        self.log_trace      = ''
        self.state          = STATE_FAILURE
        self.error_code     = 99999
        self.error_message  = exception.message + ' ' + exception.backtrace
        self.retried_times  = self.retried_times + 1
      end

      # Tries to run automatic geocoding if present
      def geocode_table
        return unless table && table.automatic_geocoding
        log.append 'Running automatic geocoding...'
        table.automatic_geocoding.run
      rescue => e
        log.append "Error while running automatic geocoding: #{e.message}"
      end # geocode_table

      def to_hash
        attributes.to_hash
      end

      def to_json(*args)
        attributes.to_json(*args)
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
        @user ||= User.where(id: user_id).first
      end

      def table
        return nil unless defined?(::Table)
        if @table.nil?
          @table = ::Table.get_by_id_or_name(name, user)
        end
        @table
      end # table

      def authorize?(user)
        user.id == user_id && !!user.sync_tables_enabled
      end

      def pg_options
        Rails.configuration.database_configuration[Rails.env].symbolize_keys
          .merge(
            user:     user.database_username,
            password: user.database_password,
            database: user.database_name,
	          host:     user.user_database_host
          )
      end 

      def log
        return @log unless @log.nil?

        log_attributes = {
          type: CartoDB::Log::TYPE_SYNCHRONIZATION,
        }
        log_attributes.merge(user_id: user.id) if user

        @log = CartoDB::Log.where(log_attributes).first
      end

      def valid_uuid?(text)
        !!UUIDTools::UUID.parse(text)
      rescue TypeError
        false
      rescue ArgumentError
        false
      end

      # @return mixed|nil
      def get_datasource(datasource_name)
        begin
          datasource = DatasourcesFactory.get_datasource(datasource_name, user)
          datasource.report_component = Rollbar
          if datasource.kind_of? BaseOAuth
            oauth = user.oauths.select(datasource_name)
            datasource.token = oauth.token unless oauth.nil?
          end
        rescue => ex
          log.append "Exception: #{ex.message}"
          log.append ex.backtrace
          datasource = nil
        end
        datasource
      end

      attr_reader :repository

      attr_accessor :log_trace, :service_name, :service_item_id

    end
  end
end

