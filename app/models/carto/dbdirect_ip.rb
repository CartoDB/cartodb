require 'ip_checker'

module Carto
  class DbdirectIp < ActiveRecord::Base
    belongs_to :user, inverse_of: :dbdirect_ip, foreign_key: :user_id

    serialize :ips, JSON
    validate :validate_ips

    private

    MAX_IP_MASK_HOST_BITS = 8

    def validate_ips
      # Check type
      unless ips.nil? || ips.kind_of?(Array) || ips.any? { |ip| !is.kind_of?(String) }
        errors.add(:ips, "IPs must be either be nil or an array of strings ")
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
  end
end
