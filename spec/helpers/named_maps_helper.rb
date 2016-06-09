module NamedMapsHelper
  def bypass_named_maps
    CartoDB::Visualization::Member.any_instance.stubs(:has_named_map?).returns(false)
    Carto::NamedMaps::Api.any_instance.stubs(show: nil, create: true, update: true, destroy: true)
  end
end
