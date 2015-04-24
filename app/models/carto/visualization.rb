require 'active_record'
require_relative '../visualization/stats'

class Carto::Visualization < ActiveRecord::Base
  include CacheHelper

  # INFO: disable ActiveRecord inheritance column
  self.inheritance_column = :_type

  belongs_to :user, inverse_of: :visualizations, select: Carto::User::DEFAULT_SELECT
  belongs_to :full_user, class_name: Carto::User, foreign_key: :user_id, primary_key: :id, inverse_of: :visualizations, readonly: true

  belongs_to :permission

  has_many :likes, foreign_key: :subject
  has_many :shared_entities, foreign_key: :entity_id, inverse_of: :visualization

  belongs_to :table, class_name: UserTable, primary_key: :map_id, foreign_key: :map_id
  has_one :external_source
  has_many :unordered_children, class_name: Carto::Visualization, foreign_key: :parent_id

  has_many :overlays

  belongs_to :parent, class_name: Carto::Visualization, primary_key: :parent_id

  belongs_to :map

  TYPE_CANONICAL = 'table'
  TYPE_DERIVED = 'derived'
  TYPE_SLIDE = 'slide'
  TYPE_REMOTE = 'remote'

  PRIVACY_PUBLIC = 'public'
  PRIVACY_PRIVATE = 'private'
  PRIVACY_LINK = 'link'
  PRIVACY_PROTECTED = 'password'

  def related_tables
    @related_tables ||= get_related_tables
  end

  def stats
    @stats ||= CartoDB::Visualization::Stats.new(self).to_poro
  end

  def transition_options
    @transition_options ||= JSON.parse(self.slide_transition_options).symbolize_keys
  end

  def synchronization
    table.nil? ? nil : table.synchronization
  end

  def children
    ordered = []
    children = self.unordered_children
    if children.count > 0
      ordered << children.select { |vis| vis.prev_id.nil? }.first
      children.delete_if { |vis| vis.prev_id.nil? }
      while children.count > 0 && !ordered.last.next_id.nil?
        target = ordered.last.next_id
        ordered << children.select { |vis| vis.id == target }.first
        children.delete_if { |vis| vis.id == target }
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

  def is_publically_accesible?
    is_public? || is_link_privacy?
  end

  def varnish_key
    "#{user.database_name}:#{sorted_related_table_names},#{id}"
  end

  def surrogate_key
    get_surrogate_key(CartoDB::SURROGATE_NAMESPACE_VISUALIZATION, id)
  end

  def qualified_name(viewer_user=nil)
    if viewer_user.nil? || is_owner_user?(viewer_user)
      name
    else
      "\"#{user.database_schema}\".#{name}"
    end
  end

  def retrieve_named_map?
    password_protected? || has_private_tables?
  end

  def has_password?
    !password_salt.nil? && !encrypted_password.nil?
  end

  private

  def password_protected?
    privacy == PRIVACY_PROTECTED
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
    map.carto_and_torque_layers.flat_map { |layer| layer.affected_tables.map { |t| t.service } }.uniq
  end

  def is_link_privacy?
    self.privacy == PRIVACY_LINK
  end

  def is_public?
    self.privacy == PRIVACY_PUBLIC
  end

  def has_read_permission?(user)
    user && (is_owner_user?(user) || (permission && permission.user_has_read_permission?(user)))
  end

  def is_owner_user?(user)
    self.user_id == user.id
  end

end
