import ForbiddenAction from 'builder/data/backbone/network-interceptors/interceptors/forbidden-403';
import NetworkResponseInterceptor from 'builder/data/backbone/network-interceptors/interceptor';

NetworkResponseInterceptor.addURLPattern('api/v');
NetworkResponseInterceptor.addErrorInterceptor(ForbiddenAction());
NetworkResponseInterceptor.start();
