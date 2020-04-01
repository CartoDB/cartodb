export function fetchIPs (context) {
  context.commit('setFetchingState');

  context.rootState.client.directDBConnection().getIPs(function (err, _, data) {
    debugger;
    if (err) {
      const error = data.responseJSON && data.responseJSON.errors ||
        { message: data.responseText || data.statusText };
      context.commit('setIPsRequestError', error);
      return;
    }

    if (data.ips) {
      context.commit('setIPs', data.ips.split(','));
    }
  });
}

export function setIPs (context, ips) {
  context.rootState.client.directDBConnection().setIPs(ips,
    function (err, _, data) {
      if (err) {
        // TODO: Errors
      }

      // context.commit('setIPs', data.ips);
    }
  );
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
