require 'forwardable'
require_relative '../../../models/visualization/vizjson'
require_relative '../../../models/markdown_render'

class Carto::Api::VizJSONPresenter

  def initialize(visualization, redis_cache)
    @visualization = visualization
    @redis_cache = redis_cache
  end

  def to_vizjson(options={})
    key = redis_vizjson_key(options.fetch(:https_request, false))
    redis_cached(key) do
      calculate_vizjson(options)
    end
  end

  private

  def redis_vizjson_key(https_flag = false)
    "visualization:#{@visualization.id}:vizjson:#{https_flag ? 'https' : 'http'}"
  end

  def redis_cached(key)
    value = @redis_cache.get(key)
    if value.present?
      return JSON.parse(value, symbolize_names: true)
    else
      result = yield
      serialized = JSON.generate(result)
      @redis_cache.setex(key, 24.hours.to_i, serialized)
      return result
    end
  end

  def calculate_vizjson(options={})
    vizjson_options = {
      full: false,
      user_name: user.username,
      user_api_key: user.api_key,
      user: user,
      viewer_user: user,
      dynamic_cdn_enabled: user.dynamic_cdn_enabled
    }.merge(options)
    CartoDB::Visualization::VizJSON.new(Carto::Api::VisualizationVizJSONAdapter.new(@visualization), vizjson_options, Cartodb.config).to_poro
  end

  def user
    @user ||= @visualization.user
  end

end

class Carto::Api::VisualizationVizJSONAdapter
  extend Forwardable

  delegate [:id, :map, :qualified_name, :likes, :description, :retrieve_named_map?, :password_protected?, :overlays, :prev_id, :next_id, :transition_options, :has_password?, :children, :parent_id, :parent ] => :visualization

  attr_reader :visualization

  def initialize(visualization)
    @visualization = visualization
  end

  def description_html_safe
    if description.present?
      renderer = Redcarpet::Render::Safe
      markdown = Redcarpet::Markdown.new(renderer, extensions = {})
      markdown.render description 
    end
  end

  def layers(kind)
    choose_layers(kind).map { |layer|
      Carto::Api::LayerVizJSONAdapter.new(layer)
    }
  end

  private

  def choose_layers(kind)
    case kind
    when :base
      map.user_layers
    when :cartodb
      map.data_layers
    when :others
      map.other_layers
    else
      raise "Unknown: #{kind}"
    end
  end

end

class Carto::Api::LayerVizJSONAdapter
  extend Forwardable

  delegate [:options, :kind, :infowindow, :tooltip, :id, :order, :parent_id, :children, :legend] => :layer

  attr_reader :layer

  def initialize(layer)
    @layer = layer
  end

  def public_values
    {
      'options' => options,

      # TODO: kind should be renamed to type
      # rename once a new layer presenter is written. See CartoDB::Layer::Presenter#with_kind_as_type
      # TODO: use symbols instead of strings
      'kind' => kind,

      'infowindow' => infowindow,
      'tooltip' => tooltip,
      'id' => id,
      'order' => order,
      'parent_id' => parent_id,
      'children' => children.map { |child| { id: child.id } }
    }
  end

  def get_presenter(options, configuration)
    # TODO: new layer presenter
    # Carto::LayerPresenter(layer, options, configuration)
    CartoDB::Layer::Presenter.new(self, options, configuration)
  end

end
