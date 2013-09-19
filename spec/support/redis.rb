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
      command = "`which redis-server` #{Rails.root}/spec/support/redis/redis.conf" +
        ( Cartodb.config[:redis].fetch('port', false) ? 
         " --port #{Cartodb.config[:redis]['port']}" : ""
         )
      system(command)
      sleep 2
      puts "[redis] Running test server..."
    end
    
  end
end
