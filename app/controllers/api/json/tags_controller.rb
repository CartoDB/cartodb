# encoding: utf-8

class Api::Json::TagsController < Api::ApplicationController
  ssl_required :index

  def index
    limit = (params.fetch(:limit, 500) || 500).to_i
    render_jsonp(tag_counts_for(current_user, limit))
  end

  def tag_counts_for(current_user, limit=5)
    map_ids = current_user.maps.map(&:id).join(',')

    Tag.fetch(%Q{
      WITH tags as (
        SELECT unnest(tags) as name
        FROM visualizations
        WHERE map_id IN (#{map_ids})
        LIMIT #{limit}
      )
      SELECT name, count(*) as count
      FROM tags
      GROUP BY name
      ORDER BY count(*)
    }).all.map(&:values)
  end # tag_counts
end

