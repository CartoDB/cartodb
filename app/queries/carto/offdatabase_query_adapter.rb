class Carto::OffdatabaseQueryAdapter

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

  private

  def results
    @results ||= get_results
  end

  def get_results
    all = @query.all
    # @see /app/queries/carto/offdatabase_query_adapter.rb
    @order_by_asc_or_desc_by_attribute.each { |data, asc_or_desc|
      submodel = data[:submodel]
      attribute = data[:attribute]
      all = all.sort { |x, y|
        x_attribute = submodel.nil? ? x.send(attribute) : x.send(submodel).send(attribute)
        y_attribute = submodel.nil? ? y.send(attribute) : y.send(submodel).send(attribute)
        asc_or_desc == :asc ? x_attribute <=> y_attribute : y_attribute <=> x_attribute
      }
    }
    all[@offset, last_index(all)]
  end

  def last_index(array)
    @limit.nil? ? array.count - 1 : (@offset + @limit - 1)
  end

end
