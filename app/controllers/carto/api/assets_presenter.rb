#encoding: UTF-8

module Carto
  module Api
    class AssetsPresenter

      def initialize(asset)
        @asset = asset
      end

      def public_values
        return {} if @asset.nil?
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
