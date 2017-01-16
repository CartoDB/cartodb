# encoding utf-8

class Carto::Api::AssetPresenter
  def initialize(asset)
    @asset = asset
  end

  def to_hash
    {
      id: @asset.id,
      public_url: @asset.absolute_public_url,
      user_id: @asset.user_id,
      kind: @asset.kind
    }
  end
end
