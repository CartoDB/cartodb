export function fetchIPs (context) {
  context.commit('setFetchingState');
  return new Promise((resolve, reject) => {
    context.rootState.client.directDBConnection().getIPs(function (err, _, data) {
      if (err) {
        const errorMessage =
          (data.responseJSON && data.responseJSON.errors) ||
          data.responseText ||
          data.statusText;

        context.commit('setIPsRequestError', errorMessage);
        return reject(errorMessage);
      }

      const ips = data.ips || [];
      context.commit('setIPs', ips);
      resolve(ips);
    });
  });
}

export function setIPs (context, ips) {
  return new Promise((resolve, reject) => {
    context.rootState.client.directDBConnection().setIPs(ips,
      function (err, _, data) {
        if (err) {
          const errorMessage =
            (data.responseJSON && data.responseJSON.errors && data.responseJSON.errors.ips && data.responseJSON.errors.ips.join('. ')) ||
            (data.responseJSON && data.responseJSON.errors) ||
            data.responseText ||
            data.statusText;

          context.commit('setIPsRequestError', errorMessage);
          return reject(errorMessage);
        }

        const ips = data.ips || [];
        context.commit('setIPs', ips);
        resolve(ips);
      }
    );
  });
}

export function fetchCertificates (context) {
  context.commit('setFetchingState');

  context.rootState.client.directDBConnection().getCertificates(function (err, _, data) {
    if (err) {
      const error = data.responseJSON && data.responseJSON.errors ||
        { message: data.responseText || data.statusText };
      context.commit('setCertificatesRequestError', error);
      return;
    }

    context.commit('setCertificates', data);
  });
}

export function revokeCertificate (context, certificateId) {
  return new Promise((resolve, reject) => {
    context.rootState.client.directDBConnection()
      .revokeCertificate(certificateId, (err, _, data) => {
        if (err) {
          const error = data.responseJSON && data.responseJSON.errors ||
            { message: data.responseText || data.statusText };
          return reject(error);
        }

        resolve();
      });
  });
}
