require 'ipaddr'

# Utility method to check if a string is a valid IP
module IpChecker
  module_function

  def is_ip?(str)
    # The is_integer? check is required because of a bug in IPAddr solved
    # in recent versions of the ruby interpreter. It can be removed in
    # future versions.
    str && !is_integer?(str) && (IPAddr.new(str) && true) rescue false
  end

  private

  module_function

  def is_integer?(str)
    /\A[-+]?\d+\z/ === str
  end
end
