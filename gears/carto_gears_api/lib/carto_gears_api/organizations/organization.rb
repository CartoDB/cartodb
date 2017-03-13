require 'values'
require 'uuidtools'

module CartoGearsApi
  module Organizations
    # Organization information.
    #
    # @attr_reader [String] name Organization name.
    class Organization < Value.new(:name)
    end
  end
end
