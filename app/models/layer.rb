class Layer < Sequel::Model
  plugin :serialization, :json, :options
  plugin :single_table_inheritance, :kind
  
  ALLOWED_KINDS = %W{ Layer::Carto Layer::Tiled Layer }
  PUBLIC_ATTRIBUTES = %W{ options kind_for_api id }

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
    Hash[PUBLIC_ATTRIBUTES.map{ |a| [a.sub(/_for_api$/, ''), self.send(a)] }]
  end

  def kind_for_api
    case self.kind
      when "Layer::Carto" then "carto"
      when "Layer::Tiled" then "tiled"
      when "Layer"        then ""
    end
  end

  def validate
    super

    if self.class == Layer
      errors.add(:kind, "not accepted") unless ALLOWED_KINDS.include?(kind)
    end
  end
end
