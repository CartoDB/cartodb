class Carto::AnalysisTree
  def initialize(visualization)
    @visualization = visualization
    @nodes = {}
    # Call descendants to force loading all nodes
    visualization.analyses.each { |a| Carto::AnalysisNode.new(a.analysis_definition, self).descendants }
  end

  def add(node)
    @nodes[node.id] = node unless get(node.id)
  end

  def get(node_id)
    @nodes[node_id]
  end

  def save(exclude: [])
    excluded_ids = exclude.map(&:id)
    ActiveRecord::Base.transaction do
      @visualization.analyses.each(&:destroy)
      @visualization.data_layers.reject { |l| excluded_ids.include?(l.id) }.each do |layer|
        next unless layer.source_id.present?
        node = get(layer.source_id)
        next unless node

        Carto::Analysis.create(
          visualization: @visualization,
          user_id: @visualization.user_id,
          analysis_definition: node.tree_definition
        )
      end
    end
  end
end
