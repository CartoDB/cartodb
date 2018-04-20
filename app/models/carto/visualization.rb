require 'active_record'
require_relative '../visualization/stats'
require_dependency 'carto/named_maps/api'
require_dependency 'carto/helpers/auth_token_generator'
require_dependency 'carto/uuidhelper'
require_dependency 'carto/visualization_invalidation_service'

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
  PRIVACIES = [PRIVACY_LINK, PRIVACY_PROTECTED, PRIVACY_PUBLIC, PRIVACY_PRIVATE].freeze

  VERSION_BUILDER = 3

  V2_VISUALIZATIONS_REDIS_KEY = 'vizjson2_visualizations'.freeze

  scope :remotes, where(type: TYPE_REMOTE)

  # INFO: disable ActiveRecord inheritance column
  self.inheritance_column = :_type

  belongs_to :user, inverse_of: :visualizations, select: Carto::User::DEFAULT_SELECT
  belongs_to :full_user, class_name: Carto::User, foreign_key: :user_id, primary_key: :id, inverse_of: :visualizations, readonly: true

  belongs_to :permission, inverse_of: :visualization, dependent: :destroy

  has_many :likes, foreign_key: :subject
  has_many :shared_entities, foreign_key: :entity_id, inverse_of: :visualization, dependent: :destroy

  has_one :external_source, class_name: Carto::ExternalSource, dependent: :destroy, inverse_of: :visualization
  has_many :unordered_children, class_name: Carto::Visualization, foreign_key: :parent_id

  has_many :overlays, order: '"order"', dependent: :destroy

  belongs_to :active_layer, class_name: Carto::Layer

  belongs_to :map, class_name: Carto::Map, inverse_of: :visualization, dependent: :destroy

  has_many :related_templates, class_name: Carto::Template, foreign_key: :source_visualization_id

  has_one :synchronization, class_name: Carto::Synchronization, dependent: :destroy
  has_many :external_sources, class_name: Carto::ExternalSource

  has_many :analyses, class_name: Carto::Analysis
  has_many :mapcaps, class_name: Carto::Mapcap, dependent: :destroy, order: 'created_at DESC'

  has_one :state, class_name: Carto::State, autosave: true

  has_many :snapshots, class_name: Carto::Snapshot, dependent: :destroy

  validates :name, :privacy, :type, :user_id, :version, presence: true
  validates :privacy, inclusion: { in: PRIVACIES }
  validate :validate_password_presence
  validate :validate_privacy_changes
  validate :validate_user_not_viewer, on: :create

  before_validation :set_default_version, :set_register_table_only
  before_create :set_random_id, :set_default_permission

  before_save :remove_password_if_unprotected
  after_save :propagate_attribution_change
  after_save :propagate_privacy_and_name_to, if: :table

  before_destroy :backup_visualization

  # INFO: workaround for array saves not working. There is a bug in `activerecord-postgresql-array` which
  # makes inserting including array fields to save, but updates work. Wo se insert without tags and add them
  # with an update after creation. This is fixed in Rails 4.
  before_create :delay_saving_tags
  after_create :save_tags

  after_commit :perform_invalidations

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

  def transition_options=(value)
    self.slide_transition_options = ::JSON.dump(value.nil? ? DEFAULT_OPTIONS_VALUE : value)
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

  def add_like_from(user_id)
    likes.create!(actor: user_id)

    self
  rescue ActiveRecord::RecordNotUnique
    raise AlreadyLikedError
  end

  def remove_like_from(user_id)
    item = likes.where(actor: user_id)
    item.first.destroy unless item.first.nil?

    self
  end

  def send_like_email(current_viewer, vis_preview_image)
    if self.type == Carto::Visualization::TYPE_CANONICAL
      ::Resque.enqueue(::Resque::UserJobs::Mail::TableLiked, self.id, current_viewer.id, vis_preview_image)
    elsif self.type == Carto::Visualization::TYPE_DERIVED
      ::Resque.enqueue(::Resque::UserJobs::Mail::MapLiked, self.id, current_viewer.id, vis_preview_image)
    end
  end

  def is_viewable_by_user?(user)
    is_publically_accesible? || has_read_permission?(user)
  end

  def is_accesible_by_user?(user)
    is_viewable_by_user?(user) || password_protected?
  end

  def is_accessible_with_password?(user, password)
    is_viewable_by_user?(user) || password_valid?(password)
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
    password_protected? && has_password? && (password_digest(password, password_salt) == encrypted_password)
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
  alias :can_view_private_info? :has_read_permission?

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
    persisted? ? self : Carto::Visualization.find(id)
  end

  def mark_as_vizjson2
    $tables_metadata.SADD(V2_VISUALIZATIONS_REDIS_KEY, id)
  end

  def uses_vizjson2?
    $tables_metadata.SISMEMBER(V2_VISUALIZATIONS_REDIS_KEY, id) > 0
  end

  def open_in_editor?
    !builder? && uses_vizjson2?
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
    user && user.id == user_id
  end

  def unlink_from(user_table)
    layers_dependent_on(user_table).each do |layer|
      Carto::Analysis.find_by_natural_id(id, layer.source_id).try(:destroy) if layer.source_id

      layer.destroy
    end
  end

  def invalidate_after_commit
    # This marks this visualization as affected by this transaction, so AR will call its `after_commit` hook, which
    # performs the actual invalidations. This takes this operation outside of the DB transaction to avoid long locks
    raise 'invalidate_after_commit should be called within a transaction' if connection.open_transactions.zero?
    add_to_transaction
    true
  end
  # TODO: Privacy manager compatibility, can be removed after removing ::UserTable
  alias :invalidate_cache :invalidate_after_commit

  def has_permission?(user, permission_type)
    return false if user.viewer && permission_type == Carto::Permission::ACCESS_READWRITE
    return is_owner?(user) if permission_id.nil?
    is_owner?(user) || permission.permitted?(user, permission_type)
  end

  def ensure_valid_privacy
    self.privacy = default_privacy if privacy.nil?
    self.privacy = PRIVACY_PUBLIC unless can_be_private?
  end

  def default_privacy
    can_be_private? ? PRIVACY_LINK : PRIVACY_PUBLIC
  end

  def privacy=(privacy)
    super(privacy.try(:downcase))
  end

  def password=(value)
    if value.present?
      self.password_salt = generate_salt if password_salt.nil?
      self.encrypted_password = password_digest(value, password_salt)
    end
  end

  def synced?
    synchronization.present?
  end

  private

  def generate_salt
    secure_digest(Time.now, (1..10).map { rand.to_s })
  end

  def remove_password
    self.password_salt = nil
    self.encrypted_password = nil
  end

  def perform_invalidations
    invalidation_service.invalidate
  rescue => e
    # This is called at an after_commit. If there's any error, we won't notice
    # but the after_commit chain stops.
    # This was discovered during #12844, because "Updates changes even if named maps communication fails" test
    # begun failing because Overlay#invalidate_cache invokes this method directly.
    # We chose to log and continue to keep coherence on calls to this outside the callback.
    CartoDB::Logger.error(message: "Error on visualization invalidation", exception: e, visualization_id: id)
  end

  def propagate_privacy_and_name_to
    raise "Empty table sent to propagate_privacy_and_name_to()" unless table
    propagate_privacy if privacy_changed? && canonical?
    propagate_name if name_was != name # name_changed? returns false positives in changes like a->A->a (sanitization)
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
    if table.name != name
      # Sanitization. For example, spaces -> _
      update_column(:name, table.name)
    end
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

  def password_digest(password, salt)
    digest = AUTH_DIGEST
    10.times do
      digest = secure_digest(digest, salt, password, AUTH_DIGEST)
    end
    digest
  end

  def secure_digest(*args)
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

  def validate_user_not_viewer
    if user.viewer
      errors.add(:user, 'cannot be viewer')
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

  def invalidation_service
    @invalidation_service ||= Carto::VisualizationInvalidationService.new(self)
  end

  class Watcher
    # watcher:_orgid_:_vis_id_:_user_id_
    KEY_FORMAT = "watcher:%s".freeze

    # @params user Carto::User
    # @params visualization Carto::Visualization
    # @throws Carto::Visualization::WatcherError
    def initialize(user, visualization, notification_ttl = nil)
      raise WatcherError.new('User must belong to an organization') if user.organization.nil?
      @user = user
      @visualization = visualization

      default_ttl = Cartodb.config[:watcher].present? ? Cartodb.config[:watcher].try("fetch", 'ttl', 60) : 60
      @notification_ttl = notification_ttl.nil? ? default_ttl : notification_ttl
    end

    # Notifies that is editing the visualization
    # NOTE: Expiration is handled internally by redis
    def notify
      key = KEY_FORMAT % @visualization.id
      $tables_metadata.multi do
        $tables_metadata.hset(key, @user.username, current_timestamp + @notification_ttl)
        $tables_metadata.expire(key, @notification_ttl)
      end
    end

    # Returns a list of usernames currently editing the visualization
    def list
      key = KEY_FORMAT % @visualization.id
      users_expiry = $tables_metadata.hgetall(key)
      now = current_timestamp
      users_expiry.select { |_, expiry| expiry.to_i > now }.keys
    end

    private

    def current_timestamp
      Time.now.getutc.to_i
    end
  end

  class WatcherError < CartoDB::BaseCartoDBError; end
  class AlreadyLikedError < StandardError; end
end
