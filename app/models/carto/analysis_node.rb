# encoding: UTF-8

class Carto::AnalysisNode
  def initialize(analysis, definition, parent: nil)
    @analysis = analysis
    @definition = definition
    @parent = parent
  end

  attr_reader :analysis, :definition, :parent

  def children
    @children ||= get_children(@definition)
  end

  private

  MANDATORY_KEYS_FOR_ANALYSIS_NODE = [:id, :type, :params, :options].freeze
  def get_children(definition)
    children = definition.map do |_, v|
      if v.is_a?(Hash)
        if (MANDATORY_KEYS_FOR_ANALYSIS_NODE - v.keys).empty?
          Carto::AnalysisNode.new(analysis, v, parent: self)
        else
          get_children(v)
        end
      end
    end
    children.flatten.compact
  end
end
