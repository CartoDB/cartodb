module LayersHelper

  def layer_vizzjson(layer, options)
    layer.kind == 'carto' ? layer_carto_vizzjson(layer, options) : layer.public_values
  end

  def layer_carto_vizzjson(layer, options)
    Hash[Layer::PUBLIC_ATTRIBUTES.map{ |key| 
      if key == "options" && !options[:full]
        [:options, layer.options.select { |k,v| ![''].include?(k) }]
      elsif key == "infowindow"
        [:infowindow, (layer.infowindow.merge(:template => render(:file => layer.template_path)) rescue nil) ]
      else
        [key, layer.send(key)]
      end
    }]
  end

end
