module Carto
  module Dbdirect
    # Firewall Rule Manager
    class FirewallManager
      def initialize(config)
        @config = config
        @enabled = config['enabled'] == true
      end

      attr_reader :config

      def enabled?
        @enabled
      end

      def replace_rule(rule_id, ips)
        return unless enabled?
        name = rule_name(rule_id)

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

      def rule_name(rule_id)
        config['rule_name'].gsub('{{id}}', rule_id)
      end

      def delete_rule(project_id:, name:)
        # `gcloud compute firewall-rules delete "#{name}"`
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

        # run SysCmd.command 'cloud compute firewall-rules create' do
        #   option '-q'
        #   value name
        #   option '--network', network
        #   option '--direction', 'ingress'
        #   option '--action', 'allow'
        #   option '--source-ranges', ips.join(',')
        #   option '--target-tags', target_tag
        #   option '--rules', ports
        #   option '--no-enable-logging'
        #   option '--project', project_id
        # end
      end
    end
  end
end
