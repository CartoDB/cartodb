require 'active_record'
require_relative '../visualization/stats'

class Carto::Visualization < ActiveRecord::Base
  self.inheritance_column = :_type

  belongs_to :user, inverse_of: :visualizations
  belongs_to :permission

  has_many :likes, foreign_key: :subject
  has_many :shared_entities, foreign_key: :entity_id, inverse_of: :visualization

  belongs_to :table, class_name: UserTable, primary_key: :map_id, foreign_key: :map_id
  has_one :external_source
  has_many :unordered_children, class_name: Carto::Visualization, foreign_key: :parent_id

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

  def liked_by?(user_id)
    !likes.index { |l| l.actor == user_id }.nil?
  end

end
