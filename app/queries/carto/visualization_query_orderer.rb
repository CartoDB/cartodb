require 'active_record'

class Carto::VisualizationQueryOrderer

  DEFAULT_ORDER_DIRECTION = 'asc'.freeze
  SUPPORTED_OFFDATABASE_ORDERS = %w(size mapviews likes estimated_row_count).freeze
  VISUALIZATION_TABLE_ORDERS = %w(name updated_at privacy).freeze

  DEPENDENT_VISUALIZATIONS_ORDER_CLAUSE = "coalesce(dependent_visualization_count, 0)".freeze
  FAVORITED_ORDER_CLAUSE = "(likes.actor IS NOT NULL)".freeze

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
    directions = direction_string.split(',')
    orders = order_string.split(',')

    @order_hash = orders.zip(directions).map { |order, direction|
      order = custom_order_clause(order)
      direction ||= directions[0] || DEFAULT_ORDER_DIRECTION
      [order, direction]
    }.to_h
  end

  def custom_order_clause(order)
    case order
    when 'favorited'
      FAVORITED_ORDER_CLAUSE
    when 'dependent_visualizations'
      DEPENDENT_VISUALIZATIONS_ORDER_CLAUSE
    when *VISUALIZATION_TABLE_ORDERS
      "visualizations.#{order}"
    else
      order
    end
  end

  def database_orders
    db_order_hash = @order_hash.except(*SUPPORTED_OFFDATABASE_ORDERS)
    db_order_hash.map { |key, value| "#{key} #{value}" }.join(",")
  end

  def offdatabase_orders
    @order_hash.slice(*SUPPORTED_OFFDATABASE_ORDERS)
  end

end
