# coding: UTF-8

require_relative 'privacy'

# This class is intended to deal exclusively with storage
class UserTable < Sequel::Model

  INTERFACE = %w{
    pk
    associations
    id
    id=
    name
    description
    description=
    user_id
    user_id=
    []
    []=
    new?
    save
    save_changes
    map_id
    map_id=
    valid?
    table_id
    table_id=
    map
    tags
    tags=
    data_import_id
    data_import_id=
    user_id
    user_id=
    updated_at
    automatic_geocoding
    privacy
    privacy=
    privacy_changed?
    destroy
    errors
    set_except
    update_updated_at
  }

  RESERVED_TABLE_NAMES = %W{ layergroup all }

  # Associations
  many_to_one  :map
  many_to_many :layers, join_table: :layers_user_tables,
                        left_key:   :user_table_id,
                        right_key:  :layer_id,
                        reciprocal: :user_tables
  one_to_one   :automatic_geocoding, key: :table_id
  one_to_many  :geocodings, key: :table_id

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

  # The service should take care of all hooks
  def set_service(table_obj)
    @service = table_obj
  end

  # Lazy initialization of service if not present
  def service
    @service ||= ::Table.new(user_table: self)
  end

  # Helper methods encapsulating queries. Move to query object?
  # note this one spams multiple tables
  def self.find_all_by_user_id_and_tag(user_id, tag_name)
    fetch("select user_tables.*,
                    array_to_string(array(select tags.name from tags where tags.table_id = user_tables.id),',') as tags_names
                        from user_tables, tags
                        where user_tables.user_id = ?
                          and user_tables.id = tags.table_id
                          and tags.name = ?
                        order by user_tables.id DESC", user_id, tag_name)
  end

  def self.find_by_identifier(user_id, identifier)
    col = 'name'

    table = fetch(%Q{
      SELECT *
      FROM user_tables
      WHERE user_tables.user_id = ?
      AND user_tables.#{col} = ?},
      user_id, identifier
    ).first
    raise RecordNotFound if table.nil?
    table
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
    if !privacy.valid?
      errors.add(:privacy, "has an invalid value '#{privacy}'")
    end

    service.validate
  end

  def before_validation
    service.before_validation
    super
  end

  def before_create
    super
    update_updated_at # TODO move to a DB trigger
    service.before_create
  end

  def after_create
    super
    service.after_create
  end

  def before_save
    super
    service.before_save
  end

  def after_save
    super
    service.after_save
  end

  def before_destroy
    service.before_destroy
    super
  end

  def after_destroy
    super
    service.after_destroy
  end
  # --------------------------------------------------------------------------------


  # TODO This is called from other models but should probably never be done outside this class
  # it depends on the table relator
  def invalidate_varnish_cache(propagate_to_visualizations=true)
    service.invalidate_varnish_cache(propagate_to_visualizations)
  end

  def table_visualization
    service.table_visualization
  end

  def privacy=(value)
    @privacy_value = CartoDB::Table::Privacy.from_anything(value)
    super(@privacy_value.to_i)
  end

  def privacy
    @privacy_value = CartoDB::Table::Privacy.from_anything(super)
  end

  def privacy_changed?
    self.previous_changes.keys.include?(:privacy)
  end

  # TODO move tags to value object. A set is more appropriate
  def tags=(value)
    return unless value
    self[:tags] = value.split(',').map{ |t| t.strip }.compact.delete_if{ |t| t.blank? }.uniq.join(',')
  end

  # Needed by syncs
  def update_updated_at
    self.updated_at = Time.now
  end

end
