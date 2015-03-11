# coding: UTF-8

# This class is intended to deal exclusively with storage
class TableStorage < Sequel::Model(:user_tables)

  RESERVED_TABLE_NAMES = %W{ layergroup all }

  PRIVACY_PRIVATE = 0
  PRIVACY_PUBLIC = 1
  PRIVACY_LINK = 2

  PRIVACY_VALUES_TO_TEXTS = {
      PRIVACY_PRIVATE => 'private',
      PRIVACY_PUBLIC => 'public',
      PRIVACY_LINK => 'link'
  }

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

  # The facade should take care of all hooks
  def set_facade(table_obj)
    @facade = table_obj
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

    # TODO this kind of check should be moved to the DB
    # privacy setting must be a sane value
    if privacy != PRIVACY_PRIVATE && privacy != PRIVACY_PUBLIC && privacy != PRIVACY_LINK
      errors.add(:privacy, "has an invalid value '#{privacy}'")
    end

    facade.validate
  end

  def before_validation
    facade.before_validation
    super
  end

  def before_create
    super
    update_updated_at # TODO move to a DB trigger
    facade.before_create
  end

  def after_create
    super
    facade.after_create
  end

  def before_save
    super
    facade.before_save
  end

  def after_save
    super
    facade.after_save
  end

  def before_destroy
    super
    facade.before_destroy
  end

  def after_destroy
    super
    facade.after_destroy
  end
  # --------------------------------------------------------------------------------


  # TODO This is called from other models but should probably never be done outside this class
  # it depends on the table relator
  def invalidate_varnish_cache(propagate_to_visualizations=true)
    # probably Table -> TableFacade; TableStorage -> UserTable or UserTableStorage
    facade.invalidate_varnish_cache(propagate_to_visualizations)
  end

  def table_visualization
    facade.table_visualization
  end


  def privacy_text
    PRIVACY_VALUES_TO_TEXTS[self.privacy].upcase
  end

  # enforce standard format for this field
  def privacy=(value)
    case value
      when 'PUBLIC', PRIVACY_PUBLIC, PRIVACY_PUBLIC.to_s
        self[:privacy] = PRIVACY_PUBLIC
      when 'LINK', PRIVACY_LINK, PRIVACY_LINK.to_s
        self[:privacy] = PRIVACY_LINK
      when 'PRIVATE', PRIVACY_PRIVATE, PRIVACY_PRIVATE.to_s
        self[:privacy] = PRIVACY_PRIVATE
      else
        raise "Invalid privacy value '#{value}'"
    end
  end

  def private?
    self.privacy == PRIVACY_PRIVATE
  end #private?

  def public?
    self.privacy == PRIVACY_PUBLIC
  end #public?

  def public_with_link_only?
    self.privacy == PRIVACY_LINK
  end #public_with_link_only?


  # --------------------------------------------------------------------------------
  private

  def update_updated_at
    self.updated_at = Time.now
  end

  # Lazy initialization of facade if not present
  def facade
    @facade ||= ::Table.new(table_storage: self)
  end

end
