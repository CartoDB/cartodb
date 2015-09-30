module Carto
  module PagedModel

    def paged(page = 1, per_page = 20, order = nil)
      self.paged_association(self, page, per_page, order)
    end

    def self.paged_association(association, page = 1, per_page = 20, order = nil)
      paged = association.offset((page - 1) * per_page).limit(per_page)
      paged = paged.order(order) unless order.nil?
      paged
    end

  end
end
