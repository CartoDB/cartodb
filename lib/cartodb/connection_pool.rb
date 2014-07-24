require 'fiber'

module CartoDB
  class ConnectionPool
    
    MAX_POOL_SIZE = 300
    
    def initialize
      @pool = {}
    end

    # Intended only for testing
    def all
      @pool
    end

    def fetch(configuration, &block)
      conn = nil
      if @pool[connection_id(configuration)]
        puts "##### [pool] Found a connection for #{connection_id(configuration)} (#{@pool.keys.size})"
        Rails.logger.debug "[pool] Found a connection for #{connection_id(configuration)} (#{@pool.keys.size})"
        @pool[connection_id(configuration)][:last_accessed] = Time.now
        conn = @pool[connection_id(configuration)][:connection]
      else
        puts "##### CREATING NEW POOL CONNECTION"
        conn = create_new_connection(configuration, &block)
      end
      pool_tries = 0
      # Test the connection to see if it's still alive
      while pool_tries < 3
        begin

          puts "**** RIGHT BEFORE THE POOL CHECK START"
          connection_params2 = ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
            'host' => conn.opts[:host],
            'database' => 'postgres'
          ) {|key, o, n| n.nil? ? o : n}
          conn2 = ::Sequel.connect(connection_params2)
          puts "*** CONN START"
          conn2.fetch("SELECT datname,usename,pid from pg_stat_activity").all.each do |r|
            puts r
          end
          puts "*** CONN END"
          conn2.disconnect
          puts "**** RIGHT BEFORE THE POOL CHECK END"
          
          puts "******* Testing pool key: #{connection_id(configuration)}"
          puts "******* Testing pool connection: #{conn.opts[:database]}:#{conn.opts[:user]}"
          res = conn.get(1)
          puts res
          if !res.to_s.match("terminating connection due to administrator command").nil?
            raise Sequel::DatabaseDisconnectError 
          end
          puts "******* PASSED"
          
          puts "**** RIGHT AFTER THE POOL CHECK START"
          connection_params2 = ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
            'host' => conn.opts[:host],
            'database' => 'postgres'
          ) {|key, o, n| n.nil? ? o : n}
          conn2 = ::Sequel.connect(connection_params2)
          puts "*** CONN START"
          conn2.fetch("SELECT datname,usename,pid from pg_stat_activity").all.each do |r|
            puts r
          end
          puts "*** CONN END"
          conn2.disconnect
          puts "**** RIGHT AFTER THE POOL CHECK END"
          
          return conn
        rescue => e
          puts e
          # If it's not alive, close it and create a new one
          puts "######### FAILED ##########"
          conn.disconnect
          conn = create_new_connection(configuration, &block)
          pool_tries = pool_tries + 1
          sleep 2
        end
      end
      # This conn may be still broken after 3 tries
      return conn
    end

    def max_pool_size?
      if @pool.size >= MAX_POOL_SIZE
        #close_connections!
        close_oldest_connection!
      end
    end

    def create_new_connection(configuration, &block)
      max_pool_size?
      connection = yield
      @pool[connection_id(configuration)] = { :connection => connection, :last_accessed => Time.now }
      Rails.logger.debug "[pool] Creating a new connection for #{connection_id(configuration)} (#{@pool.keys.size})"
      connection
    end
    
    def close_connections!(db=nil)
      newpool = {}
      @pool.each do |id, conn|
        if ! db || ( id.start_with? "#{db}:" )
          Rails.logger.debug "[pool] Dropping connection #{id}"
          conn[:connection].disconnect
        else
          Rails.logger.debug "[pool] Not dropping connection #{id}"
          newpool[id] = conn
        end
      end
      @pool = newpool
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
