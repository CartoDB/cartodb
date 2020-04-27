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

      def replace_rule(name, ips)
        delete_rule(
          project_id: config['project_id'],
          name: name
        )

        if ips.present?
          create_rule(
            project_id: config['project_id'],
            name: name,
            network: config['network'],
            ips: ips,
            target_tag: config['target_tag'],
            ports: config['ports']
          )
        end
      end

      private

      def delete_rule(project_id:, name:)
        # `gcloud compute firewall-rules delete "#{name}"`

        # we could check existence with @service.list_firewalls(project_id).find {|r| r.name == name}
        # but since there could be race conditions anyway we'll just rescue errors
        @service.delete_firewall(config['project_id'], name)

      rescue Google::Apis::ClientError => error
        raise unless error.message =~ /^notFound:/
      end

      def create_rule(project_id:, name:, network:, ips:, target_tag:, ports:)
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

      def network_url(project_id, network)
        "#{PROJECTS_URL}/#{project_id}/global/networks/#{network}"
      end
    end
  end
end
