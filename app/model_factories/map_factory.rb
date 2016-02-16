# encoding: utf-8

module ModelFactories
  class MapFactory

    def self.get_map(base_layer, user_id, table_id = nil)
      provider = ::Map.provider_for_baselayer_kind(base_layer.kind)
      options = ::Map::DEFAULT_OPTIONS.merge(user_id: user_id, provider: provider)
      options[:table_id] = table_id if table_id

      ::Map.create(options)
    end

  end
end
