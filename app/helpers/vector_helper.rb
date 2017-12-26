module VectorHelper
  def vector_render?(visualization, params)
    !visualization.user.has_feature_flag?('vector_vs_raster') || params['vector'] == 'true'
  end
end
