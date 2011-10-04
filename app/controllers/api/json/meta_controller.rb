# coding: UTF-8

class Api::Json::MetaController < Api::ApplicationController
  ssl_required :column_types

  def column_types
    render_jsonp(CartoDB::TYPES.keys.map{|t| t.capitalize})
  end
end