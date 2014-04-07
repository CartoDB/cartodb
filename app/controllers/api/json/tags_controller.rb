# encoding: utf-8
require_relative '../../../models/visualization/tags'

class Api::Json::TagsController < Api::ApplicationController
  ssl_required :index

  def index
    tag_counts = CartoDB::Visualization::Tags.new(current_user)
                  .count(params)
    render_jsonp(tag_counts)
  end
end

