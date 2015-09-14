module CartoDB
  class RedisTest
    REDIS_PID        = "/tmp/redis-test.pid"
    REDIS_CACHE_PATH = "/tmp"
    REDIS_DB_NAME    = "redis_test.rdb"

    def self.down
      if Cartodb.config[:parallel_tests]
        if File.file?(Cartodb.config[:redis]["pid"])
          puts "\n[redis] Shutting down test server..."
          pid = File.read(Cartodb.config[:redis]["pid"]).to_i
          system("kill -9 #{pid}")
          File.delete(Cartodb.config[:redis]["pid"])
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
      port = Cartodb.config[:redis]["port"] 
      if Cartodb.config[:parallel_tests]
        print "Setting up redis config for parallel tests..."
        new_redis_pid = Cartodb.config[:redis]["pid"]
        new_cache_path = Cartodb.config[:redis]["dir"]
        new_logfile = Cartodb.config[:redis]["log"]
        Dir.mkdir Cartodb.config[:redis]["dir"] unless File.exists?(Cartodb.config[:redis]["dir"])
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
