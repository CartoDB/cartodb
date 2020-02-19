# Class that allows "Grantable" searches.
# Note a Grantable is not an actual ActiveRecord model but an aggregation of User and Group.
# Since ActiveRecord doesn't support polymorphic queries or has_many associations
# with table per class inheritance, we do it manually here
class Carto::GrantableQueryBuilder

  def initialize(organization)
    @filter = nil
    @organization = organization
  end

  def with_filter(filter)
    return self unless filter

    clean_filter = filter.gsub('%', '\\%').gsub('_', '\\_')
    @filter = "%#{clean_filter}%"
    self
  end

  def run(page = 1, per_page = 200, order = 'name')
    query = ActiveRecord::Base.send(:sanitize_sql_array, paged_query_array(page, per_page, order))
    ActiveRecord::Base.connection.execute(query).map { |r| Carto::Grantable.new(r) }
  end

  def count
    query = ActiveRecord::Base.send(:sanitize_sql_array, count_query_array)
    ActiveRecord::Base.connection.execute(query).first['count'].to_i
  end

  private

  def compose_query
    query = <<-SQL
    select * from
      (select id, display_name as name, 'group' as type, '' as avatar_url,
        created_at, updated_at,
        organization_id
        from groups
      union
      select id, username as name, 'user' as type, avatar_url,
        created_at, updated_at,
        organization_id
        from users) grantables
    where grantables.organization_id = ?
    SQL
    @filter.nil? ? query : "#{query} and name ilike ?"
  end

  def paged_query_array(page, per_page, order)
    offset = (page - 1) * per_page
    query = "#{compose_query} order by #{safe_order(order)} limit ? offset ?"
    if @filter.nil?
      [query, @organization.id, per_page, offset]
    else
      [query, @organization.id, @filter, per_page, offset]
    end
  end

  def count_query_array
    query = "select count(1) from (#{compose_query}) c"
    if @filter.nil?
      [query, @organization.id]
    else
      [query, @organization.id, @filter]
    end
  end

  def safe_order(order)
    order && %w{ id name type avatar_url created_at updated_at organization_id }.include?(order.to_s) ? order.to_s : 'name'
  end
end
