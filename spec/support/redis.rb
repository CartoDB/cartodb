module CartoDB
  class RedisTest
    
    def self.pid_path
      "/tmp/redis.pid"
    end
    
    def self.db_path
      "/tmp/redis_test.rdb"
    end
    
    def self.down
      if File.file?(pid_path)
        pid = File.read(pid_path).to_i
        system("kill -9 #{pid}")
        File.delete(pid_path)
        File.delete(db_path) if File.file?(db_path)
        puts "\n[redis] Shuting down test server..."
      end
    end
    
    def self.up
      down
      if File.file?(pid_path)
        File.delete(pid_path)
      end
      puts "[redis] Running test server in #{APP_CONFIG[:redis]['host']}:#{APP_CONFIG[:redis]['port']}"
      system("`which redis-server` #{Rails.root}/spec/support/redis/redis.conf")
    end
    
  end
end