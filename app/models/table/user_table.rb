# coding: UTF-8
require 'cartodb/per_request_sequel_cache'

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
    set_tag_array
    data_import_id
    data_import_id=
    user_id
    user_id=
    updated_at
    automatic_geocoding
    private?
    public?
    public_with_link_only?
    privacy
    privacy=
    privacy_changed?
    privacy_text
    destroy
    errors
    set_except
    update_updated_at
    values
  }

  RESERVED_TABLE_NAMES = %w{ layergroup all public }.freeze

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
  one_to_one   :automatic_geocoding, key: :table_id
  one_to_many  :geocodings, key: :table_id
  many_to_one  :data_import, key: :data_import_id

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

  def self.from_map_id_key(map_id)
    "UserTable:from_map_id:#{map_id}"
  end

  def self.from_map_id(map_id)
    key = self.from_map_id_key(map_id)
    user_table = PerRequestSequelCache.get(key)
    if user_table.nil?
      user_table = self[map_id: map_id]
      PerRequestSequelCache.set(key, user_table, nil) unless user_table.nil?
    end
    user_table
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
    ) if RESERVED_TABLE_NAMES.include?(name)

    # TODO this kind of check should be moved to the DB
    # privacy setting must be a sane value
    if privacy != PRIVACY_PRIVATE && privacy != PRIVACY_PUBLIC && privacy != PRIVACY_LINK
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

  def before_update
    PerRequestSequelCache.delete(self.class.from_map_id_key(self.map_id))
    super
  end

  def delete
    PerRequestSequelCache.delete(self.class.from_map_id_key(self.map_id))
    super
  end

  # --------------------------------------------------------------------------------

  def update_cdb_tablemetadata
    service.update_cdb_tablemetadata
  end

  def table_visualization
    service.table_visualization
  end


  def privacy_text
    PRIVACY_VALUES_TO_TEXTS[self.privacy].upcase
  end

  # TODO move privacy to value object
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

  def privacy_changed?
    @user_table.previous_changes.keys.include?(:privacy)
  end

  # TODO move tags to value object. A set is more appropriate
  def tags=(value)
    return unless value
    set_tag_array(value.split(','))
  end

  def set_tag_array(tag_array)
    return unless tag_array
    self[:tags] = tag_array.map{ |t| t.strip }.compact.delete_if{ |t| t.blank? }.uniq.join(',')
  end

  # Needed by syncs
  def update_updated_at
    self.updated_at = Time.now
  end

  def estimated_row_count
    service.estimated_row_count
  end

  def actual_row_count
    service.actual_row_count
  end

  private

end
