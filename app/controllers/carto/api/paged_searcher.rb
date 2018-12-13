module Carto
  module Api
    module PagedSearcher

      VALID_ORDER_DIRECTIONS = [:asc, :desc].freeze

      def page_per_page_order_params(valid_order_values, default_per_page: 20, default_order: 'updated_at',
                                     default_order_direction: 'desc', valid_order_combinations: [])
        page = (params[:page].presence || 1).to_i
        per_page = (params[:per_page].presence || default_per_page).to_i
        order = order_from_params(valid_order_values, default_order: default_order,
                                                      valid_order_combinations: valid_order_combinations)
        order_direction = order_direction_from_params(default_order_direction: default_order_direction,
                                                      valid_order_combinations: valid_order_combinations)

        [page, per_page, order, order_direction]
      end

      def paged_result(result:, total_count:, page:, per_page:, order:)
        last_page = (total_count / per_page.to_f).ceil

        metadata = {
          total: total_count,
          count: result.count,
          result: result,
          _links: {
            first: { href: yield(page: 1, per_page: per_page, order: order) },
            last: { href: yield(page: last_page, per_page: per_page, order: order) }
          }
        }

        metadata[:_links][:prev] = { href: yield(page: page - 1, per_page: per_page, order: order) } if page > 1
        metadata[:_links][:next] = { href: yield(page: page + 1, per_page: per_page, order: order) } if last_page > page
        metadata
      end

      def order_from_params(valid_order_values, default_order:, valid_order_combinations:)
        order = (params[:order].presence || default_order).to_sym
        order_array = order.to_s.split(',').map(&:to_sym)
        single_parameter = valid_order_combinations.empty? || order_array.size == 1
        multiple_parameter = valid_order_combinations.present? && order_array.size > 1

        if single_parameter && valid_order_values.exclude?(order)
          raise Carto::ParamInvalidError.new('order', valid_order_values)
        end

        if multiple_parameter && (order_array - valid_order_combinations).present?
          raise Carto::ParamCombinationInvalidError.new('order', valid_order_combinations)
        end

        order
      end

      def order_direction_from_params(default_order_direction:, valid_order_combinations:)
        order_direction = (params[:order_direction].presence || default_order_direction).to_sym
        order_direction_array = order_direction.to_s.split(',').map(&:to_sym)
        single_parameter = valid_order_combinations.empty? || order_direction_array.size == 1
        multiple_parameter = valid_order_combinations.present? && order_direction_array.size > 1

        if single_parameter && VALID_ORDER_DIRECTIONS.exclude?(order_direction)
          raise Carto::ParamInvalidError.new('order_direction', VALID_ORDER_DIRECTIONS)
        end

        if multiple_parameter && (order_direction_array - VALID_ORDER_DIRECTIONS).present?
          raise Carto::ParamCombinationInvalidError.new('order_direction', VALID_ORDER_DIRECTIONS)
        end

        order_direction
      end
    end
  end
end
