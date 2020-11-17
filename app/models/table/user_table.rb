require 'cartodb/per_request_sequel_cache'
require 'forwardable'

# This class is intended to deal exclusively with storage
class UserTable < Sequel::Model
  extend Forwardable

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
    new_record?
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
    affected_visualizations
    fully_dependent_visualizations
    partially_dependent_visualizations
    dependent_visualizations
    reload
  }

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
  one_to_many  :geocodings, key: :table_id
  many_to_one  :data_import, key: :data_import_id
  many_to_one  :user

  plugin :association_dependencies, map:                  :destroy,
                                    layers:               :nullify
  plugin :dirty

  def_delegators :relator, :affected_visualizations, :synchronization

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

  def sync_table_id
    self.table_id = service.get_table_id
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
    validates_unique [:name, :user_id], message: 'is already taken'

    # tables must have a user
    errors.add(:user_id, "can't be blank") if user_id.blank?

    errors.add(:user, "Viewer users can't create tables") if user && user.viewer

    if Carto::DB::Sanitize::RESERVED_TABLE_NAMES.include?(name)
      errors.add(:name, 'is a reserved keyword, please choose a different one')
    end

    # TODO this kind of check should be moved to the DB
    # privacy setting must be a sane value
    if privacy != PRIVACY_PRIVATE && privacy != PRIVACY_PUBLIC && privacy != PRIVACY_LINK
      errors.add(:privacy, "has an invalid value '#{privacy}'")
    end

    unless user.try(:private_tables_enabled)
      # If it's a new table and the user is trying to make it private
      if new? && privacy == PRIVACY_PRIVATE
        errors.add(:privacy, 'unauthorized to create private tables')
      end

      # if the table exists, is private, but the owner no longer has private privileges
      if !new? && privacy == PRIVACY_PRIVATE && changed_columns.include?(:privacy)
        errors.add(:privacy, 'unauthorized to modify privacy status to private')
      end

      # cannot change any existing table to 'with link'
      if !new? && privacy == PRIVACY_LINK && changed_columns.include?(:privacy)
        errors.add(:privacy, 'unauthorized to modify privacy status to public with link')
      end
    end
  end

  def before_validation
    set_default_table_privacy
    super
  end

  def before_create
    super
    update_updated_at # TODO move to a DB trigger
    service.before_create
  end

  def after_create
    super
    create_default_map_and_layers
    create_default_visualization
    set_default_table_privacy
    save

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

  def destroy
    ar_user_table = Carto::UserTable.find_by(id: id)

    return if ar_user_table.nil?

    ar_user_table.set_service(service)
    ar_user_table.destroy
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

  def external_source_visualization
    if data_import_id
      Carto::ExternalDataImports.where(data_import_id: data_import_id)&.first&.external_source&.visualization
    else
      nil
    end
  end

  def table_visualization
    @table_visualization ||= map_id && CartoDB::Visualization::Collection.new.fetch(
      map_id: map_id,
      type:   CartoDB::Visualization::Member::TYPE_CANONICAL
    ).first
  end

  def privacy_changed?
    previous_changes && previous_changes.keys.include?(:privacy)
  end

  def privacy_was
    previous_changes[:privacy].first
  end

  def fully_dependent_visualizations
    affected_visualizations.select { |v| v.fully_dependent_on?(self) }
  end

  def partially_dependent_visualizations
    affected_visualizations.select { |v| v.partially_dependent_on?(self) }
  end

  def dependent_visualizations
    affected_visualizations.select { |v| v.dependent_on?(self) }
  end

  def is_owner?(user)
    return false unless user
    user_id == user.id
  end

  private

  def default_privacy_value
    user.try(:private_tables_enabled) ? PRIVACY_PRIVATE : PRIVACY_PUBLIC
  end

  def set_default_table_privacy
    self.privacy ||= default_privacy_value
  end

  def create_default_map_and_layers
    base_layer = ::ModelFactories::LayerFactory.get_default_base_layer(user)

    self.map = ::ModelFactories::MapFactory.get_map(base_layer, user.id, id)
    map.add_layer(base_layer)

    geometry_type = service.the_geom_type || 'geometry'
    data_layer = ::ModelFactories::LayerFactory.get_default_data_layer(name, user, geometry_type)

    map.add_layer(data_layer)

    if base_layer.supports_labels_layer?
      labels_layer = ::ModelFactories::LayerFactory.get_default_labels_layer(base_layer)
      map.add_layer(labels_layer)
    end
  end

  def create_default_visualization
    kind = service.is_raster? ? CartoDB::Visualization::Member::KIND_RASTER : CartoDB::Visualization::Member::KIND_GEOM

    esv = external_source_visualization

    member = CartoDB::Visualization::Member.new(
      name:         name,
      map_id:       map.id,
      type:         CartoDB::Visualization::Member::TYPE_CANONICAL,
      description:  description,
      attributions: esv.try(:attributions),
      source:       esv.try(:source),
      tags:         (tags.split(',') if tags),
      privacy:      UserTable::PRIVACY_VALUES_TO_TEXTS[default_privacy_value],
      user_id:      user.id,
      kind:         kind
    )

    member.store
    member.map.set_default_boundaries!
    map.reload

    CartoDB::Visualization::Overlays.new(member).create_default_overlays
  end

  def relator
    @relator ||= CartoDB::TableRelator.new(SequelRails.connection, self)
  end
end
