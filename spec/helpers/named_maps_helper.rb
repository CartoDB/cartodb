module NamedMapsHelper
  def bypass_named_maps
    CartoDB::Visualization::Member.any_instance.stubs(save_named_map: true, create_named_map: true)
    Carto::NamedMaps::Api.any_instance.stubs(show: nil, create: true, update: true, destroy: true)
  end
end
