class Layer < Sequel::Model
  plugin :serialization, :json, :options
  plugin :single_table_inheritance, :kind
  
  ALLOWED_KINDS = %W{ Layer::Carto Layer::Tiled Layer }
  PUBLIC_ATTRIBUTES = %W{ options kind id }

  many_to_many :maps
  plugin :association_dependencies, :maps => :nullify

  def before_validation
    if self.class == Layer
      case self.kind.to_s.strip.downcase
        when "carto" then self.kind = "Layer::Carto"
        when "tiled" then self.kind = "Layer::Tiled"
        when ""      then self.kind = "Layer"
      end
    end
  end

  def public_values
    Hash[PUBLIC_ATTRIBUTES.map{ |a| [a, self.send(a)] }]
  end

  def validate
    super

    if self.class == Layer
      errors.add(:kind, "not accepted") unless ALLOWED_KINDS.include?(kind)
    end
  end
end
