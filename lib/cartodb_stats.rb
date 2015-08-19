class CartodbStats

  class << self

    def update_tables_counter(count)
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
          Statsd.increment("tables.hosts.#{Socket.gethostname.gsub('.', '_')}")
        elsif count == -1
          Statsd.decrement("tables.hosts.#{Socket.gethostname.gsub('.', '_')}")
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

    def increment_failed_login_counter(email)
      begin
        u = User.select(:username).filter(:email => email).or(:username => email).first
        username = u ? u.username : 'UNKNOWN'
        Statsd.increment("logins.failed.total")
        Statsd.increment("logins.failed.hosts.#{Socket.gethostname.gsub('.', '_')}")
        Statsd.increment("logins.failed.users.#{username}")
      rescue => e
      end
    end
  
  end

end
