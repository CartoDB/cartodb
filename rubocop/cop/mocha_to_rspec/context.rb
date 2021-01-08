module RuboCop
  module Cop
    module MochaToRSpec
      class Context < Cop
        MSG = "Stubbing not allowed here".freeze

          # $(send (send nil? ...) :stubs ...)
        def_node_matcher :candidate?, <<-CODE
          $(send _ {:stubs :expects} _)
CODE

        def on_send(node)
          candidate?(node) do
            # require 'pry'; binding.pry
            if (node.parent&.source&.include?("before(:all)") == true) ||
              (node.parent&.parent&.source&.include?("before(:all)") == true) ||
              (node.parent&.source&.include?("before(:context)") == true) ||
              (node.parent&.parent&.source&.include?("before(:context)") == true)
              add_offense(node, location: :selector)
            end
          end
        end
      end
    end
  end
end
