require 'yaml'
require 'resque'
require_relative '../../../../app/models/synchronization/member'
require_relative '../../../../lib/resque/synchronization_jobs'
require_relative '../../../../services/platform-limits/platform_limits'
require 'carto/configuration'

unless defined? Cartodb
  config = Carto::Conf.new.app_config[ENV['RAILS_ENV'] || 'development']
  Resque.redis = "#{config['redis']['host']}:#{config['redis']['port']}"
end

module CartoDB
  module Synchronizer
    class Collection
      DEFAULT_RELATION      = 'synchronizations'

      def initialize(pg_options={}, relation=DEFAULT_RELATION)
        @db = SequelRails.connection
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

      def fetch_all
        query = db.fetch(%Q(
            SELECT id FROM #{relation}
          ))
      end

      # Fetches and enqueues all syncs that should run
      # @param force_all_syncs bool
      def fetch_and_enqueue(force_all_syncs=false)
        begin
          if force_all_syncs
            query = db.fetch(%Q(
              SELECT r.name, r.id FROM #{relation} r, users u WHERE
              (r.state = '#{CartoDB::Synchronization::Member::STATE_SUCCESS}'
              OR r.state = '#{CartoDB::Synchronization::Member::STATE_SYNCING}')
              AND u.id = user_id AND u.state = '#{Carto::User::STATE_ACTIVE}'
            ))
          else
            query = db.fetch(%Q(
              SELECT r.name, r.id, r.user_id FROM #{relation} r, users u
              WHERE EXTRACT(EPOCH FROM r.run_at) < #{Time.now.utc.to_f}
              AND u.id = user_id AND u.state = '#{Carto::User::STATE_ACTIVE}'
              AND
                (
                  r.state = '#{CartoDB::Synchronization::Member::STATE_SUCCESS}'
                  OR (r.state = '#{CartoDB::Synchronization::Member::STATE_FAILURE}'
                      AND r.retried_times < #{CartoDB::Synchronization::Member::MAX_RETRIES})
                )
              ORDER BY ran_at
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

      attr_reader :records

      private

      def enqueue_all(query)
        query.each { |record|
          enqueue_record(record)
        }
      end

      # @see /app/controllers/api/json/synchronizations_controller -> sync()
      def enqueue_rate_limited(query)

        query.each { |record|
          user = Carto::User.where(id: record[:user_id]).first
          next if user.nil?

          platform_limit = CartoDB::PlatformLimits::Importer::UserConcurrentSyncsAmount.new({
              user: user, redis: { db: $users_metadata }
            })
          if platform_limit.is_within_limit?
            enqueue_record(record)
            platform_limit.increment!
          else
            print_log "User '#{user.username}' hit concurrent syncs rate limit, '#{record[:name]}' skipped"
          end
        }
      end

      def enqueue_record(record_data)
        print_log "Enqueueing '#{record_data[:name]}' (#{record_data[:id]})"
        Resque.enqueue(Resque::SynchronizationJobs, job_id: record_data[:id])
        db.run(%Q(
           UPDATE #{relation} SET state = '#{CartoDB::Synchronization::Member::STATE_QUEUED}'
            WHERE id = '#{record_data[:id]}'
         ))
      end

      attr_reader :db, :relation
      attr_writer :records
    end
  end
end

