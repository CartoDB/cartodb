module Carto
  module Api
    module PagedSearcher

      def page_per_page_order_params(default_per_page = 20, default_order = 'updated_at')
        page = (params[:page] || 1).to_i
        per_page = (params[:per_page] || default_per_page).to_i
        order = (params[:order] || default_order).to_sym
        return page, per_page, order
      end

      def paged_result(result:, last_page:, total_count:, default_per_page:20, default_order:'updated_at')
        page, per_page, order = page_per_page_order_params(default_per_page, default_order)

        metadata = {
          total: total_count,
          count: result.count,
          result: result,
          _links: {}
        }
        metadata[:_links][:first] = { href: yield(page: 1, per_page: per_page, order: order) }
        metadata[:_links][:prev] = { href: yield(page: page - 1, per_page: per_page, order: order) } if page > 1
        metadata[:_links][:next] = { href: yield(page: page + 1, per_page: per_page, order: order) } if last_page > page
        metadata[:_links][:last] = { href: yield(page: last_page, per_page: per_page, order: order) }
        metadata
      end
    end
  end
end
