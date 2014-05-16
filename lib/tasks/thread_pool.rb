# Basic thread pool with (unlimited) queue
# @source: http://burgestrand.se/code/ruby-thread-pool/
class ThreadPool

  def initialize(size)
    @size = size
    @workers_queue = Queue.new
    @pool = Array.new(@size) do |i|
      Thread.new do
        Thread.current[:id] = i
        catch(:exit) do
          loop do
            job, args = @workers_queue.pop
            job.call(*args)
          end
        end
      end
    end
  end #initialize

  def schedule(*args, &block)
    @workers_queue << [block, args]
  end #schedule

  def shutdown
    @size.times do
      schedule { throw :exit }
    end
    @pool.map(&:join)
  end #shutdown

end #ThreadPool