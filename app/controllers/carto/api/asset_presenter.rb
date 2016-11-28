# encoding utf-8

module Carto
  module Api
    class AssetPresenter
      def initialize(asset)
        @asset = asset
      end

      def self.collection_to_hash(assets)
        assets.map do |asset|
          AssetPresenter.new(asset).public_values
        end
      end

      def to_hash
        {
          id: @asset.id,
          public_url: @asset.public_url,
          user_id: @asset.user_id,
          kind: @asset.kind
        }
      end
    end
  end
end
