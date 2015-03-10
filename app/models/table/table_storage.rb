# coding: UTF-8

# This class is intended to deal exclusively with storage
class TableStorage < Sequel::Model(:user_tables)

  RESERVED_TABLE_NAMES = %W{ layergroup all }

  # Associations
  many_to_one  :map
  many_to_many :layers, join_table: :layers_user_tables,
                        left_key:   :user_table_id,
                        right_key:  :layer_id,
                        reciprocal: :user_tables
  one_to_one   :automatic_geocoding
  one_to_many  :geocodings

  plugin :association_dependencies, map:                  :destroy,
                                    layers:               :nullify,
                                    automatic_geocoding:  :destroy
  plugin :dirty

  def_dataset_method(:search) do |query|
    conditions = <<-EOS
      to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '')) @@ plainto_tsquery('english', ?) OR name ILIKE ?
      EOS
    where(conditions, query, "%#{query}%")
  end

  def_dataset_method(:multiple_order) do |criteria|
    if criteria.nil? || criteria.empty?
      order(:id)
    else
      order_params = criteria.map do |key, order|
        Sequel.send(order.to_sym, key.to_sym)
      end
      order(*order_params)
    end
  end

  # Ignore mass-asigment on not allowed columns
  self.strict_param_setting = false

  # Allowed columns
  set_allowed_columns(:privacy, :tags, :description)

  # The listener should take care of all hooks
  def set_hooks_listener(listener)
    @listener = listener
  end


  # Hooks definition -----------------------------------------------------------
  def validate
    super

    # userid and table name tuple must be unique
    validates_unique [:name, :user_id], :message => 'is already taken'

    # tables must have a user
    errors.add(:user_id, "can't be blank") if user_id.blank?

    errors.add(
      :name, 'is a reserved keyword, please choose a different one'
    ) if RESERVED_TABLE_NAMES.include?(self.name) 

    @listener.validate
  end

  def before_validation
    super
    @listener.before_validation
  end

  def before_create
    super
    @listener.before_create
  end

  def after_create
    super
    @listener.after_create
  end

  def before_save
    super
    @listener.before_save
  end

  def after_create
    super
    @listener.after_create
  end

  def before_destroy
    super
    @listener.before_destroy
  end

  def after_destroy
    super
    @listener.after_destroy
  end

end
