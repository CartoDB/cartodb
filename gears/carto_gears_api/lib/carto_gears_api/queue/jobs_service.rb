module CartoGearsApi
  module Queue
    class JobsService
      def send_job(class_name, method, *args)
        ::Resque.enqueue(CartoGearsApi::Queue::GenericJob, class_name, method, *args)
      end
    end
  end
end
