require_relative 'aggregator'

module CartoDB
  module Stats

    class Authentication < Aggregator

      PREFIX = 'logins'

      def self.instance(config={})
        # INFO: We explicitly not want anything on the prefix other than PREFIX constant
        super(PREFIX, config, host_info=nil)
      end

      def increment_login_counter(email)
        begin
          increment("success.total")
          increment("success.hosts.#{Socket.gethostname.gsub('.', '_')}")
          increment("success.users.#{get_username(email)}")
        rescue StandardError
        end
      end

      def increment_failed_login_counter(email)
        begin
          increment("failed.total")
          increment("failed.hosts.#{Socket.gethostname.gsub('.', '_')}")
          increment("failed.users.#{get_username(email)}")
        rescue StandardError
        end
      end

      private

      def get_username(email)
        user = Carto::User.where("username=? OR email=?", email, email).first
        user ? user.username : 'UNKNOWN'
      end

    end

  end
end
