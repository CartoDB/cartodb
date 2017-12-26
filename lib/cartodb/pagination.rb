module CartoDB
  class Pagination
    def self.get_page_and_per_page(options = {})
      per_page = (options[:rows_per_page] || 10).to_i
      per_page = 5000 if per_page > 5000
      # Allow to set the page number as a range between two pages
      if options[:page] && options[:page].is_a?(String) && options[:page].include?('..')
        first_page, last_page = options[:page].split('..')
        last_page = 1 if last_page.to_i < 1
        page = first_page.to_i*per_page
        per_page = (last_page.to_i - first_page.to_i + 1) *per_page
      else
        page = (options[:page] || 0).to_i*per_page
      end
      return [page, per_page]
    end
  end
end