module NamedMapsHelper
  def bypass_named_maps
    Carto::NamedMaps::Api.any_instance.stubs(show: nil, create: true, update: true, destroy: true)
  end
end
