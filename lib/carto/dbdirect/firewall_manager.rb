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
        # `gcloud compute firewall-rules delete "#{name}"`

        @service.delete_firewall(config['project_id'], name)
      end

      def create_rule(name:, ips:)
        #   `gcloud -q compute firewall-rules create "#{name}" \
        #     --network "#{network}" \
        #     --direction ingress \
        #     --action allow \
        #     --source-ranges "#{ips.join(',')}" \
        #     --target-tags "#{target_tag}" \
        #     --rules "#{ports}" \
        #     --no-enable-logging  \
        #     --project "#{project_id}"`

        protocol, port = config['ports'].split(':')
        allowed = Google::Apis::ComputeV1::Firewall::Allowed.new(
          ip_protocol: protocol,
          ports: [port.split(',')]
        )
        rule = Google::Apis::ComputeV1::Firewall.new(
          name: name,
          allowed: [allowed],
          network: network_url(config['project_id'], config['network']),
          source_ranges: ips,
          target_tags: [config['target_tag']]
        )

        @service.insert_firewall(config['project_id'], rule)
      end

      def update_rule(name:, ips:)
        protocol, port = config['ports'].split(':')
        allowed = Google::Apis::ComputeV1::Firewall::Allowed.new(
          ip_protocol: protocol,
          ports: [port.split(',')]
        )
        rule = @service.get_firewall(config['project_id'], name)
        rule.allowed = [allowed]
        rule.network = network_url(config['project_id'], config['network'])
        rule.souce_ranges = ips
        rule.target_tags = config['target_tag']

        service.update_firewall(project, name, rule)
      end

      private

      def network_url(project_id, network)
        "#{PROJECTS_URL}/#{project_id}/global/networks/#{network}"
      end
    end
  end
end
