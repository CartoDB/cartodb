require 'active_record'
require_relative '../visualization/stats'

class Carto::Visualization < ActiveRecord::Base
  self.inheritance_column = :_type

  belongs_to :user, inverse_of: :visualizations, select: Carto::User::DEFAULT_SELECT
  belongs_to :permission

  has_many :likes, foreign_key: :subject
  has_many :shared_entities, foreign_key: :entity_id, inverse_of: :visualization

  belongs_to :table, class_name: UserTable, primary_key: :map_id, foreign_key: :map_id
  has_one :external_source
  has_many :unordered_children, class_name: Carto::Visualization, foreign_key: :parent_id

  belongs_to :map

  TYPE_CANONICAL = 'table'
  TYPE_DERIVED = 'derived'
  TYPE_SLIDE = 'slide'
  TYPE_REMOTE = 'remote'


  PRIVACY_PUBLIC = 'public'
  PRIVACY_PRIVATE = 'private'
  PRIVACY_LINK = 'link'

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
    is_viewable_with_link? || has_read_permission?(user)
  end

  private

  def get_related_tables
    return [] unless map
    map.carto_and_torque_layers.flat_map { |layer| layer.affected_tables.map { |t| t.service } }.uniq
  end

  def is_viewable_with_link?
    is_public? || self.privacy == PRIVACY_LINK
  end

  def is_public?
    self.privacy == PRIVACY_PUBLIC
  end

  def has_read_permission?(user)
    is_owner_user?(user) || (permission && permission.user_has_read_permission?(user))
  end

  def is_owner_user?(user)
    self.user_id == user.id
  end

end
