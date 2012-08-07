class Layer < Sequel::Model
  plugin :serialization, :json, :options, :infowindow
  
  ALLOWED_KINDS = %W{ carto tiled }
  PUBLIC_ATTRIBUTES = %W{ options kind infowindow id }

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
