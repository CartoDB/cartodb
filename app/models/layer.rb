class Layer < Sequel::Model
  plugin :serialization, :json, :options, :infowindow
  
  ALLOWED_KINDS = %W{ carto tiled }
  PUBLIC_ATTRIBUTES = %W{ options kind infowindow id }

  DEFAULT_BASE_OPTIONS = {
    kind: "tiled",
    options: { 
      visible:     true, 
      type:        "Tiled", 
      urlTemplate: "http://a.tiles.mapbox.com/v3/mapbox.mapbox-streets/{z}/{x}/{y}.png"
    }
  }

  DEFAULT_DATA_OPTIONS = { 
    kind: "carto", 
    options: { 
      type:          "CartoDB", 
      query:         nil, 
      opacity:       0.99, 
      auto_bound:    false, 
      interactivity: "cartodb_id",
      debug:         false, 
      visible:       true, 
      tiler_domain:  "localhost.lan", tiler_port: "8181", tiler_protocol: "http", 
      sql_domain:    "cartodb.com", sql_port: "80", sql_protocol: "http",
      extra_params:  {},
      cdn_url:       nil,
      table_name:    "untitled_table",
      user_name:     "development",
      tile_style_history:[]
    }
  }


  many_to_many :maps
  plugin :association_dependencies, :maps => :nullify

  def public_values
    Hash[PUBLIC_ATTRIBUTES.map{ |a| [a.sub(/_for_api$/, ''), self.send(a)] }]
  end

  def validate
    super

    errors.add(:kind, "not accepted") unless ALLOWED_KINDS.include?(kind)
  end
end
