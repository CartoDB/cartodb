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
        with_error_mapping do
          @service.delete_firewall(config['project_id'], name)
        end
      end

      def create_rule(name, ips)
        with_error_mapping do
          @service.insert_firewall(config['project_id'], firewall_rule(name, ips))
        end
      end

      def update_rule(name, ips)
        with_error_mapping do
          @service.update_firewall(config['project_id'], name, firewall_rule(name, ips))
        end
      end

      def get_rule(name)
        with_error_mapping do
          @service.get_firewall(config['project_id'], name).to_h
        end
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

      def with_error_mapping
        yield
      rescue Google::Apis::ClientError => error
        raise Carto::FirewallNotReadyError.new if error.message =~ /resourceNotReady/
        raise
      end
    end
  end
end
