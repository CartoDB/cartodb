# Class that allows "Grantable" searches.
# Note a Grantable is not an actual ActiveRecord model but an aggregation of User and Group.
# Since ActiveRecord doesn't support polymorphic queries or has_many associations with table per class inheritance, we do it manually here
class Carto::GrantableQueryBuilder

  def initialize(organization)
    @organization = organization
  end

  def run(page = 1, per_page = 200, order = 'name')
    ActiveRecord::Base.connection.exec_query(
      paged_query(order), 'grantable_query', [
        [nil, @organization.id],
        [nil, per_page],
        [nil, (page - 1) * per_page]
    ]).map { |r| Carto::Grantable.new(r) }
  end

  def count
    ActiveRecord::Base.connection.exec_query(
      count_query, 'grantable_query', [
        [nil, @organization.id]]).first['count'].to_i
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
    where grantables.organization_id = $1
    SQL
  end

  def paged_query(order)
    "#{query} order by #{order} limit $2 offset $3"
  end

  def count_query
    "select count(1) from (#{query}) c"
  end
end
