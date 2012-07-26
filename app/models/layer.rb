class Layer < Sequel::Model
  plugin :serialization, :json, :options
  
  ALLOWED_KINDS = %W{ carto tiled }
  PUBLIC_ATTRIBUTES = %W{ options kind id }

  many_to_many :maps
  plugin :association_dependencies, :maps => :nullify

  def public_values
    Hash[PUBLIC_ATTRIBUTES.map{ |a| [a.sub(/_for_api$/, ''), self.send(a)] }]
  end

  def validate
    super

    if self.class == Layer
      errors.add(:kind, "not accepted") unless ALLOWED_KINDS.include?(kind)
    end
  end
end
