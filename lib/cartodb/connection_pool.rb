require 'fiber'

module CartoDB
  class ConnectionPool
    
    MAX_POOL_SIZE = 300
    
    def initialize
      @pool = {}
    end
    
    def fetch(configuration, &block)
      if @pool[connection_id(configuration)]
        Rails.logger.debug "[pool] Found a connection for #{connection_id(configuration)} (#{@pool.keys.size})"
        @pool[connection_id(configuration)][:last_accessed] = Time.now
        @pool[connection_id(configuration)][:connection]
      else
        if @pool.size >= MAX_POOL_SIZE
          #close_connections!
          close_oldest_connection!
        end
        connection = yield
        @pool[connection_id(configuration)] = { :connection => connection, :last_accessed => Time.now }
        Rails.logger.debug "[pool] Creating a new connection for #{connection_id(configuration)} (#{@pool.keys.size})"
        connection
      end
    end
    
    def close_connections!
      @pool.each do |connection_id, conn|
        conn[:connection].disconnect
      end
      @pool = {}
    end
    
    def close_oldest_connection!
      older = nil
      oldest_access = nil
      @pool.each do |connection_id, conn|
        if oldest_access.nil? || oldest_access < conn[:last_accessed]
          oldest_access = conn[:last_accessed]
          older = connection_id
        end
      end
      @pool[older][:connection].disconnect
      @pool.delete(older)
    end
    
    private
    
    def connection_id(configuration)
      "#{configuration['database']}:#{configuration['username']}"
    end
  end
end