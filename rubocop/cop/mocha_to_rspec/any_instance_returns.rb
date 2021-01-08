module RuboCop
  module Cop
    module MochaToRSpec
      class AnyInstanceReturns < Cop
        # TODO: need to handle allow_any_instance too
        MSG = "Use `expect_any_instance_of(...)` (rspec-mocks) instead of `any_instance` (Mocha)".freeze

# (send
#   (send (const nil :Object) :any_instance)
#   :stubs
#   (sym :foo)
# )
        def_node_matcher :candidate?, <<-RUBY
          (send (send (send _ :any_instance) {:stubs :expects} _) :returns _)
        RUBY

        def on_send(node)
          candidate?(node) do
            add_offense(node, location: :selector)
          end
        end

        def autocorrect(node)
          lambda do |corrector|
            obj_any_expects_arg, _returns, ret_val = *node
            obj_any_instance, variant, method_name = *obj_any_expects_arg
            obj, _any_instance, _ = *obj_any_instance
            r = case variant
                when :expects
                  "expect_any_instance_of"
                when :stubs
                  "allow_any_instance_of"
                else
                  require 'pry'; binding.pry
                  raise "Invalid variant"
                end
            new_source = "#{r}(#{obj.source}).to receive(#{method_name.source}).and_return(#{ret_val.source})"
            corrector.replace(node.source_range, new_source)
          end
        end
      end
    end
  end
end
