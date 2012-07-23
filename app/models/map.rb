class Map < Sequel::Model
  many_to_many :layers
  plugin :association_dependencies, :layers => :nullify

  # TODO remove this
  # We'll need to join maps and tables for this version
  # but they are meant to be totally independent entities
  # in the future
  attr_accessor :table_id
  def after_save
    Table.filter(user_id: self.user_id, id: table_id).
      update(map_id: self.id)
  end


  def validate
    super

    errors.add(:user_id, "can't be blank") if user_id.blank?
  end
end
