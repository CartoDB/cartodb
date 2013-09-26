module CartoDB
  class RedisTest
    REDIS_PID        = "/tmp/redis-test.pid"
    REDIS_CACHE_PATH = "/tmp"
    REDIS_DB_NAME    = "redis_test.rdb"
    
    def self.down
      if File.file?(REDIS_PID)
        puts "\n[redis] Shutting down test server..."
        pid = File.read(REDIS_PID).to_i
        system("kill -9 #{pid}")
        File.delete(REDIS_PID)
      end
      File.delete(File.join(REDIS_CACHE_PATH, REDIS_DB_NAME)) if File.file?(File.join(REDIS_CACHE_PATH, REDIS_DB_NAME))
    end
    
    def self.up
      down
      port = Cartodb.config[:redis]["port"]
      print "[redis] Starting test server on port #{port}... "
      redis_options = {
        "port"          => port,
        "daemonize"     => 'yes',
        "pidfile"       => REDIS_PID,
        "timeout"       => 300,
        "dbfilename"    => REDIS_DB_NAME,
        "dir"           => REDIS_CACHE_PATH,
        "loglevel"      => "debug",
        "logfile"       => "stdout"
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
