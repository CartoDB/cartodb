module RuboCop
  module Cop
    module MochaToRSpec
      class AnyInstance < Cop
        # TODO: need to handle allow_any_instance too
        MSG = "Use `expect_any_instance_of(...)` (rspec-mocks) instead of `any_instance` (Mocha)".freeze

# (send
#   (send (const nil :Object) :any_instance)
#   :stubs
#   (sym :foo)
# )
        def_node_matcher :candidate?, <<-RUBY
          $(send
            (send ... :any_instance)
            ${:stubs :expects}
            _
          )
        RUBY

        def on_send(node)
          candidate?(node) do
            return if node.parent&.source&.include?("returns")
            add_offense(node, location: :selector)
          end
        end

        def autocorrect(node)
          lambda do |corrector|
            variant = node.children[1]
            r = case variant
                when :expects
                  "expect_any_instance_of"
                when :stubs
                  "allow_any_instance_of"
                else
                  require 'pry'; binding.pry
                  raise "Invalid variant"
                end
            receiver, _method_name, args = *node
            stubbed_method = args.source
            klass = receiver.children.first.source
            new_source = "#{r}(#{klass}).to receive(#{stubbed_method})"
            corrector.replace(node.source_range, new_source)
          end
        end
      end
    end
  end
end
