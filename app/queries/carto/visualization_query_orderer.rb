# encoding: UTF-8

require 'active_record'

class Carto::VisualizationQueryOrderer

  SUPPORTED_OFFDATABASE_ORDERS = %w(size mapviews likes estimated_row_count).freeze
  VISUALIZATION_TABLE_ORDERS = %w(name updated_at privacy).freeze

  def initialize(query)
    @query = query
  end

  def order(order, direction = "")
    return @query unless order

    prepare_order_params(order, direction)

    if offdatabase_orders.empty?
      @query.order(database_orders)
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
      @order_hash[order] = directions[index] || directions[0] || DEFAULT_ORDER_DIRECTION
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

end
