require 'monitor'

# Basic thread pool with (unlimited) queue
# Based on http://burgestrand.se/code/ruby-thread-pool/
class ThreadPool

  def initialize(size, sleep_time=0.1)
    @size = size
    @sleep_time = sleep_time
    @workers_queue = []
    @workers_queue.extend(MonitorMixin)
    @mutex = @workers_queue.new_cond

    @pool = Array.new(@size) do |i|
      Thread.new do
        Thread.current[:id] = i
        catch(:exit) do
          loop do
            unless @workers_queue.empty?
              @workers_queue.synchronize do
                @mutex.wait_while { @workers_queue.empty? }
              end
              job, args = @workers_queue.pop
              job.call(*args)
              job = nil
              args = nil
            end
          end
        end
      end
    end
  end

  def schedule(*args, &block)
    enqueued = false
    begin
      if @workers_queue.length < @size
        @workers_queue.synchronize do
          @workers_queue << [block, args]
          enqueued = true
          @mutex.broadcast
        end
      else
        sleep(@sleep_time)
      end
    end while (!enqueued)
  end

  def shutdown
    @size.times do
      schedule { throw :exit }
    end
    @pool.map(&:join)
  end

end
