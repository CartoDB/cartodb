module Carto
  module Api
    module PagedSearcher

      VALID_ORDER_DIRECTIONS = [:asc, :desc].freeze

      def page_per_page_order_params(valid_order_values, default_per_page = 20,
                                     default_order = 'updated_at', default_order_direction = 'desc')
        page = (params[:page].present? ? params[:page] : 1).to_i
        per_page = (params[:per_page].present? ? params[:per_page] : default_per_page).to_i
        order = (params[:order].present? ? params[:order] : default_order).to_sym
        order_direction = (params[:order_direction].present? ?
          params[:order_direction] :
            default_order_direction).to_sym

        if order.present? && !valid_order_values.include?(order)
          raise Carto::OrderParamInvalidError.new(valid_order_values)
        end

        if order_direction.present? && !VALID_ORDER_DIRECTIONS.include?(order_direction)
          raise Carto::OrderDirectionParamInvalidError.new(VALID_ORDER_DIRECTIONS)
        end

        return page, per_page, order, order_direction
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
    end
  end
end
