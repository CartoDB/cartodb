# encoding: utf-8
require 'virtus'
require_relative 'adapter'
require_relative '../../../services/importer/lib/importer' 
require_relative '../../../services/track_record/track_record/log'

module CartoDB
  module Synchronization
    class << self
      attr_accessor :repository
    end

    class Member
      include Virtus

      STATES                        = %w{ success failure syncing }
      REDIS_LOG_KEY_PREFIX          = 'synchronization'
      REDIS_LOG_EXPIRATION_IN_SECS  = 3600 * 24 * 2 # 2 days

      attribute :id,              String
      attribute :name,            String
      attribute :interval,        Integer,  default: 3600
      attribute :url,             String
      attribute :state,           String,   default: 'created'
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

      def initialize(attributes={}, repository=Synchronization.repository)
        super(attributes)

        self.log_trace      = nil
        @repository         = repository
        self.id             ||= @repository.next_id
        self.state          ||= 'created'
        self.ran_at         ||= Time.now
        self.interval       ||= 3600
        self.run_at         ||= Time.now + interval
        self.retried_times  ||= 0
        self.log_id         ||= log.id
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

      def delete
        repository.delete(id)
        self.attributes.keys.each { |key| self.send("#{key}=", nil) }
        self
      end

      def enqueue
        Resque.enqueue(Resque::SynchronizationJobs, job_id: id)
      end

      def run
        self.state    = 'syncing'

        log           = TrackRecord::Log.new(
                          prefix:     REDIS_LOG_KEY_PREFIX,
                          expiration: REDIS_LOG_EXPIRATION_IN_SECS
                        )
        self.log_id   = log.id
        store

        downloader    = CartoDB::Importer2::Downloader.new(
                          url,
                          etag:             etag,
                          last_modified:    modified_at,
                          checksum:         checksum,
                          verify_ssl_cert:  false
                        )
        runner        = CartoDB::Importer2::Runner.new(
                          pg_options, downloader, log, user.remaining_quota
                        )
        database      = user.in_database
        importer      = CartoDB::Synchronization::Adapter
                          .new(name, runner, database, user)

        importer.run
        self.ran_at   = Time.now
        self.run_at   = Time.now + interval

        if importer.success?
          set_success_state_from(importer)
        elsif retried_times < 3
          @log_trace = importer.runner_log_trace
          set_retry_state_from(importer)
        else
          @log_trace = importer.runner_log_trace
          set_failure_state_from(importer)
        end

        store
        self
      rescue => exception
        puts exception.to_s
        puts exception.backtrace
        set_failure_state_from(importer)
        store
      end

      def set_success_state_from(importer)
        self.log            << '******** synchronization succeeded ********'
        self.log_trace      = nil
        self.state          = 'success'
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

      # Tries to run automatic geocoding if present
      def geocode_table
        return unless table && table.automatic_geocoding
        self.log << 'Running automatic geocoding...'
        table.automatic_geocoding.run
      rescue => e
        self.log << "Error while running automatic geocoding: #{e.message}" 
      end # geocode_table

      def set_retry_state_from(importer)
        self.log            << '******** synchronization failed, will retry ********'
        self.log_trace      = importer.runner_log_trace
        self.log            << "*** Runner log: #{self.log_trace} \n***" unless self.log_trace.nil?
        self.state          = 'success'
        self.error_code     = importer.error_code
        self.error_message  = importer.error_message
        self.retried_times  = self.retried_times + 1
      end

      def set_failure_state_from(importer)
        self.log            << '******** synchronization failed ********'
        self.log_trace      = importer.runner_log_trace
        self.log            << "*** Runner log: #{self.log_trace} \n***" unless self.log_trace.nil?
        self.state          = 'failure'
        self.error_code     = importer.error_code
        self.error_message  = importer.error_message
        self.retried_times  = self.retried_times + 1
      end

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
        @table ||= ::Table.where(name: name, user_id: user.id).first 
      end # table

      def authorize?(user)
        user.id == user_id && !!user.sync_tables_enabled
      end

      def pg_options
        Rails.configuration.database_configuration[Rails.env].symbolize_keys
          .merge(
            user:     user.database_username,
            password: user.database_password,
            database: user.database_name
          )
      end 

      def log
        return @log if defined?(@log) && @log
        log_attributes = {
          prefix:     REDIS_LOG_KEY_PREFIX,
          expiration: REDIS_LOG_EXPIRATION_IN_SECS
        }
        log_attributes.merge(id: log_id) if log_id
        @log  = TrackRecord::Log.new(log_attributes)
        @log.fetch if log_id
        @log_id = @log.id
        @log
      end

      def valid_uuid?(text)
        !!UUIDTools::UUID.parse(text)
      rescue TypeError
        false
      rescue ArgumentError
        false
      end

      attr_reader :repository

      attr_accessor :log_trace

    end # Member
  end # Synchronization
end # CartoDB

