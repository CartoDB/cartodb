module Editor
  class VisualizationsController < EditorController
    include VisualizationsHelper

    ssl_required :show

    before_filter :load_visualization_and_table, only: [:show]

    def show
      unless current_user.present?
        if request.original_fullpath =~ %r{/tables/}
          return(redirect_to CartoDB.url(self, 'public_table_map', id: request.params[:id]))
        else
          return(redirect_to CartoDB.url(self, 'public_visualizations_public_map', id: request.params[:id]))
        end
      end

      @google_maps_query_string = @visualization.user.google_maps_query_string
      @basemaps = @visualization.user.basemaps

      unless @visualization.has_permission?(current_user, CartoDB::Visualization::Member::PERMISSION_READWRITE)
        if request.original_fullpath =~ %r{/tables/}
          return redirect_to CartoDB.url(self,
                                         'public_table_map',
                                         { id: request.params[:id], redirected:true })
        else
          return redirects_to CartoDB.url(self,
                                          'public_visualizations_public_map',
                                          { id: request.params[:id], redirected:true })
        end
      end

      update_user_last_activity
    end
  end
end
