
require_dependency 'carto/uuidhelper'

module Carto
  module Api
    class LayersController < ::Api::ApplicationController
      include Carto::ControllerHelper

      ssl_required :show, :layers_by_map, :custom_layers_by_user, :map_index, :user_index, :map_show, :user_show,
                   :map_create, :user_create, :map_update, :user_update, :map_destroy, :user_destroy

      before_filter :ensure_current_user, only: [:user_index, :user_show, :user_create, :user_update, :user_destroy]
      before_filter :load_user_layer, only: [:user_show, :user_destroy]
      before_filter :load_user_layers, only: [:user_update]

      before_filter :load_map, only: [:map_index, :map_show, :map_create, :map_update, :map_destroy]
      before_filter :ensure_writable_map, only: [:map_create, :map_update, :map_destroy]
      before_filter :load_map_layer, only: [:map_show, :map_destroy]
      before_filter :load_map_layers, only: [:map_update]

      rescue_from LoadError,
                  UnprocesableEntityError,
                  UnauthorizedError, with: :rescue_from_carto_error

      def map_index
        index(@map.layers)
      end

      def user_index
        index(@user.layers, owner: @user)
      end

      def map_show
        show(@map.user)
      end

      def user_show
        show(current_user)
      end

      def map_create
        layer = Carto::Layer.new(layer_attributes(params))
        validate_for_map(layer)

        save_layer(layer) do
          @map.layers << layer
          @map.process_privacy_in(layer)

          from_layer = Carto::Layer.where(id: params[:from_layer_id]).first if params[:from_layer_id]
          from_letter = params[:from_letter]
          update_layer_node_styles(layer, from_layer, from_letter)
        end
      end

      def user_create
        layer = Carto::Layer.new(layer_attributes(params))

        save_layer(layer) { @user.layers << layer }
      end

      def map_update
        update
      end

      def user_update
        update
      end

      def map_destroy
        destroy
      end

      def user_destroy
        destroy
      end

      private

      def validate_for_map(layer)
        unless @map.can_add_layer?(current_user, layer)
          raise UnprocesableEntityError.new('Cannot add more layers to this visualization')
        end
        unless @map.admits_layer?(layer)
          raise UnprocesableEntityError.new('Cannot add more layers of this type')
        end

        table_name = layer.options['table_name']
        user_name = layer.options['user_name']
        if user_name.present?
          table_name = user_name + '.' + table_name
        end

        if layer.data_layer?
          table_visualization = Helpers::TableLocator.new.get_by_id_or_name(
            table_name,
            current_user
          ).visualization
          unless table_visualization.has_read_permission?(current_user)
            raise UnauthorizedError.new('You do not have permission in the layer you are trying to add')
          end
        end
      end

      def index(layers, owner: nil)
        presented_layers = layers.map do |layer|
          Carto::Api::LayerPresenter.new(layer, viewer_user: current_user, user: owner || owner_user(layer)).to_poro
        end

        render_jsonp layers: presented_layers, total_entries: presented_layers.size
      end

      def show(owner)
        render_jsonp Carto::Api::LayerPresenter.new(@layer, viewer_user: current_user, user: owner).to_json
      end

      # Takes a block, executed after saving
      def save_layer(layer)
        if layer.save
          yield

          render_jsonp Carto::Api::LayerPresenter.new(layer, viewer_user: current_user).to_poro
        else
          CartoDB::Logger.error(message: 'Error creating layer', errors: layer.errors.full_messages)
          raise UnprocesableEntityError.new(layer.errors.full_messages)
        end
      end

      def update
        layers = @layers.map do |layer|
          layer_params = params[:layers].present? ? params[:layers].find { |p| p['id'] == layer.id } : params

          # don't allow to override table_name and user_name
          new_layer_options = layer_params[:options]
          ['table_name', 'user_name'].each do |key|
            if layer.options.include?(key)
              new_layer_options[key] = layer.options[key]
            else
              new_layer_options.delete(key)
            end
          end

          unless layer.update_attributes(layer_attributes(layer_params))
            raise UnprocesableEntityError.new(layer.errors.full_messages)
          end

          layer
        end

        if layers.count > 1
          render_jsonp(layers: layers.map { |l| Carto::Api::LayerPresenter.new(l, viewer_user: current_user).to_poro })
        else
          render_jsonp Carto::Api::LayerPresenter.new(layers[0], viewer_user: current_user).to_poro
        end
      rescue RuntimeError => e
        CartoDB::Logger.error(message: 'Error updating layer', exception: e)
        render_jsonp({ description: e.message }, 400)
      end

      def destroy
        @layer.destroy
        head :no_content
      end

      def layer_attributes(param)
        param.slice(:options, :kind, :infowindow, :tooltip, :order)
      end

      def ensure_current_user
        user_id = uuid_parameter(:user_id)
        raise UnauthorizedError unless current_user.id == user_id
        @user = Carto::User.find(user_id)
      end

      def load_user_layer
        load_user_layers
        raise LoadError.new('Layer not found') unless @layers.length == 1
        @layer = @layers.first
      end

      def load_user_layers
        @layers = layers_ids.map { |id| @user.layers.find(id) }
      rescue ActiveRecord::RecordNotFound
        raise LoadError.new('Layer not found')
      end

      def load_map
        map_id = uuid_parameter(:map_id)

        # User must be owner or have permissions for the map's visualization
        @map = Carto::Map.find(map_id)
        vis = @map.visualization
        raise LoadError.new('Map not found') unless vis.try(:is_viewable_by_user?, current_user)
      rescue ActiveRecord::RecordNotFound
        raise LoadError.new('Map not found')
      end

      def ensure_writable_map
        raise UnauthorizedError unless @map.visualization.writable_by?(current_user)
      end

      def load_map_layer
        load_map_layers
        raise LoadError.new('Layer not found') unless @layers.length == 1
        @layer = @layers.first
      end

      def load_map_layers
        @layers = layers_ids.map { |id| @map.layers.find(id) }
      rescue ActiveRecord::RecordNotFound
        raise LoadError.new('Layer not found')
      end

      def layers_ids
        if params[:id]
          [params[:id]]
        elsif params[:layers]
          params[:layers].map { |l| l['id'] }
        else
          raise LoadError.new('Layer not found')
        end
      end

      def owner_user(layer)
        if current_user.nil? || @map.user.id != current_user.id
          # This keeps backwards compatibility with map user assignment. See #8974
          @map.user
        elsif layer.options && layer.options['user_name'].present?
          ::User.where(username: layer.options['user_name']).first
        else
          layer.user
        end
      end

      def update_layer_node_styles(to_layer, from_layer, from_letter)
        to_letter = to_layer.options['letter']
        to_source = to_layer.options['source']
        if from_layer.present? && from_letter.present? && to_letter.present? && to_source.present?
          move_layer_node_styles(from_layer, from_letter, to_layer, to_letter, to_source)
          update_source_layer_styles(from_layer, from_letter, to_letter, to_source)
        end
      rescue => e
        CartoDB::Logger.error(
          message: 'Error updating layer node styles',
          exception: e,
          from_layer: from_layer,
          from_letter: from_letter,
          to_layer: to_layer
        )
      end

      def move_layer_node_styles(from_layer, from_letter, to_layer, to_letter, to_source)
        source_node_number = to_source[1..-1].to_i
        nodes_to_move = from_layer.layer_node_styles.select do |lns|
          lns.source_id.starts_with?(from_letter) && lns.source_id[1..-1].to_i < source_node_number
        end

        nodes_to_move.each do |lns|
          # Move LayerNodeStyles from the old layer if given.
          lns.source_id = lns.source_id.gsub(from_letter, to_letter)
          to_layer.layer_node_styles << lns
        end
      end

      def update_source_layer_styles(from_layer, from_letter, to_letter, to_source)
        if from_letter != to_letter
          # Dragging middle node: rename the moved node
          node_id_to_fix = to_source.gsub(to_letter, from_letter)
          style_node = ::LayerNodeStyle.where(layer_id: from_layer.id, source_id: node_id_to_fix).first
          if style_node
            style_node.source_id = to_source
            style_node.save
          end
        else
          # Dragging head node: remove unneeded old styles in the old layer
          from_layer.reload
          from_layer.layer_node_styles.select { |lns|
            lns.source_id.starts_with?(from_letter) && lns.source_id != to_source
          }.each(&:destroy)
        end
      end
    end
  end
end
