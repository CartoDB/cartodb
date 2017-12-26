# encoding: UTF-8

# NOTE: Implement further methods from ActiveRecord::Relation here as needed
module Carto
  class OffdatabaseQueryAdapter

    # @param query ActiveRecord::Relation
    # @param order_by_asc_or_desc_by_attribute Hash { key: value, key: value } where
    #   key = { String  => { submodel: String|nil, attribute: String }, ... }
    #   value = :asc | :desc
    def initialize(query, order_by_asc_or_desc_by_attribute)
      @query = query
      @order_by_asc_or_desc_by_attribute = order_by_asc_or_desc_by_attribute
      @offset = 0
      @limit = nil
    end

    def offset(offset)
      @offset = offset
      self
    end

    def limit(limit)
      @limit = limit
      self
    end

    def all
      results
    end

    def map
      results.map { |a|
        yield(a)
      }
    end

    def count
      results.count 
    end

    def first
      results.first
    end

    private

    def results
      @results ||= get_results
    end

    # NOTE: Sorting for model associations (which return arrays) or arrays will be done based on length
    # e.g. visualization.likes
    def get_results
      all = @query.all
      @order_by_asc_or_desc_by_attribute.each { |attribute, asc_or_desc|
        # Cache attribute type
        is_array = all.count == 0 ? false : all.first.send(attribute).is_a?(Array)
        all = all.sort { |x, y|
          x_attribute = is_array ? x.send(attribute).count : x.send(attribute)
          y_attribute = is_array ? y.send(attribute).count : y.send(attribute)
          x_attribute = 0 if x_attribute.nil?
          y_attribute = 0 if y_attribute.nil?
          asc_or_desc == :asc ? x_attribute <=> y_attribute : y_attribute <=> x_attribute
        }
      }
      all[@offset, last_index(all)]
    end

    def last_index(array)
      @limit.nil? ? array.count : (@offset + @limit)
    end

  end
end
