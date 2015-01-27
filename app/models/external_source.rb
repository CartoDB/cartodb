# encoding: UTF-8

require_relative './visualization/member'

# TODO: should this be under CartoDB::Visualization?
class ExternalSource < Sequel::Model

  def validate
    validates_presence :visualization_id
    validates_presence :import_url
  end

  def initialize(visualization_id, import_url)
    super({ visualization_id: visualization_id, import_url: import_url })
  end

  def importable_by(user)
    user.present? && visualization.user_id == user.id
  end

  def visualization
    @visualization ||= CartoDB::Visualization::Member.new(id: visualization_id).fetch
  end

end
