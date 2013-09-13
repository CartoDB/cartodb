module CartoDB
  class RedisTest
    REDIS_PID        = "/tmp/redis-test.pid"
    REDIS_CACHE_PATH = "/tmp"
    REDIS_DB_NAME    = "redis_test.rdb"
    
    def self.down
      if File.file?(REDIS_PID)
        puts "\n[redis] Shuting down test server..."
        pid = File.read(REDIS_PID).to_i
        system("kill -9 #{pid}")
        File.delete(REDIS_PID)
      end
      File.delete(File.join(REDIS_CACHE_PATH, REDIS_DB_NAME)) if File.file?(File.join(REDIS_CACHE_PATH, REDIS_DB_NAME))
    end
    
    def self.up
      down
      puts "[redis] Running test server..."
      redis_options = {
        "port"          => Cartodb.config[:redis]["port"],
        "daemonize"     => 'yes',
        "pidfile"       => REDIS_PID,
        "timeout"       => 300,
        "dbfilename"    => REDIS_DB_NAME,
        "dir"           => REDIS_CACHE_PATH,
        "loglevel"      => "debug",
        "logfile"       => "stdout"
      }.map { |k, v| "#{k} #{v}" }.join("\n")
      cmd = "printf '#{redis_options}' | redis-server -"
      system(cmd)
      sleep 2
    end
    
  end
end
