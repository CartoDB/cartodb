class Map < Sequel::Model
  many_to_many :layers, :order => :id
  one_to_many :table

  plugin :association_dependencies, :layers => :nullify

  PUBLIC_ATTRIBUTES = %W{ id user_id provider bounding_box_sw bounding_box_ne center zoom }

  DEFAULT_OPTIONS = {
    zoom:            3,
    #minZoom:         0,
    #maxZoom:         20,
    bounding_box_sw: [0, 0],
    bounding_box_ne: [0, 0],
    provider:        'leaflet',
    center:          [0, 0]
  }

  # TODO remove this
  # We'll need to join maps and tables for this version
  # but they are meant to be totally independent entities
  # in the future
  attr_accessor :table_id
  def after_save
    Table.filter(user_id: self.user_id, id: self.table_id).
      update(map_id: self.id)
  end
  
  def public_values
    Hash[PUBLIC_ATTRIBUTES.map{ |a| [a, self.send(a)] }]
  end

  def validate
    super

    errors.add(:user_id, "can't be blank") if user_id.blank?
  end
end
