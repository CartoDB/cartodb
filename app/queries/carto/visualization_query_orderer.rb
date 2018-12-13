# encoding: UTF-8

require 'active_record'

class Carto::VisualizationQueryOrderer

  SUPPORTED_OFFDATABASE_ORDERS = %w(size mapviews likes estimated_row_count dependent_visualizations).freeze
  VISUALIZATION_TABLE_ORDERS = %w(name updated_at privacy).freeze

  def initialize(query:, user_id: nil)
    @query = query
    @user_id = user_id
  end

  def order(order, direction = "")
    return @query unless order

    prepare_order_params(order, direction)

    if offdatabase_orders.empty?
      query_with_favorited_if_needed.order(database_orders)
    else
      Carto::OffdatabaseQueryAdapter.new(@query, offdatabase_orders)
    end
  end

  private

  def prepare_order_params(order_string, direction_string)
    @order_hash = {}
    directions = direction_string.split(',')
    orders = order_string.split(',')

    orders.each_with_index do |order, index|
      order = "visualizations.#{order}" if VISUALIZATION_TABLE_ORDERS.include?(order)
      @order_hash[order] = directions[index] || "asc"
    end
    @order_hash
  end

  def database_orders
    db_order_hash = @order_hash.except(*SUPPORTED_OFFDATABASE_ORDERS)
    db_order_hash.map { |key, value| "#{key} #{value}" }.join(",")
  end

  def offdatabase_orders
    @order_hash.slice(*SUPPORTED_OFFDATABASE_ORDERS)
  end

  def query_with_favorited_if_needed
    return @query unless @order_hash.include?("favorited")
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
