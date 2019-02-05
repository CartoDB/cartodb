module Carto
  module Api
    module PagedSearcher

      VALID_ORDER_DIRECTIONS = [:asc, :desc].freeze

      def page_per_page_params(default_per_page: 20)
        page = (params[:page].presence || 1).to_i
        per_page = (params[:per_page].presence || default_per_page).to_i
        [page, per_page]
      end

      def page_per_page_order_params(valid_order_values, default_per_page: 20, default_order: 'updated_at',
                                     default_order_direction: 'desc', valid_order_combinations: [])
        page, per_page = page_per_page_params(default_per_page: default_per_page)

        order = extract_param(name: :order, default_value: default_order, valid_values: valid_order_values,
                              valid_combinations: valid_order_combinations)
        order_direction = extract_param(name: :order_direction, default_value: default_order_direction,
                                        valid_values: VALID_ORDER_DIRECTIONS,
                                        valid_combinations: VALID_ORDER_DIRECTIONS)

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

      def extract_param(name:, default_value:, valid_values:, valid_combinations:)
        param = (params[name].presence || default_value).to_sym
        param_values = param.to_s.split(',').map(&:to_sym)
        single_parameter = valid_combinations.empty? || param_values.size == 1

        if single_parameter && valid_values.exclude?(param)
          raise Carto::ParamInvalidError.new(name, valid_values)
        end

        if !single_parameter && (param_values - valid_combinations).present?
          raise Carto::ParamCombinationInvalidError.new(name, valid_combinations)
        end

        param
      end
    end
  end
end
