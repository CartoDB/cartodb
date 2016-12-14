# encoding utf-8

class Carto::Api::AssetPresenter
  def initialize(asset)
    @asset = asset
  end

  def self.collection_to_hash(assets)
    assets.map { |asset| new(asset).to_hash }
  end

  def to_hash
    {
      id: @asset.id,
      public_url: @asset.public_url,
      user_id: @asset.user_id,
      kind: @asset.kind
    }
  end

  # TODO: Remove deprecated method. Use .to_hash instead of .public_values
  def public_values
    to_hash
  end
end
