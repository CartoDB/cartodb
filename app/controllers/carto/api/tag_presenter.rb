class Carto::Api::TagPresenter

  def initialize(tag_name, current_viewer, context)
    @tag_name = tag_name
    @current_viewer = current_viewer
    @context = context
  end

  def to_search_preview_poro
    {
      type: "tag",
      name: @tag_name,
      url: CartoDB.url(@context, "tag_search", user: @current_viewer, params: { q: @tag_name })
    }
  end

end
