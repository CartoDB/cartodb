# encoding utf-8

class Carto::Api::AssetPresenter
  def initialize(asset)
    @asset = asset
  end

  def self.collection_to_hash(assets)
    assets.map do |asset|
      new(asset).public_values
    end
  end

  def public_values
    {
      id: @asset.id,
      public_url: @asset.public_url,
      user_id: @asset.user_id,
      kind: @asset.kind
    }
  end
end
