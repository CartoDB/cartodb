# See http://www.be9.io/2015/09/21/memory-leak/
# This enables memory logging in order to check memory consumption (reproducing memory leaks)
if ENV['MEMORY_REPORTING']
  Thread.new do
    while true
      pid = Process.pid
      rss = `ps -eo pid,rss | grep #{pid} | awk '{print $2}'`.to_i
      Rails.logger.info "MEMORY[#{pid}]: rss: #{rss}, live objects #{GC.stat[:heap_live_slots]}"

      sleep 5
    end
  end

  require 'rack/gc_tracer'
  Rails.configuration.middleware.use Rack::GCTracerMiddleware, view_page_path: '/gc_tracer', filename: 'log/gc.log'

  require 'objspace'
  ObjectSpace.trace_object_allocations_start

  require 'rbtrace'
  require 'memory_profiler'
end

module CartoDB
  def self.memory_dump(filename)
    require 'objspace'
    # Dump classes (id -> name)
    cls = ObjectSpace.each_object.inject(Hash.new(0)) do |h, o|
      h[o.class.object_id] = o.class.name rescue 'ERR'
      h
    end
    File.open(filename + '.classes', 'w') do |f|
      JSON.dump(cls, f)
    end

    GC.start

    # Dump objects
    File.open(filename + '.dump', 'w') do |f|
      ObjectSpace.dump_all(output: f)
    end
  end
end
