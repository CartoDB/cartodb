require 'ipaddr'

# Utility method to check if a string is a valid IP
module IpChecker
  module_function

  def is_ip?(str)
    str && (IPAddr.new(str) && true) rescue false
  end

  def validate(str,
    max_host_bits: 0,
    min_ipv4prefix: nil,
    min_ipv6prefix: nil,
    exclude_0: true,
    exclude_private: true,
    exclude_local: true,
    exclude_loopback: true
  )
    if max_host_bits
      min_ipv4prefix ||= 32 - max_host_bits
      min_ipv6prefix ||= 128 - max_host_bits
    end
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
