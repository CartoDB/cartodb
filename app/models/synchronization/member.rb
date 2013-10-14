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

      STATES = %w{ enabled disabled }
      REDIS_LOG_KEY_PREFIX          = 'synchronization'
      REDIS_LOG_EXPIRATION_IN_SECS  = 3600 * 24 * 2 # 2 days

      attribute :id,              String
      attribute :name,            String
      attribute :interval,        Integer,  default: 3600
      attribute :url,             String
      attribute :state,           String,   default: 'created'
      attribute :user_id,         Integer
      attribute :created_at,      Time
      attribute :updated_at,      Time
      attribute :run_at,          Time     
      attribute :ran_at,          Time
      attribute :retried_times,   Integer,  default: 0
      attribute :error_code,      Integer
      attribute :error_message,   String
      attribute :log_id,          String

      def initialize(attributes={}, repository=Synchronization.repository)
        super(attributes)

        @repository         = repository
        self.id             ||= @repository.next_id
        self.state          ||= 'created'
        self.ran_at         ||= Time.now
        self.interval       ||= 3600
        self.run_at         ||= ran_at + interval
        self.retried_times  ||= 0
        self.log_id         ||= log.id
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
        self.ran_at   = Time.now
        log           = TrackRecord::Log.new(
                          prefix:     REDIS_LOG_KEY_PREFIX,
                          expiration: REDIS_LOG_EXPIRATION_IN_SECS
                        )
        self.log_id   = log.id
        store

        downloader    = CartoDB::Importer2::Downloader.new(url)
        runner        = CartoDB::Importer2::Runner.new(
                          pg_options, downloader, log, user.remaining_quota
                        )
        database      = user.in_database
        importer      = CartoDB::Synchronization::Adapter
                          .new(name, runner, database, user)
        
        importer.run

        if importer.success?
          set_success_state_from(importer)
        else
          set_failure_state_from(importer)
        end

        store
        self
      rescue => exception
        set_failure_state_from(importer)
        store
      end

      def set_success_state_from(importer)
        self.log            << "******** synchronization succeeded ********" 
        self.state          = 'success'
        self.error_code     = nil
        self.error_message  = nil
        self.retried_times  = 0
        self.run_at         = Time.now + interval
      end

      def set_failure_state_from(importer)
        self.log            << "******** synchronization failed ********" 
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

      def enabled?
        state == 'enabled'
      end

      def enable
        self.state = 'enabled'
      end

      def disable
        self.state = 'disabled'
      end
      
      def set_timestamps
        self.created_at ||= Time.now
        self.updated_at = Time.now
        self
      end

      def user
        @user ||= User.where(id: user_id).first
      end

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
        @log  = TrackRecord::Log.new(
          id:         log_id,
          prefix:     REDIS_LOG_KEY_PREFIX,
          expiration: REDIS_LOG_EXPIRATION_IN_SECS
        ).fetch
      end

      def valid_uuid?(text)
        !!UUIDTools::UUID.parse(text)
      rescue TypeError => exception
        false
      rescue ArgumentError => exception
        false
      end

      attr_reader :repository
    end # Member
  end # Synchronization
end # CartoDB

