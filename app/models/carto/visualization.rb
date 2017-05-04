require 'active_record'
require_relative '../visualization/stats'
require_relative '../../helpers/embed_redis_cache'
require_dependency 'cartodb/redis_vizjson_cache'
require_dependency 'carto/named_maps/api'
require_dependency 'carto/helpers/auth_token_generator'
require_dependency 'carto/uuidhelper'

module Carto::VisualizationDependencies
  def fully_dependent_on?(user_table)
    derived? && layers_dependent_on(user_table).count == data_layers.count
  end

  def partially_dependent_on?(user_table)
    derived? && layers_dependent_on(user_table).count.between?(1, data_layers.count - 1)
  end

  def dependent_on?(user_table)
    derived? && layers_dependent_on(user_table).any?
  end

  private

  def layers_dependent_on(user_table)
    data_layers.select { |l| l.depends_on?(user_table) }
  end
end

class Carto::Visualization < ActiveRecord::Base
  include CacheHelper
  include Carto::UUIDHelper
  include Carto::AuthTokenGenerator
  include Carto::VisualizationDependencies

  AUTH_DIGEST = '1211b3e77138f6e1724721f1ab740c9c70e66ba6fec5e989bb6640c4541ed15d06dbd5fdcbd3052b'.freeze

  TYPE_CANONICAL = 'table'.freeze
  TYPE_DERIVED = 'derived'.freeze
  TYPE_SLIDE = 'slide'.freeze
  TYPE_REMOTE = 'remote'.freeze

  KIND_GEOM   = 'geom'.freeze
  KIND_RASTER = 'raster'.freeze

  PRIVACY_PUBLIC = 'public'.freeze
  PRIVACY_PRIVATE = 'private'.freeze
  PRIVACY_LINK = 'link'.freeze
  PRIVACY_PROTECTED = 'password'.freeze

  VERSION_BUILDER = 3

  V2_VISUALIZATIONS_REDIS_KEY = 'vizjson2_visualizations'.freeze

  # INFO: disable ActiveRecord inheritance column
  self.inheritance_column = :_type

  belongs_to :user, inverse_of: :visualizations, select: Carto::User::DEFAULT_SELECT
  belongs_to :full_user, class_name: Carto::User, foreign_key: :user_id, primary_key: :id, inverse_of: :visualizations, readonly: true

  belongs_to :permission, inverse_of: :visualization, dependent: :destroy

  has_many :likes, foreign_key: :subject
  has_many :shared_entities, foreign_key: :entity_id, inverse_of: :visualization, dependent: :destroy

  has_one :external_source
  has_many :unordered_children, class_name: Carto::Visualization, foreign_key: :parent_id

  has_many :overlays, order: '"order"', dependent: :destroy

  belongs_to :parent, class_name: Carto::Visualization, primary_key: :parent_id

  belongs_to :active_layer, class_name: Carto::Layer

  belongs_to :map, class_name: Carto::Map, inverse_of: :visualization, dependent: :destroy

  has_many :related_templates, class_name: Carto::Template, foreign_key: :source_visualization_id

  has_one :synchronization, class_name: Carto::Synchronization, dependent: :destroy
  has_many :external_sources, class_name: Carto::ExternalSource

  has_many :analyses, class_name: Carto::Analysis
  has_many :mapcaps, class_name: Carto::Mapcap, dependent: :destroy, order: 'created_at DESC'

  has_one :state, class_name: Carto::State, autosave: true

  has_many :snapshots, class_name: Carto::Snapshot, dependent: :destroy

  validates :version, presence: true
  validate :validate_password_presence
  validate :validate_privacy_changes

  before_validation :set_default_version, :set_register_table_only
  before_create :set_random_id, :set_default_permission

  before_save :remove_password_if_unprotected, :invalidate
  after_save :save_named_map_or_rollback_privacy, :propagate_attribution_change
  after_save :propagate_privacy_and_name_to, if: :table

  before_destroy :backup_visualization
  after_destroy :invalidate_cache
  after_destroy :destroy_named_map

  # INFO: workaround for array saves not working. There is a bug in `activerecord-postgresql-array` which
  # makes inserting including array fields to save, but updates work. Wo se insert without tags and add them
  # with an update after creation. This is fixed in Rails 4.
  before_create :delay_saving_tags
  after_create :save_tags

  attr_accessor :register_table_only

  def set_register_table_only
    self.register_table_only = false
    # This is a callback, returning `true` avoids halting because of assignment `false` return value
    true
  end

  def set_default_version
    self.version ||= user.try(:new_visualizations_version)
  end

  DELETED_COLUMNS = ['state_id', 'url_options'].freeze

  def self.columns
    super.reject { |c| DELETED_COLUMNS.include?(c.name) }
  end

  def size
    # Only canonical visualizations (Datasets) have a related table and then count against disk quota,
    # but we want to not break and even allow ordering by size multiple types
    if user_table
      user_table.size
    elsif remote? && external_source
      external_source.size
    else
      0
    end
  end

  def tags
    tags = super
    tags == nil ? [] : tags
  end

  def tags=(tags)
    tags.reject!(&:blank?) if tags
    super(tags)
  end

  def user_table
    map.user_table if map
  end

  def table
    @table ||= user_table.try(:service)
  end

  def layers_with_data_readable_by(user)
    return [] unless map
    map.layers.select { |l| l.data_readable_by?(user) }
  end

  def related_tables
    @related_tables ||= get_related_tables
  end

  def related_tables_readable_by(user)
    layers_with_data_readable_by(user).map { |l| l.user_tables_readable_by(user) }.flatten.uniq
  end

  def related_canonical_visualizations
    @related_canonical_visualizations ||= get_related_canonical_visualizations
  end

  def stats
    @stats ||= CartoDB::Visualization::Stats.new(self).to_poro
  end

  def transition_options
    @transition_options ||= (slide_transition_options.nil? ? {} : JSON.parse(slide_transition_options).symbolize_keys)
  end

  def children
    ordered = []
    children_vis = self.unordered_children
    if children_vis.count > 0
      ordered << children_vis.select { |vis| vis.prev_id.nil? }.first
      while !ordered.last.next_id.nil?
        target = ordered.last.next_id
        unless target.nil?
          ordered << children_vis.select { |vis| vis.id == target }.first
        end
      end
    end
    ordered
  end

  # TODO: refactor next methods, all have similar naming but some receive user and some others user_id
  def liked_by?(user_id)
    likes_by_user_id(user_id).any?
  end

  def likes_by_user_id(user_id)
    likes.where(actor: user_id)
  end

  def is_viewable_by_user?(user)
    is_publically_accesible? || has_read_permission?(user)
  end

  def is_accesible_by_user?(user)
    is_viewable_by_user?(user) || password_protected?
  end

  def is_publically_accesible?
    (public? || public_with_link?) && published?
  end

  def writable_by?(user)
    (user_id == user.id && !user.viewer?) || has_write_permission?(user)
  end

  def varnish_key
    "#{user.database_name}:#{sorted_related_table_names},#{id}"
  end

  def surrogate_key
    get_surrogate_key(CartoDB::SURROGATE_NAMESPACE_VISUALIZATION, id)
  end

  def qualified_name(viewer_user = nil)
    if viewer_user.nil? || owner?(viewer_user)
      name
    else
      "#{user.sql_safe_database_schema}.#{name}"
    end
  end

  # Despite storing always a named map, no need to retrieve it for "public" visualizations
  def retrieve_named_map?
    password_protected? || has_private_tables?
  end

  def has_password?
    !password_salt.nil? && !encrypted_password.nil?
  end

  def type_slide?
    type == TYPE_SLIDE
  end

  def kind_raster?
    kind == KIND_RASTER
  end

  def canonical?
    type == TYPE_CANONICAL
  end

  # TODO: remove. Kept for backwards compatibility with ::Permission model
  def table?
    type == TYPE_CANONICAL
  end

  def derived?
    type == TYPE_DERIVED
  end

  def remote?
    type == TYPE_REMOTE
  end

  def layers
    map ? map.layers : []
  end

  def data_layers
    map ? map.data_layers : []
  end

  def carto_layers
    map ? map.carto_layers : []
  end

  def user_layers
    map ? map.user_layers : []
  end

  def torque_layers
    map ? map.torque_layers : []
  end

  def other_layers
    map ? map.other_layers : []
  end

  def base_layers
    map ? map.base_layers : []
  end

  def named_map_layers
    map ? map.named_map_layers : []
  end

  def password_valid?(password)
    has_password? && ( password_digest(password, password_salt) == encrypted_password )
  end

  def organization?
    privacy == PRIVACY_PRIVATE && !permission.acl.empty?
  end

  def password_protected?
    privacy == PRIVACY_PROTECTED
  end

  def private?
    is_privacy_private? && !organization?
  end

  def is_privacy_private?
    privacy == PRIVACY_PRIVATE
  end

  def public?
    privacy == PRIVACY_PUBLIC
  end

  def public_with_link?
    self.privacy == PRIVACY_LINK
  end

  def editable?
    !(kind_raster? || type_slide?)
  end

  def get_auth_tokens
    [get_auth_token]
  end

  def mapviews
    @mapviews ||= CartoDB::Visualization::Stats.mapviews(stats)
  end

  def total_mapviews
    @total_mapviews ||= CartoDB::Visualization::Stats.new(self, nil).total_mapviews
  end

  def geometry_types
    @geometry_types ||= user_table.geometry_types if user_table
  end

  def table_service
    user_table.try(:service)
  end

  def has_read_permission?(user)
    user && (owner?(user) || (permission && permission.user_has_read_permission?(user)))
  end

  def estimated_row_count
    table_service.nil? ? nil : table_service.estimated_row_count
  end

  def actual_row_count
    table_service.nil? ? nil : table_service.actual_row_count
  end

  def license_info
    if !license.nil?
      Carto::License.find(license.to_sym)
    end
  end

  def can_be_cached?
    !is_privacy_private?
  end

  def likes_count
    likes.size
  end

  def widgets
    # Preload widgets for all layers
    ActiveRecord::Associations::Preloader.new(layers, :widgets).run
    layers.map(&:widgets).flatten
  end

  def analysis_widgets
    widgets.select { |w| w.source_id.present? }
  end

  def attributions_from_derived_visualizations
    related_canonical_visualizations.map(&:attributions).reject(&:blank?)
  end

  def delete_from_table
    destroy if persisted?
  end

  def get_named_map
    return false if remote?

    named_maps_api.show
  end

  def save_named_map
    return true if remote? || mapcapped? || data_layers.empty?

    get_named_map ? named_maps_api.update : named_maps_api.create
  end

  def invalidate_cache
    redis_vizjson_cache.invalidate(id)
    embed_redis_cache.invalidate(id)
    CartoDB::Varnish.new.purge(varnish_vizjson_key)
  end

  def allowed_auth_tokens
    entities = [user] + permission.entities_with_read_permission
    entities.map(&:get_auth_token)
  end

  # - v2 (Editor): not private
  # - v3 (Builder): not derived or not private, mapcapped
  # This Ruby code should match the SQL code at Carto::VisualizationQueryBuilder#build section for @only_published.
  def published?
    !is_privacy_private? && (!builder? || !derived? || mapcapped?)
  end

  def builder?
    version == VERSION_BUILDER
  end

  MAX_MAPCAPS_PER_VISUALIZATION = 1

  def create_mapcap!
    unless mapcaps.count < MAX_MAPCAPS_PER_VISUALIZATION
      mapcaps.last.destroy
    end

    auto_generate_indices_for_all_layers
    mapcaps.create!
  end

  def mapcapped?
    latest_mapcap.present?
  end

  def latest_mapcap
    mapcaps.first
  end

  def uses_builder_features?
    builder? || analyses.any? || widgets.any? || mapcapped?
  end

  def add_source_analyses
    return unless analyses.empty?

    data_layers.each_with_index do |layer, index|
      analysis = Carto::Analysis.source_analysis_for_layer(layer, index)

      if analysis.save
        layer.options[:source] = analysis.natural_id
        layer.options[:letter] = analysis.natural_id.first
        layer.save
      else
        CartoDB::Logger.warning(message: 'Couldn\'t add source analysis for layer', user: user, layer: layer)
      end
    end

    # This is needed because Carto::Layer does not yet triggers invalidations on save
    # It can be safely removed once it does
    map.notify_map_change
  end

  def ids_json
    layers_for_hash = layers.map do |layer|
      { layer_id: layer.id, widgets: layer.widgets.map(&:id) }
    end

    {
      visualization_id: id,
      map_id: map.id,
      layers: layers_for_hash
    }
  end

  def populate_ids(ids_json)
    self.id = ids_json[:visualization_id]
    map.id = ids_json[:map_id]

    map.layers.each_with_index do |layer, index|
      stored_layer_ids = ids_json[:layers][index]
      stored_layer_id = stored_layer_ids[:layer_id]

      layer.id = stored_layer_id
      layer.maps = [map]

      layer.widgets.each_with_index do |widget, widget_index|
        widget.id = stored_layer_ids[:widgets][widget_index]
        widget.layer_id = stored_layer_id
      end
    end
  end

  def for_presentation
    mapcapped? ? latest_mapcap.regenerate_visualization : self
  end

  # TODO: we should make visualization privacy/security methods aware of mapcaps and make those
  # deal with all the different the cases internally.
  # See https://github.com/CartoDB/cartodb/pull/9678
  def non_mapcapped
    mapcapped? ? latest_mapcap.visualization : self
  end

  def mark_as_vizjson2
    $tables_metadata.SADD(V2_VISUALIZATIONS_REDIS_KEY, id)
  end

  def uses_vizjson2?
    $tables_metadata.SISMEMBER(V2_VISUALIZATIONS_REDIS_KEY, id) > 0
  end

  def open_in_editor?
    !builder? && (uses_vizjson2? || layers.any?(&:gmapsbase?))
  end

  def can_be_automatically_migrated_to_v3?
    overlays.builder_incompatible.none?
  end

  def state
    super ? super : build_state
  end

  def can_be_private?
    derived? ? user.try(:private_maps_enabled) : user.try(:private_tables_enabled)
  end

  # TODO: Backward compatibility with Sequel
  def store_using_table(_table_privacy_changed = false)
    store
  end

  def store
    save!
    self
  end

  def is_owner?(user)
    user.id == user_id
  end

  def unlink_from(user_table)
    layers_dependent_on(user_table).each do |layer|
      Carto::Analysis.find_by_natural_id(id, layer.source_id).try(:destroy) if layer.source_id

      layer.destroy
    end
  end

  def has_permission?(user, permission_type)
    return false if user.viewer && permission_type == PERMISSION_READWRITE
    return is_owner?(user) if permission_id.nil?
    is_owner?(user) || permission.permitted?(user, permission_type)
  end

  private

  def remove_password
    self.password_salt = nil
    self.encrypted_password = nil
  end

  def invalidate
    # previously we used 'invalidate_cache' but due to public_map displaying all the user public visualizations,
    # now we need to purgue everything to avoid cached stale data or public->priv still showing scenarios
    if privacy_changed? || name_changed? || cached_data_changed?
      invalidate_cache
    end

    # When a table's relevant data is changed, propagate to all who use it or relate to it
    if cached_data_changed? && table
      user_table.dependent_visualizations.each(&:invalidate_cache)
    end
  end

  # Attributes that cause an invalidation to be triggered (they are presented in public pages)
  def cached_data_changed?
    description_changed? || attributions_changed? || version_changed? || encrypted_password_changed?
  end

  def propagate_privacy_and_name_to
    raise "Empty table sent to Visualization::Member propagate_privacy_and_name_to()" unless table
    propagate_privacy if privacy_changed? && canonical?
    propagate_name if name_changed?
  end

  def propagate_privacy
    table.reload
    if privacy && table.privacy_text.casecmp(privacy) != 0 # privacy is different, case insensitive
      CartoDB::TablePrivacyManager.new(table).set_from_visualization(self).update_cdb_tablemetadata
    end
  end

  def propagate_name
    # TODO: Move this to ::Table?
    return if table.changing_name?
    table.register_table_only = register_table_only
    table.name = name
    table.update(name: name)
    if name_changed?
      support_tables.rename(name_was, name, true, name_was)
    end
    self
  rescue => exception
    if name_changed? && !(exception.to_s =~ /relation.*does not exist/)
      revert_name_change(name_was)
    end
    raise CartoDB::InvalidMember.new(exception.to_s)
  end

  def revert_name_change(previous_name)
    self.name = previous_name
    store
  rescue => exception
    raise CartoDB::InvalidMember.new(exception.to_s)
  end

  def propagate_attribution_change
    table.propagate_attribution_change(attributions) if table && attributions_changed?
  end

  def support_tables
    @support_tables ||= CartoDB::Visualization::SupportTables.new(
      user.in_database, parent_id: id, parent_kind: kind, public_user_roles: user.db_service.public_user_roles
    )
  end

  def auto_generate_indices_for_all_layers
    user_tables = data_layers.map(&:user_tables).flatten.uniq
    user_tables.each do |ut|
      ::Resque.enqueue(::Resque::UserDBJobs::UserDBMaintenance::AutoIndexTable, ut.id)
    end
  end

  def set_random_id
    # This should be done with a DB default
    self.id ||= random_uuid
  end

  def set_default_permission
    self.permission ||= Carto::Permission.create(owner: user, owner_username: user.username)
  end

  def delay_saving_tags
    @cached_tags = tags
    self.tags = nil
  end

  def save_tags
    update_attribute(:tags, @cached_tags)
  end

  def named_maps_api
    Carto::NamedMaps::Api.new(self)
  end

  def redis_vizjson_cache
    @redis_vizjson_cache ||= CartoDB::Visualization::RedisVizjsonCache.new
  end

  def embed_redis_cache
    @embed_redis_cache ||= EmbedRedisCache.new($tables_metadata)
  end

  def password_digest(password, salt)
    digest = AUTH_DIGEST
    10.times do
      digest = secure_digest(digest, salt, password, AUTH_DIGEST)
    end
    digest
  end

  def secure_digest(*args)
    #noinspection RubyArgCount
    Digest::SHA256.hexdigest(args.flatten.join)
  end

  def has_private_tables?
    !related_tables.index { |table| table.private? }.nil?
  end

  def sorted_related_table_names
    mapped_table_names = related_tables.map { |table| "#{user.database_schema}.#{table.name}" }

    mapped_table_names.sort { |i, j| i <=> j }.join(',')
  end

  def get_related_tables
    return [] unless map

    map.data_layers.flat_map(&:user_tables).uniq
  end

  def get_related_canonical_visualizations
    get_related_visualizations_by_types([TYPE_CANONICAL])
  end

  def get_related_visualizations_by_types(types)
    Carto::Visualization.where(map_id: related_tables.map(&:map_id), type: types).all
  end

  def has_write_permission?(user)
    user && !user.viewer? && (owner?(user) || (permission && permission.user_has_write_permission?(user)))
  end

  def owner?(user)
    user_id == user.id
  end

  def varnish_vizjson_key
    ".*#{id}:vizjson"
  end

  def validate_password_presence
    errors.add(:password, 'required for protected visualization') if password_protected? && !has_password?
  end

  def remove_password_if_unprotected
    remove_password unless password_protected?
  end

  def validate_privacy_changes
    if derived? && is_privacy_private? && privacy_changed? && !user.try(:private_maps_enabled?)
      errors.add(:privacy, 'cannot be set to private')
    end
  end

  def save_named_map_or_rollback_privacy
    if !save_named_map && privacy_changed?
      # Explicitly set privacy to its previous value so the hooks run and the user db permissions are updated
      # TODO: It would be better to raise an exception to rollback the transaction, but that can break renames
      # as we don't explicitly rollback those in the user database. Consider an `after_rollback` hook in user table?
      self.privacy = privacy_was
      save
    end
  end

  def backup_visualization
    return true if remote?

    if user.has_feature_flag?(Carto::VisualizationsExportService::FEATURE_FLAG_NAME) && map
      Carto::VisualizationsExportService.new.export(id)
    end
  rescue => exception
    # Don't break deletion flow
    CartoDB::Logger.error(
      message: 'Error backing up visualization',
      exception: exception,
      visualization_id: id
    )
  end

  def destroy_named_map
    named_maps_api.destroy
  end
end
