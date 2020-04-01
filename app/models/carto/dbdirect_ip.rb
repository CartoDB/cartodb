require 'ip_checker'

module Carto
  class DbdirectIp< ActiveRecord::Base
    belongs_to :user, inverse_of: :dbdirect_ip, foreign_key: :user_id

    serialize :ips, JSON
    validate :validate_ips

    private

    MAX_IP_MASK_HOST_BITS = 8

    def validate_ips
      support_legacy_ips_format
      # Check type
      unless ips.nil? || ips.kind_of?(Array) || ips.any? { |ip| !is.kind_of?(String) }
        errors.add(:ips, "IPs must be either be nil or an array of strings ")
        return false
      end
      ok = true
      if ips.present?
        ips.each do |ip|
          error = IpChecker.validate(
            ip,
            max_host_bits: MAX_IP_MASK_HOST_BITS,
            exclude_0: true,
            exclude_private: true,
            exclude_local: true,
            exclude_loopback: true
          )
          if error.present?
            ok = false
            errors.add(:ips, error)
          end
        end
      end
      ok
    end

    def support_legacy_ips_format
      if ips.present? && ips.kind_of?(String)
        self.ips = ips.split(',')
      end
    end
  end
end
