# encoding: utf-8

class Api::Json::TagsController < Api::ApplicationController
  ssl_required :index

  DEFAULT_LIMIT = 500

  def index
    render_jsonp(tag_counts_for(current_user, params))
  end

  private

  def tag_counts_for(user, params)
    Tag.fetch(%Q{
        WITH tags as (
          SELECT unnest(tags) as name
          FROM visualizations
          WHERE map_id IN ?
          AND type IN ?
          LIMIT ?
        )
        SELECT name, count(*) as count
        FROM tags
        GROUP BY name
        ORDER BY count(*)
      }, map_ids_for(user), types_from(params), limit_from(params)
    ).all.map(&:values)
  end # tag_counts

  def map_ids_for(user)
    user.maps.map(&:id)
  end #map_ids

  def types_from(params={})
    default = %w{ table derived }
    type    = params.fetch(:type, nil)
    return default if type.nil? || type.empty?
    [type]
  end #type_filter_from

  def limit_from(params={})
    (params.fetch(:limit, DEFAULT_LIMIT) || DEFAULT_LIMIT).to_i
  end #limit_from
end

