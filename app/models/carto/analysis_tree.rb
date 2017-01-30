class Carto::AnalysisTree
  def initialize(visualization)
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
end
