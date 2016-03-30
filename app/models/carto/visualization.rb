require 'active_record'
require_relative '../visualization/stats'

class Carto::Visualization < ActiveRecord::Base
  include CacheHelper

  AUTH_DIGEST = '1211b3e77138f6e1724721f1ab740c9c70e66ba6fec5e989bb6640c4541ed15d06dbd5fdcbd3052b'

  TYPE_CANONICAL = 'table'
  TYPE_DERIVED = 'derived'
  TYPE_SLIDE = 'slide'
  TYPE_REMOTE = 'remote'

  KIND_GEOM   = 'geom'
  KIND_RASTER = 'raster'

  PRIVACY_PUBLIC = 'public'
  PRIVACY_PRIVATE = 'private'
  PRIVACY_LINK = 'link'
  PRIVACY_PROTECTED = 'password'

  # INFO: disable ActiveRecord inheritance column
  self.inheritance_column = :_type

  belongs_to :user, inverse_of: :visualizations, select: Carto::User::DEFAULT_SELECT
  belongs_to :full_user, class_name: Carto::User, foreign_key: :user_id, primary_key: :id, inverse_of: :visualizations, readonly: true

  belongs_to :user_table, class_name: Carto::UserTable, primary_key: :map_id, foreign_key: :map_id, inverse_of: :visualization

  has_one :permission, inverse_of: :entity, conditions: { entity_type: 'vis' }, foreign_key: :entity_id

  has_many :likes, foreign_key: :subject
  has_many :shared_entities, foreign_key: :entity_id, inverse_of: :visualization

  # TODO: duplicated with user_table?
  belongs_to :table, class_name: Carto::UserTable, primary_key: :map_id, foreign_key: :map_id, inverse_of: :visualization
  has_one :external_source
  has_many :unordered_children, class_name: Carto::Visualization, foreign_key: :parent_id

  has_many :overlays

  belongs_to :parent, class_name: Carto::Visualization, primary_key: :parent_id

  belongs_to :map

  has_many :related_templates, class_name: Carto::Template, foreign_key: :source_visualization_id

  has_one :synchronization, class_name: Carto::Synchronization
  has_many :external_sources, class_name: Carto::ExternalSource

  has_many :analyses, class_name: Carto::Analysis

  def ==(other_visualization)
    self.id == other_visualization.id
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

  def related_tables
    @related_tables ||= get_related_tables
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
    is_public? || is_link_privacy?
  end

  def is_writable_by_user(user)
    user_id == user.id || has_write_permission?(user)
  end

  def varnish_key
    "#{user.database_name}:#{sorted_related_table_names},#{id}"
  end

  def surrogate_key
    get_surrogate_key(CartoDB::SURROGATE_NAMESPACE_VISUALIZATION, id)
  end

  def qualified_name(viewer_user = nil)
    if viewer_user.nil? || is_owner_user?(viewer_user)
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

  def data_layers
    map.nil? ? [] : map.data_layers
  end

  def named_map_layers
    map.nil? ? [] : map.named_map_layers
  end

  def user_layers
    map.nil? ? [] : map.user_layers
  end

  def other_layers
    map.nil? ? [] : map.other_layers
  end

  def layers
    map.nil? ? [] : map.layers
  end

  def password_valid?(password)
    has_password? && ( password_digest(password, password_salt) == encrypted_password )
  end

  def organization?
    privacy == PRIVACY_PRIVATE and permission.acl.size > 0
  end

  def password_protected?
    privacy == PRIVACY_PROTECTED
  end

  def private?
    # This organization? check is kept for backwards compatibility
    is_privacy_private? and not organization?
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

  # INFO: discouraged, since it forces using internal constants
  # Use explicit methods instead.
  # Needed for backwards compatibility
  def has_permission?(user, permission_type)
    return is_owner_user?(user) if permission_id.nil?
    is_owner_user?(user) || permission.is_permitted?(user, permission_type)
  end

  def get_auth_tokens
    named_map = get_named_map
    raise CartoDB::InvalidMember unless named_map

    tokens = named_map.template[:template][:auth][:valid_tokens]
    raise CartoDB::InvalidMember if tokens.size == 0
    tokens
  end

  def needed_auth_tokens
    has_password? ? get_auth_tokens : []
  end

  def mapviews
    @mapviews ||= CartoDB::Visualization::Stats.mapviews(stats)
  end

  def total_mapviews(user=nil)
    @total_mapviews ||= CartoDB::Visualization::Stats.new(self, user).total_mapviews
  end

  def geometry_types
    @geometry_types ||= user_table.geometry_types if user_table
  end

  def table_service
    table.nil? ? nil : table.service
  end

  def has_read_permission?(user)
    user && (is_owner_user?(user) || (permission && permission.user_has_read_permission?(user)))
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

  def attributions_from_derived_visualizations
    related_canonical_visualizations.map(&:attributions).reject { |attribution| attribution.blank? }
  end

  private

  def get_named_map
    return nil if type == TYPE_REMOTE
    data = named_maps.get(CartoDB::NamedMapsWrapper::NamedMap.template_name(id))
    data.nil? ? false : data
  end

  def named_maps(force_init = false)
    # TODO: read refactor skips all write complexity, check visualization/member for more details
    if @named_maps.nil? || force_init
      name_param = user.username
      api_key_param = user.api_key
      @named_maps = CartoDB::NamedMapsWrapper::NamedMaps.new(
        {
          name:     name_param,
          api_key:  api_key_param
        },
        {
          domain:     Cartodb.config[:tiler]['internal']['domain'],
          port:       Cartodb.config[:tiler]['internal']['port'] || 443,
          protocol:   Cartodb.config[:tiler]['internal']['protocol'],
          verifycert: (Cartodb.config[:tiler]['internal']['verifycert'] rescue true),
          host:       (Cartodb.config[:tiler]['internal']['host'] rescue nil)
        },
        configuration
      )
    end
    @named_maps
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
    sorted_table_names = related_tables.map{ |table|
      "#{user.database_schema}.#{table.name}"
    }.sort { |i, j|
      i <=> j
    }.join(',')
  end

  def get_related_tables
    return [] unless map
    map.carto_and_torque_layers.flat_map { |layer| layer.affected_tables}.uniq
  end

  def get_related_canonical_visualizations
    get_related_visualizations_by_types([TYPE_CANONICAL])
  end

  def get_related_visualizations_by_types(types)
    Carto::Visualization.where(map_id: related_tables.collect(&:map_id), type: types).all
  end

  def has_write_permission?(user)
    user && (is_owner_user?(user) || (permission && permission.user_has_write_permission?(user)))
  end

  def is_owner_user?(user)
    self.user_id == user.id
  end

  def configuration
    return {} unless defined?(Cartodb)
    Cartodb.config
  end

end
