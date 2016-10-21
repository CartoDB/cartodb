require 'active_record'
require_relative '../visualization/stats'
require_relative '../../helpers/embed_redis_cache'
require_dependency 'cartodb/redis_vizjson_cache'
require_dependency 'carto/named_maps/api'
require_dependency 'carto/helpers/auth_token_generator'

class Carto::Visualization < ActiveRecord::Base
  include CacheHelper
  include Carto::AuthTokenGenerator

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

  belongs_to :user_table, class_name: Carto::UserTable, primary_key: :map_id, foreign_key: :map_id, inverse_of: :visualization

  belongs_to :permission

  has_many :likes, foreign_key: :subject
  has_many :shared_entities, foreign_key: :entity_id, inverse_of: :visualization

  # TODO: duplicated with user_table?
  belongs_to :table, class_name: Carto::UserTable, primary_key: :map_id, foreign_key: :map_id, inverse_of: :visualization
  has_one :external_source
  has_many :unordered_children, class_name: Carto::Visualization, foreign_key: :parent_id

  has_many :overlays, order: '"order"'

  belongs_to :parent, class_name: Carto::Visualization, primary_key: :parent_id

  belongs_to :active_layer, class_name: Carto::Layer

  belongs_to :map, class_name: Carto::Map

  has_many :related_templates, class_name: Carto::Template, foreign_key: :source_visualization_id

  has_one :synchronization, class_name: Carto::Synchronization
  has_many :external_sources, class_name: Carto::ExternalSource

  has_many :analyses, class_name: Carto::Analysis
  has_many :mapcaps, class_name: Carto::Mapcap, dependent: :destroy, order: 'created_at DESC'

  belongs_to :state, class_name: Carto::State
  after_save :save_state_if_needed

  validates :version, presence: true

  before_validation :set_default_version

  def set_default_version
    self.version ||= user.try(:new_visualizations_version)
  end

  def self.columns
    super.reject { |c| c.name == 'url_options' }
  end

  def ==(other_visualization)
    id == other_visualization.id
  end

  def size
    # Only canonical visualizations (Datasets) have a related table and then count against disk quota,
    # but we want to not break and even allow ordering by size multiple types
    if table
      table.size
    elsif type == TYPE_REMOTE && !external_source.nil?
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

  def layers_with_data_readable_by(user)
    return [] unless map
    map.layers.select { |l| l.data_readable_by?(user) }
  end

  def related_tables
    @related_tables ||= get_related_tables
  end

  def related_tables_readable_by(user)
    layers_with_data_readable_by(user).map { |l| l.affected_tables_readable_by(user) }.flatten.uniq
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
  def is_liked_by_user_id?(user_id)
    likes_by_user_id(user_id).count > 0
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
    (is_public? || is_link_privacy?) && published?
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

  def derived?
    type == TYPE_DERIVED
  end

  # TODO: Check if for type slide should return true also
  def dependent?
    derived? && single_data_layer?
  end

  # TODO: Check if for type slide should return true also
  def non_dependent?
    derived? && !single_data_layer?
  end

  def single_data_layer?
    data_layers.count == 1 || related_tables.count == 1
  end

  def layers
    map ? map.layers : []
  end

  def data_layers
    map ? map.data_layers : []
  end

  def user_layers
    map ? map.user_layers : []
  end

  def carto_and_torque_layers
    map ? map.carto_and_torque_layers : []
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

  def is_public?
    privacy == PRIVACY_PUBLIC
  end

  def is_link_privacy?
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
    table.nil? ? nil : table.service
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
    likes.count
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

  def get_named_map
    return false if type == TYPE_REMOTE

    named_maps_api.show
  end

  def save_named_map
    return if type == TYPE_REMOTE || mapcapped?

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
    !is_privacy_private? && (version != VERSION_BUILDER || !derived? || mapcapped?)
  end

  def mapcapped?
    mapcaps.exists?
  end

  def latest_mapcap
    mapcaps.first
  end

  def uses_builder_features?
    analyses.any? || widgets.any? || mapcapped?
  end

  def add_source_analyses
    return unless analyses.empty?

    carto_and_torque_layers.each_with_index do |layer, index|
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
    mapcapped? ? latest_mapcap.visualization : self
  end

  def state
    super ? super : build_state
  end

  def mark_as_vizjson2
    $tables_metadata.SADD(V2_VISUALIZATIONS_REDIS_KEY, id)
  end

  def uses_vizjson2?
    $tables_metadata.SISMEMBER(V2_VISUALIZATIONS_REDIS_KEY, id) > 0
  end

  def open_in_editor?
    version != VERSION_BUILDER && (uses_vizjson2? || layers.any?(&:gmapsbase?))
  end

  def can_be_automatically_migrated_to_v3?
    overlays.builder_incompatible.none?
  end

  private

  def build_state
    self.state = Carto::State.new(user: user, visualization: self)
  end

  def save_state_if_needed
    if state.changed?
      state.visualization = self unless state.visualization
      state.user = user unless state.user

      update_attribute(:state_id, state.id) if state.save && !state_id
    end
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

    map.carto_and_torque_layers.flat_map(&:affected_tables).uniq
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
end
