require_relative '../../../helpers/carto/html_safe'
require_relative '../api/vizjson_presenter'

class Carto::Admin::VisualizationPublicMapAdapter
  extend Forwardable
  include Carto::HtmlSafe

  delegate [ :type_slide?, :has_permission?, :derived?, :organization, :organization?, :id, :likes, :password_protected?, :varnish_key, :related_tables, :is_password_valid?, :get_auth_tokens, :table, :name, :overlays, :created_at, :description, :tags, :mapviews, :geometry_types ] => :visualization

  attr_reader :visualization

  def initialize(visualization)
    @visualization = visualization
  end

  def to_vizjson(options = {})
    Carto::Api::VizJSONPresenter.new(@visualization, $tables_metadata).to_vizjson(options)
  end

  def is_owner?(user)
    @visualization.is_owner_user?(user)
  end

  def to_hash(options={})
    # TODO: using an Api presenter here smells, refactor
    presenter = Carto::Api::VisualizationPresenter.new(@visualization, nil, options)
    options.delete(:public_fields_only) === true ? presenter.to_public_poro : presenter.to_poro
  end

  def map
    Carto::Admin::MapPublicMapAdapter.new(@visualization.map)
  end

  def user
    Carto::Admin::UserPublicMapAdapter.new(@visualization.user)
  end

  def liked_by?(user_id)
    @visualization.is_liked_by_user_id?(user_id)
  end

  def description_html_safe
    markdown_html_safe(description)
  end

  def description_clean
    markdown_html_clean(description)
  end

  # TODO: remove is_ prefixed methods from visualization
  def private?
    @visualization.is_private?
  end

  def public?
    @visualization.is_public?
  end

  def public_with_link?
    @visualization.is_link_privacy?
  end

  def related_visualizations
    @visualization.related_visualizations.map { |rv|
      Carto::Admin::VisualizationPublicMapAdapter.new(rv)
    }
  end

end

