# coding: utf-8

require_relative '../../../models/visualization/collection'

class Api::Json::MapsController < Api::ApplicationController
  include Carto::UUIDHelper

  ssl_required :update

  before_filter :load_map

  def update
    @stats_aggregator.timing('maps.update') do
      updated = @stats_aggregator.timing('save') { @map.update(allowed_params) }

      if updated != false
        render_jsonp(@map.public_values)
      else
        CartoDB::Logger.error(message: 'Error updating map', errors: @map.errors)

        render_jsonp({ description: @map.errors.full_messages, stack: @map.errors.full_messages }, 400)
      end
    end
  end

  protected

  def load_map
    raise RecordNotFound unless is_uuid?(params[:id])

    # User must be owner or have permissions for the map's visualization
    vis = CartoDB::Visualization::Collection.new.fetch(
        user_id:        current_user.id,
        map_id:         params[:id],
        exclude_raster: true
    ).first
    raise RecordNotFound if vis.nil?

    @map = ::Map.filter(id: params[:id]).first
    raise RecordNotFound if @map.nil?
  end

  def allowed_params
    params.slice(:provider,
                 :bounding_box_sw,
                 :bounding_box_ne,
                 :center,
                 :zoom,
                 :table_id,
                 :view_bounds_sw,
                 :view_bounds_ne,
                 :legends,
                 :scrollwheel,
                 :show_menu)
  end
end
