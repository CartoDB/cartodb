module CartoDB
  module Stats

    class Authentication < Aggregator

      PREFIX = 'logins'

      # TODO: get config by default?
      def self.instance(config=[], host_info = Socket.gethostname)
        super(PREFIX, config, host_info)
      end

      def increment_login_counter(email)
        begin
          # TODO: Migrate to AR model (and same below)
          u = User.select(:username).filter(:email => email).or(:username => email).first
          username = u ? u.username : 'UNKNOWN'

          increment("success.total")
          increment("success.hosts.#{Socket.gethostname.gsub('.', '_')}")
          increment("success.users.#{username}")
        rescue
        end
      end
    
      def increment_failed_login_counter(email)
        begin
          u = User.select(:username).filter(:email => email).or(:username => email).first
          username = u ? u.username : 'UNKNOWN'
          increment("failed.total")
          increment("failed.hosts.#{Socket.gethostname.gsub('.', '_')}")
          increment("failed.users.#{username}")
        rescue
        end
      end

    end

  end
end