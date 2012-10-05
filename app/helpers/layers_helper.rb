module LayersHelper

  def layer_vizzjson(layer, type = 'full')
    if layer.kind = 'carto'
    return layer_carto_vizzjson(layer)
    else
      layer.public_values
    end
  end

  def layer_carto_vizzjson(layer, type = 'full')
    Hash[Layer::PUBLIC_ATTRIBUTES.map{ |key| 
      if key == :options && type != 'full'
        [:options, layer.options.select { |k,v| ![''].include(k) }]
      else
        [key, layer.send(key)]
      end
    }]
  end

end
