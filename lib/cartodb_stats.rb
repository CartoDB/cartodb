class CartodbStats

  class << self

    def update_tables_counter(count)
      CartoDB::Logger.info Statsd.host
      begin
        if count == 1
          Statsd.increment('tables.total')
        elsif count == -1
          Statsd.decrement('tables.total')
        end
      rescue => e
      end
    end

    def update_tables_counter_per_user(count, user)
      begin
        if count == 1
          Statsd.increment("tables.users.#{user}")
        elsif count == -1
          Statsd.decrement("tables.users.#{user}")
        end
      rescue => e
      end
    end

    def update_tables_counter_per_host(count)
      require 'socket'
      begin 
        if count == 1
          Statsd.increment("tables.servers.#{Socket.gethostname.gsub('.', '_')}")
        elsif count == -1
          Statsd.decrement("tables.servers.#{Socket.gethostname.gsub('.', '_')}")
        end
      rescue => e
      end
    end

    def update_tables_counter_per_plan(count, plan)
      begin
        if count == 1
          Statsd.increment("tables.plans.#{plan.gsub(/[\[\]]/, '').upcase}")
        elsif count == -1
          Statsd.decrement("tables.plans.#{plan.gsub(/[\[\]]/, '').upcase}")
        end
      rescue => e
      end
    end

    def increment_imports()
      require 'socket'
      begin 
        Statsd.increment("imports.success.total")
        Statsd.increment("imports.success.servers.#{Socket.gethostname.gsub('.', '_')}")
      rescue => e
      end
    end
    
    def increment_failed_imports()
      require 'socket'
      begin 
        Statsd.increment("imports.failed.total")
        Statsd.increment("imports.failed.servers.#{Socket.gethostname.gsub('.', '_')}")
      rescue => e
      end
    end
  
  end

end
