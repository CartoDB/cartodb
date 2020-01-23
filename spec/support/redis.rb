module CartoDB
  module OS
    def self.windows?
      (/cygwin|mswin|mingw|bccwin|wince|emx/ =~ RUBY_PLATFORM) != nil
    end

    def self.mac?
      (/darwin/ =~ RUBY_PLATFORM) != nil
    end

    def self.unix?
      !windows?
    end

    def self.linux?
      unix? && !mac?
    end
  end

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

      raise "Your OS is not supported" unless OS.unix?

      redis_cell_base_path = '/etc/redis/redis-cell'
      redis_cell_path = "#{redis_cell_base_path}/libredis_cell.so"
      redis_cell_path = "#{redis_cell_base_path}/libredis_cell.dylib" if OS.mac?

      #raise "Please drop redis-cell binaries in #{redis_cell_base_path}" unless FileTest.exist?(redis_cell_path)

      redis_options = {
        "port"          => port,
        "daemonize"     => 'yes',
        "pidfile"       => new_redis_pid || REDIS_PID,
        "timeout"       => 300,
        "dbfilename"    => REDIS_DB_NAME,
        "dir"           => new_cache_path || REDIS_CACHE_PATH,
        "loglevel"      => "notice",
        "logfile"       => new_logfile || "stdout",
        "loadmodule"    => redis_cell_path
      }.map { |k, v| "#{k} #{v}" }.join("\n")

      output = `printf '#{redis_options}' | redis-server - 2>&1`
      if $?.success?
        puts('done')
        sleep 2
      else
        #raise "Error starting test Redis server: #{output}"
      end
    end

  end
end
