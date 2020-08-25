module Carto
  module Dbdirect
    class MetadataManager
      def initialize(config, metadata_server)
        @config = config
        @metadata = metadata_server
      end

      attr_reader :config

      def save(key, ip_set = [])
        @metadata.HSET(config['prefix_namespace'] + key, config['hash_key'], ip_set.join(','))
      end

      def get(key)
        ip_set = @metadata.HGET(config['prefix_namespace'] + key, config['hash_key'])

        ip_set.nil? ? [] : ip_set.split(',')
      end

      def reset(key)
        @metadata.DEL(config['prefix_namespace'] + key)
      end
    end
  end
end
