module CartoDB
  class ConnectionPool
    def initialize
      @pool = {}
    end
    
    def fetch(configuration, &block)
      if connection = @pool[connection_id(configuration)]
        Rails.logger.info "[pool] Found a connection for #{connection_id(configuration)}"
        connection
      else
        connection = yield
        @pool[connection_id(configuration)] = connection
        Rails.logger.info "[pool]  Creating a new connection for #{connection_id(configuration)} (#{@pool.keys.size})"
        connection
      end
    end
    
    def close_connections!
      @pool.values.each{ |connection| connection.disconnect }
    end
    
    private
    
    def connection_id(configuration)
      "#{configuration['database']}:#{configuration['username']}"
    end
  end
end