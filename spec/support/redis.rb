module CartoDB
  class RedisTest
    REDIS_PID        = "/tmp/redis-test.pid"
    REDIS_CACHE_PATH = "/tmp"
    REDIS_DB_NAME    = "redis_test.rdb"

    def self.down
      if ENV['REDIS_PORT']
        if File.file?("/tmp/redis-test-#{ENV['REDIS_PORT']}.tmp")
          puts "\n[redis] Shutting down test server..."
          pid = File.read("/tmp/redis-test-#{ENV['REDIS_PORT']}.tmp").to_i
          system("kill -9 #{pid}")
          File.delete("/tmp/redis-test-#{ENV['REDIS_PORT']}.tmp")
        end
      else
        if File.file?(REDIS_PID)
          puts "\n[redis] Shutting down test server..."
          pid = File.read(REDIS_PID).to_i
          system("kill -9 #{pid}")
          File.delete(REDIS_PID)
        end
        File.delete(File.join(REDIS_CACHE_PATH, REDIS_DB_NAME)) if File.file?(File.join(REDIS_CACHE_PATH, REDIS_DB_NAME))
      end
    end

    def self.up
      down
      if ENV['REDIS_PORT']
        print "Setting up redis config..."
        port = ENV['REDIS_PORT']
        new_redis_pid = "/tmp/redis-test-#{ENV['REDIS_PORT']}.tmp"
        new_cache_path = "/tmp/redis-#{ENV['REDIS_PORT']}"
        new_logfile = "/tmp/redis-#{ENV['REDIS_PORT']}/stdout"
        Dir.mkdir "/tmp/redis-#{ENV['REDIS_PORT']}" unless File.exists?("/tmp/redis-#{ENV['REDIS_PORT']}")
      else
        port = Cartodb.config[:redis]["port"]
      end
      print "[redis] Starting test server on port #{port}... "
      redis_options = {
        "port"          => port,
        "daemonize"     => 'yes',
        "pidfile"       => new_redis_pid || REDIS_PID,
        "timeout"       => 300,
        "dbfilename"    => REDIS_DB_NAME,
        "dir"           => new_cache_path || REDIS_CACHE_PATH,
        "loglevel"      => "debug",
        "logfile"       => new_logfile || "stdout"
      }.map { |k, v| "#{k} #{v}" }.join("\n")
      output = `printf '#{redis_options}' | redis-server - 2>&1`
      if $?.success?
        puts('done')
        sleep 2
      else
        raise "Error starting test Redis server: #{output}"
      end
    end

  end
end
