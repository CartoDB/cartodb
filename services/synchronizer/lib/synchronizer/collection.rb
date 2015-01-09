# encoding: utf-8
require 'eventmachine'
require 'pg/em'
require 'yaml'
require 'resque'
require_relative '../../../../app/models/log'
require_relative '../../../../app/models/synchronization/member'
require_relative '../../../../lib/resque/synchronization_jobs'

unless defined? Cartodb
  config = YAML.load_file(
    File.join(File.dirname(__FILE__), '../../../../config/app_config.yml') )[ENV['RAILS_ENV'] || 'development']
  Resque.redis = "#{config['redis']['host']}:#{config['redis']['port']}"
end

module CartoDB
  module Synchronizer
    class Collection
      DEFAULT_RELATION      = 'synchronizations'
      DATABASE_CONFIG_YAML  = File.join(
        File.dirname(__FILE__), '../../../../config/database.yml'
      )

      def initialize(pg_options={}, relation=DEFAULT_RELATION)
        pg_options = default_pg_options.merge(pg_options) if pg_options.empty?
        pg_options.store(:dbname, pg_options.delete(:database))

        @db       = PG::EM::Client.new(pg_options)
        @relation = relation
        @records  = [] 
      end #initialize

      def print_log(message, error=false)
        puts message if error || ENV['VERBOSE']
      end

      def run
        fetch
        process

        print_log 'Pass finished'
      end #run

      # Fetches and enqueues all syncs that should run
      # @param force_all_syncs bool
      def fetch(force_all_syncs=false)
        begin
          if force_all_syncs
            query = db.query(%Q(
              SELECT * FROM #{relation} WHERE
              state = '#{CartoDB::Synchronization::Member::STATE_SUCCESS}'
              OR state = '#{CartoDB::Synchronization::Member::STATE_SYNCING}'
            ))
          else
            query = db.query(%Q(
              SELECT * FROM #{relation}
              WHERE EXTRACT(EPOCH FROM run_at) < #{Time.now.utc.to_f}
              AND state = '#{CartoDB::Synchronization::Member::STATE_SUCCESS}'
            ))
          end

          success = true
        rescue Exception => e
          success = false
          print_log("ERROR fetching sync tables: #{e.message}, #{e.backtrace}", true)
        end

        if success
          print_log "Populating #{query.count} records after fetch"
          hydrate(query).each { |record|
            print_log "Enqueueing #{record.name} (#{record.id})"
           record.enqueue
          }
        end

        self
      end #fetch

      # Enqueues all syncs that got stalled (state syncing since too long).
      # This happens when we push code while a sync is being performed.
      def enqueue_stalled
        stalled_threshold = Time.now + (3600 * 2)

        begin
          query = db.query(%Q(
              SELECT * FROM #{relation}
              WHERE EXTRACT(EPOCH FROM ran_at) < #{stalled_threshold.utc.to_f}
              AND state = '#{CartoDB::Synchronization::Member::STATE_SYNCING}'
            ))
          success = true
        rescue Exception => e
          success = false
          print_log("ERROR fetching stalled sync tables: #{e.message}, #{e.backtrace}", true)
        end

        if success
          print_log "Populating #{query.count} records after stalled fetch"
          hydrate(query).each { |record|
            print_log "Enqueueing #{record.name} (#{record.id})"
            record.enqueue
          }
        end
      end

      # This is probably for testing purposes only, as fetch also does the processing
      def process(members=@members)
        print_log "Processing #{members.size} records"
        members.each { |member|
          print_log "Enqueueing #{member.name} (#{member.id})"
          member.enqueue
        }
      end #process

      attr_reader :records, :members

      private

      attr_reader :db, :relation
      attr_writer :records, :members

      def hydrate(records)
        @members = records.map { |record| CartoDB::Synchronization::Member.new(record) }
      end #hydrate

      def default_pg_options
        configuration = YAML.load_file(DATABASE_CONFIG_YAML)
        options       = configuration[ENV['RAILS_ENV'] || 'development']
        {
          host:       options.fetch('host'),
          port:       options.fetch('port'),
          user:       options.fetch('username'),
          password:   options.fetch('password'),
          database:   options.fetch('database')
        }
      end #default_pg_options
    end # Collection
  end # Synchronizer
end # CartoDB

