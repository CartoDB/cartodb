require 'thread'

class ThreadsMachine

  MAX_THREADS = 20

  def threads
    @threads ||= []
  end

  def queue
    @queue ||= Queue.new
  end

  def semaphore
    @semaphore ||= Mutex.new
  end

  def async
    MAX_THREADS.times do |count|
      queue.enq(:EOF)
      threads << Thread.new do |number|
        Thread.current[:name] = "Thread ##{count}"

        item = nil

        until queue.empty?
          item = queue.deq

          yield item if block_given?

        end
      end
    end

    threads.each do |t|
      begin
        t.join
      rescue RuntimeError => e
        puts "Failure on thread #{t[:name]}: #{e.message}"
      end
    end
  end

  def sync(item)
    semaphore.synchronize do
      yield item
    end
  end

end
