module Carto
  module Dbdirect
    # Firewall Rule Manager
    class FirewallManager
      def initialize(config)
        @config = config
      end

      attr_reader :config

      def replace_rule(rule_id, ips)
        # TODO
      end
    end
  end
end
