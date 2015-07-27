# encoding: utf-8
require 'yaml'
require 'resque'
require_relative '../../../../app/models/log'
require_relative '../../../../app/models/synchronization/member'
require_relative '../../../../lib/resque/synchronization_jobs'

unless defined? Cartodb
  config = YAML.load_file(
      File.join(File.dirname(__FILE__), '../../../../config/app_config.yml')
    )[ENV['RAILS_ENV'] || 'development']
  Resque.redis = "#{config['redis']['host']}:#{config['redis']['port']}"
end

module CartoDB
  module Synchronizer
    class Collection
      DEFAULT_RELATION      = 'synchronizations'

      def initialize(pg_options={}, relation=DEFAULT_RELATION)
        @db = Rails::Sequel.connection
        @relation = relation
        @records  = []
      end

      def print_log(message, error=false)
        puts message if error || ENV['VERBOSE']
      end

      def run
        fetch
        process
        print_log 'Pass finished'
      end

      # Fetches and enqueues all syncs that should run
      # @param force_all_syncs bool
      def fetch_and_enqueue(force_all_syncs=false)
        begin
          if force_all_syncs
            query = db.fetch(%Q(
              SELECT name, id FROM #{relation} WHERE
              state = '#{CartoDB::Synchronization::Member::STATE_SUCCESS}'
              OR state = '#{CartoDB::Synchronization::Member::STATE_SYNCING}'
            ))
          else
            query = db.fetch(%Q(
              SELECT name, id, user_id FROM #{relation}
              WHERE EXTRACT(EPOCH FROM run_at) < #{Time.now.utc.to_f}
              AND
                (
                  state = '#{CartoDB::Synchronization::Member::STATE_SUCCESS}'
                  OR (state = '#{CartoDB::Synchronization::Member::STATE_FAILURE}'
                      AND retried_times < #{CartoDB::Synchronization::Member::MAX_RETRIES})
                )
            ))
          end
          success = true
        rescue Exception => e
          success = false
          print_log("ERROR fetching sync tables: #{e.message}, #{e.backtrace}", true)
        end

        if success
          print_log "Fetched #{query.count} records"
          force_all_syncs ? enqueue_all(query) : enqueue_rate_limited(query)
        end

        self
      end

      # This is probably for testing purposes only, as fetch also does the processing
      def process(members=@members)
        print_log "Processing #{members.size} records"
        members.each { |member|
          print_log "Enqueueing #{member.name} (#{member.id})"
          member.enqueue
        }
      end

      attr_reader :records, :members

      private

      def enqueue_all(query)
        query.each { |record|
          print_log "Enqueueing '#{record[:name]}' (#{record[:id]})"
          Resque.enqueue(Resque::SynchronizationJobs, job_id: record[:id])
          db.run(%Q(
             UPDATE #{relation} SET state = '#{CartoDB::Synchronization::Member::STATE_QUEUED}'
              WHERE id = '#{record[:id]}'
           ))
        }
      end

      def enqueue_rate_limited(query)
        # TODO: - Instantiate user (and maybe need also to instantiate record, or fake object containing an .id)
        # - check platform limit (peek, not increasing)
        # - enqueue if not hit
        # - make job logic decrease platform limit in case of ok/ko (as imports)
        query.each { |record|
          print_log "Enqueueing '#{record[:name]}' (#{record[:id]})"
          Resque.enqueue(Resque::SynchronizationJobs, job_id: record[:id])
          db.run(%Q(
             UPDATE #{relation} SET state = '#{CartoDB::Synchronization::Member::STATE_QUEUED}'
              WHERE id = '#{record[:id]}'
           ))
        }
      end


      attr_reader :db, :relation
      attr_writer :records, :members
    end
  end
end

