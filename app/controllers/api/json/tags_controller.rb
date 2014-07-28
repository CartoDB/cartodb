# encoding: utf-8
require_relative '../../../models/visualization/tags'

class Api::Json::TagsController < Api::ApplicationController
  ssl_required :index

  def index
    options = {}
    if params[:exclude_shared].present? && params[:exclude_shared] == true
      options[:exclude_shared] = true
    end

    tag_counts = CartoDB::Visualization::Tags.new(current_user, options)
      .count(params)
    render_jsonp(tag_counts)
  end
end

