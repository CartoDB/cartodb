module CartoDB
  module Stats

    class Authentication < Aggregator

      PREFIX = 'logins'

      def self.instance(host = nil, port = nil, host_info = nil)
        super(PREFIX, host, port, host_info)
      end

      def increment_login_counter(email)
        begin
          # TODO: Migrate to AR model (and same below)
          u = User.select(:username).filter(:email => email).or(:username => email).first
          username = u ? u.username : 'UNKNOWN'

          increment("success.total")
          increment("success.hosts.#{Socket.gethostname.gsub('.', '_')}")
          increment("success.users.#{username}")
        rescue => e
        end
      end
    
      def increment_failed_login_counter(email)
        begin
          u = User.select(:username).filter(:email => email).or(:username => email).first
          username = u ? u.username : 'UNKNOWN'
          increment("failed.total")
          increment("failed.hosts.#{Socket.gethostname.gsub('.', '_')}")
          increment("failed.users.#{username}")
        rescue => e
        end
      end

    end

  end
end