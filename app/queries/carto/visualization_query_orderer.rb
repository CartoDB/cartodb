# encoding: UTF-8

require 'active_record'

class Carto::VisualizationQueryOrderer

  SUPPORTED_OFFDATABASE_ORDERS = %w(size mapviews likes).freeze
  VISUALIZATION_TABLE_ORDERS = %w(name updated_at).freeze

  def initialize(query:, user_id: nil)
    @query = query
    @user_id = user_id
  end

  def order(order, direction = "asc")
    return @query unless order
    order_hash = prepare_order_params(order, direction)
    database_orders = order_hash.except(*SUPPORTED_OFFDATABASE_ORDERS)
    offdatabase_orders = order_hash.slice(*SUPPORTED_OFFDATABASE_ORDERS)

    query = @query
    query = select_favorited if order_hash.include?("favorited")

    if offdatabase_orders.empty?
      query.order("#{database_orders.keys.first} #{database_orders.values.first}")
    else
      Carto::OffdatabaseQueryAdapter.new(query, offdatabase_orders)
    end
  end

  private

  def prepare_order_params(order, direction)
    order = "visualizations.#{order}" if VISUALIZATION_TABLE_ORDERS.include?(order)
    { order => direction }
  end

  def select_favorited
    raise 'Cannot order by favorited if no user is provided' unless @user_id

    @query.select('(likes.actor IS NOT NULL) AS favorited')
          .joins(
            %{
              LEFT JOIN likes
                ON "likes"."subject" = "visualizations"."id"
                AND "likes"."actor" = #{ActiveRecord::Base::sanitize(@user_id)}
            }.squish
          )
  end

end
