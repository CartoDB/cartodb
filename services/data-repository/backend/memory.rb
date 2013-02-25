# encoding: utf-8
require 'set'
require 'json'

module DataRepository
  module Backend
    class Memory < Hash
      def store(key, data, options={})
        data = data.to_a if data.is_a?(Set) # OMG FIXME
        super(key, JSON.parse(data.to_json))
      end #store

      def fetch(key, options={})
        super key
      end #fetch

      def exists?(key)
        self.has_key?(key)
      end #exists?
    end # Memory
  end # Backend
end # DataRepository

