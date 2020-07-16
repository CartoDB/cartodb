require 'ipaddr'

# Utility module to check and validate IPs
module IpChecker
  module_function

  # Returns true if a string is a valid IP
  def is_ip?(str)
    str && (IPAddr.new(str) && true) rescue false
  end

  # Validate an IP address or range string.
  #
  # It returns `nil` if the address is valid, or an error message text otherwise.
  #
  # For syntactic valid IPs, the following optional parameters can be used to reject some special cases:
  #
  # * exclude_0: when true will reject 0.0.0.0 or :: addresses
  # * exclude_private: will exclude private addresses (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, fc00::/7)
  # * exclude_local: will exclude link local addresses (169.254.0.0/16, fe80::/10)
  # * exclude_loopback: will exclude loopback (e.g. 127.0.0.1, ::1)
  # * min_ipv4prefix and min_ipv4prefix can be used to limit IP ranges by defining a minimum
  #    number of bits for the prefix
  # * max_host_bits is an alternative way of limiting ranges, by defining the number of bits
  #   that can vary. This can be convenient two define same-size ranges for both IPv4 and IPv6
  #
  def validate(str,
    max_host_bits: nil,
    min_ipv4prefix: nil,
    min_ipv6prefix: nil,
    exclude_0: false,
    exclude_private: false,
    exclude_local: false,
    exclude_loopback: false
  )
    if max_host_bits.present?
      min_ipv4prefix ||= 32 - max_host_bits
      min_ipv6prefix ||= 128 - max_host_bits
    end
    min_ipv4prefix ||= 0
    min_ipv6prefix ||= 0
    ip = IPAddr.new(str)
    if min_ipv4prefix > 0 && ip.ipv4? && ip.prefix < min_ipv4prefix
      return "prefix is too short (#{ip.prefix}); minimum allowed is #{min_ipv4prefix}"
    end
    if min_ipv6prefix > 0 && ip.ipv6? && ip.prefix < min_ipv6prefix
      return "prefix is too short (#{ip.prefix}); minimum allowed is #{min_ipv6prefix}"
    end
    if exclude_0 && ['0.0.0.0', '::'].include?(ip.to_s)
      return "address #{ip.to_s} is not allowed"
    end
    if exclude_private && ip.private?
      return "private addresses are not allowed"
    end
    if exclude_local && ip.link_local?
      return "link local addresses are not allowed"
    end
    if exclude_loopback && ip.loopback?
      return "loopback addresses are not allowed"
    end
    nil
  rescue IPAddr::AddressFamilyError, IPAddr::InvalidAddressError => error
    error.message
  end

  # Normalized IP ranges, so that IP bits outside the mask range are 0
  # (some routers/firewalls may not accept it of not normalied)
  def normalize(str)
    ip = IPAddr.new(str)
    norm_ip = ip.to_s
    norm_ip += "/#{ip.prefix}" if ip.prefix < IPAddr.new(norm_ip).prefix
    norm_ip
  end
end

# Backport some IPAddr methods from Ruby 2.5

unless IPAddr.instance_methods.include?(:prefix)
  class IPAddr
    def prefix
      case @family
      when Socket::AF_INET
        n = IN4MASK ^ @mask_addr
        i = 32
      when Socket::AF_INET6
        n = IN6MASK ^ @mask_addr
        i = 128
      else
        raise IPAddr::AddressFamilyError, "unsupported address family"
      end
      while n.positive?
        n >>= 1
        i -= 1
      end
      i
    end
  end
end

unless IPAddr.instance_methods.include?(:private?)
  class IPAddr
    def private?
      case @family
      when Socket::AF_INET
        @addr & 0xff000000 == 0x0a000000 ||    # 10.0.0.0/8
          @addr & 0xfff00000 == 0xac100000 ||  # 172.16.0.0/12
          @addr & 0xffff0000 == 0xc0a80000     # 192.168.0.0/16
      when Socket::AF_INET6
        @addr & 0xfe00_0000_0000_0000_0000_0000_0000_0000 == 0xfc00_0000_0000_0000_0000_0000_0000_0000
      else
        raise IPAddr::AddressFamilyError, "unsupported address family"
      end
    end
  end
end

unless IPAddr.instance_methods.include?(:link_local?)
  class IPAddr
    def link_local?
      case @family
      when Socket::AF_INET
        @addr & 0xffff0000 == 0xa9fe0000 # 169.254.0.0/16
      when Socket::AF_INET6
        @addr & 0xffc0_0000_0000_0000_0000_0000_0000_0000 == 0xfe80_0000_0000_0000_0000_0000_0000_0000
      else
        raise IPAddr::AddressFamilyError, "unsupported address family"
      end
    end
  end
end

unless IPAddr.instance_methods.include?(:loopback?)
  class IPAddr
    def loopback?
      case @family
      when Socket::AF_INET
        @addr & 0xff000000 == 0x7f000000
      when Socket::AF_INET6
        @addr == 1
      else
        raise AddressFamilyError, "unsupported address family"
      end
    end
  end
end
