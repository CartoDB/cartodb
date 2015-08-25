# Class that allows "Grantable" searches.
# Note a Grantable is not an actual ActiveRecord model but an aggregation of User and Group.
# Since ActiveRecord doesn't support polymorphic queries or has_many associations with table per class inheritance, we do it manually here
class Carto::GrantableQueryBuilder

  def initialize(organization)
    @organization = organization
  end

  def run(page = 1, per_page = 200, order = 'name')
    offset = (page - 1) * per_page
    query = ActiveRecord::Base.send(:sanitize_sql_array,
        [paged_query(order), @organization.id, per_page, offset])
    ActiveRecord::Base.connection.execute(query).map { |r| Carto::Grantable.new(r) }
  end

  def count
    query = ActiveRecord::Base.send(:sanitize_sql_array,
        [count_query, @organization.id])
    ActiveRecord::Base.connection.execute(query).first['count'].to_i
  end

  private

  def query
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
  end

  def paged_query(order)
    "#{query} order by #{safe_order(order)} limit ? offset ?"
  end

  def count_query
    "select count(1) from (#{query}) c"
  end

  def safe_order(order)
    order && %w{ id name type avatar_url created_at updated_at organization_id }.include?(order.to_s) ? order.to_s : 'name'
  end
end
