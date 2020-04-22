require 'ip_checker'
require 'carto/dbdirect/firewall_manager'

module Carto
  class DbdirectIp < ActiveRecord::Base
    belongs_to :user, inverse_of: :dbdirect_ip, foreign_key: :user_id

    # Note about the `ips` attribute:
    # The corresponding column is of type json, so there's no need for an explicit serializer
    # But there's a subtle difference here from having a text field and defining `serialize :ips JSON`
    # If a string is assigned to `ips` it is interpreted and parsed and JSON, and the result is nil
    # if not valid JSON. With the serializer version, the string would be preserved as string.

    validate :validate_ips

    after_save do
      update_firewall(*changes[:ips])
    end

    after_destroy do
      update_firewall(ips, nil)
    end


    def self.firewall_manager
      firewall_manager_class.new(config)
    end

    def self.firewall_manager_class
      Carto::Dbdirect::FirewallManager
    end

    def firewall_rule_name
      rule_id = user.dbdirect_bearer.organization&.name || user.dbdirect_bearer.username
      self.class.config['rule_name'].gsub('{{id}}', rule_id)
    end

    def self.config
      Cartodb.get_config(:dbdirect, 'firewall')
    end

    private

    MAX_IP_MASK_HOST_BITS = 8

    def validate_ips
      # Check type
      unless ips.kind_of?(Array) && ips.all? { |ip| ip.kind_of?(String) }
        errors.add(:ips, "IPs must be an array of strings ")
        return false
      end
      ok = true
      if ips.present?
        # Validate each IP
        ips.each do |ip|
          error = validate_ip(ip)
          if error.present?
            ok = false
            errors.add(:ips, error)
          end
        end
      end
      ok
    end

    def validate_ip(ip)
      IpChecker.validate(
        ip,
        max_host_bits: MAX_IP_MASK_HOST_BITS,
        exclude_0: true,
        exclude_private: true,
        exclude_local: true,
        exclude_loopback: true
      )
    end

    def update_firewall(old_ips, new_ips)
      old_ips ||= []
      new_ips ||= []
      if old_ips.sort != new_ips.sort
        rule_id = user.dbdirect_bearer.organization&.name || user.dbdirect_bearer.username
        self.class.firewall_manager.replace_rule(firewall_rule_name, new_ips)
      end
    end
  end
end
