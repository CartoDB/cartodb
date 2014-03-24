require_relative 'utils'

module CartoDB
  module Relocator
    class QueueConsumer
      include CartoDB::Relocator::Connections

      def initialize(params={})
        @config = params[:config]
        @dbname = @config[:dbname]
        @username = @config[:username]
      end

      def redis
        @redis ||= Redis.new(@config[:redis])
      end
      
      def empty_queue
        redis.del @dbname
      end

      def redis_migrator_loop(wait_for=5)
        wait_for_counter = 0
        puts "REDIS QUEUE LENGTH: #{redis.llen(@dbname)}"
        while wait_for_counter < wait_for do
          puts "Reading queue.."
          key = redis.brpop(@dbname, 1)
          if key == nil
            puts "Nothing read for #{wait_for_counter} seconds."
            wait_for_counter += 1
          else
            query = key[1]
            begin
              target_db.query(query)
              puts "Query ran: #{query}"
            rescue Exception => e
              puts "ERROR on query #{query}: #{e}, #{e.backtrace}"
            end
            wait_for_counter = 0
          end
        end
      end
    end
  end
end

