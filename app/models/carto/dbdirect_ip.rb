require 'ip_checker'

module Carto
  class DbdirectIp < ActiveRecord::Base
    belongs_to :user, inverse_of: :dbdirect_ip, foreign_key: :user_id

    # Note about the `ips` attribute:
    # The corresponding column is of type json, so there's no need for an explicit serializer
    # But there's a subtle difference here from having a text field and defining `serialize :ips JSON`
    # If a string is assigned to `ips` it is interpreted and parsed and JSON, and the result is nil
    # if not valid JSON. With the serializer version, the string would be preserved as string.

    validate :validate_ips

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
  end
end
