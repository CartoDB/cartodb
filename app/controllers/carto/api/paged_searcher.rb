module Carto
  module Api
    module PagedSearcher

      def page_per_page_order_params(default_per_page = 20, default_order = 'updated_at')
        page = (params[:page] || 1).to_i
        per_page = (params[:per_page] || default_per_page).to_i
        order = (params[:order] || default_order).to_sym
        return page, per_page, order
      end

    end
  end
end
