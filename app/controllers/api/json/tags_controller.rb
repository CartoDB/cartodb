# encoding: utf-8
require_relative '../../../models/visualization/tag_counter'

class Api::Json::TagsController < Api::ApplicationController
  ssl_required :index

  def index
    tag_counts = CartoDB::Visualization::TagCounter.new(current_user)
                  .count(params)
    render_jsonp(tag_counts)
  end
end

