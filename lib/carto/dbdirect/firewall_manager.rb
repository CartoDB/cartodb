require 'google/apis/compute_v1'

module Carto
  module Dbdirect
    # Firewall Rule Manager
    class FirewallManager
      AUTH_URL = 'https://www.googleapis.com/auth/cloud-platform'.freeze
      PROJECTS_URL = 'https://www.googleapis.com/compute/v1/projects'.freeze

      def initialize(config)
        @config = config
        @service = Google::Apis::ComputeV1::ComputeService.new
        @service.authorization = Google::Auth.get_application_default([AUTH_URL])
      end

      attr_reader :config

      def delete_rule(name)
        @service.delete_firewall(config['project_id'], name)
      end

      def create_rule(name, ips)
        @service.insert_firewall(config['project_id'], firewall_rule(name, ips))
      end

      def update_rule(name, ips)
        @service.update_firewall(config['project_id'], name, firewall_rule(name, ips))
      end

      def get_rule(name)
        @service.get_firewall(config['project_id'], name).to_h
      end

      private

      def firewall_allowed
        protocol, port = config['ports'].split(':')
        Google::Apis::ComputeV1::Firewall::Allowed.new(
          ip_protocol: protocol,
          ports: [port.split(',')]
        )
      end

      def firewall_rule(name, ips)
        Google::Apis::ComputeV1::Firewall.new(
          name: name,
          allowed: [firewall_allowed],
          network: network_url(config['project_id'], config['network']),
          source_ranges: ips,
          target_tags: [config['target_tag']]
        )
      end

      def network_url(project_id, network)
        "#{PROJECTS_URL}/#{project_id}/global/networks/#{network}"
      end
    end
  end
end
