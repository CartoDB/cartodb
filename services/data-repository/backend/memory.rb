require 'set'
require 'json'

module DataRepository
  module Backend
    class Memory < Hash
      def store(key, data, options={})
        data = data.to_a if data.is_a?(Set) # OMG FIXME
        super(key, JSON.parse(data.to_json))
      end

      def fetch(key, options={})
        super key
      end

      def exists?(key)
        self.has_key?(key)
      end

      # Not supported, so just call data
      def transaction(&block)
        block.call
      end
    end
  end
end

