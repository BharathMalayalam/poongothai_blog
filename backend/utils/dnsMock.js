import dns from 'dns';
import https from 'https';

/**
 * Mocks the Node.js dns module methods globally to perform resolution over DoH (DNS-over-HTTPS)
 * using Google's DNS resolution service. This is particularly useful in environments where
 * direct UDP/TCP DNS queries are blocked or fail, allowing MongoDB Atlas connection strings to resolve.
 */
export function setupDnsMock() {
  // Mock dns.resolveSrv globally to resolve SRV records over DoH
  dns.resolveSrv = function (hostname, callback) {
    const url = `https://dns.google/resolve?name=${hostname}&type=SRV`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.Answer && json.Answer.length > 0) {
            const records = json.Answer.map(item => {
              const parts = item.data.split(' ');
              return {
                priority: parseInt(parts[0], 10),
                weight: parseInt(parts[1], 10),
                port: parseInt(parts[2], 10),
                name: parts[3].endsWith('.') ? parts[3].slice(0, -1) : parts[3]
              };
            });
            return callback(null, records);
          }
          callback(new Error(`DNS SRV resolution failed for ${hostname}`));
        } catch (err) {
          callback(err);
        }
      });
    }).on('error', (err) => {
      callback(err);
    });
  };

  // Mock dns.resolveTxt globally to resolve TXT records over DoH
  dns.resolveTxt = function (hostname, callback) {
    const url = `https://dns.google/resolve?name=${hostname}&type=TXT`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.Answer && json.Answer.length > 0) {
            const records = json.Answer.map(item => {
              const cleanData = item.data.replace(/^"|"$/g, '');
              return [cleanData];
            });
            return callback(null, records);
          }
          callback(new Error(`DNS TXT resolution failed for ${hostname}`));
        } catch (err) {
          callback(err);
        }
      });
    }).on('error', (err) => {
      callback(err);
    });
  };

  // Mock dns.lookup globally to resolve IP addresses over DoH
  const originalLookup = dns.lookup;
  dns.lookup = function (hostname, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    
    // Resolve dns.google using originalLookup to avoid recursive DNS lookups
    if (hostname === 'dns.google') {
      return originalLookup(hostname, options, callback);
    }
    
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return originalLookup(hostname, options, callback);
    }

    const url = `https://dns.google/resolve?name=${hostname}&type=A`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.Answer && json.Answer.length > 0) {
            const aRecord = json.Answer.find(item => item.type === 1);
            if (aRecord) {
              if (options && options.all) {
                return callback(null, [{ address: aRecord.data, family: 4 }]);
              }
              return callback(null, aRecord.data, 4);
            }
            const cnameRecord = json.Answer.find(item => item.type === 5);
            if (cnameRecord) {
              return dns.lookup(cnameRecord.data, options, callback);
            }
          }
          originalLookup(hostname, options, callback);
        } catch (err) {
          originalLookup(hostname, options, callback);
        }
      });
    }).on('error', (err) => {
      originalLookup(hostname, options, callback);
    });
  };

  // Mock dns.promises methods to support node's promise-based resolveSrv, resolveTxt, and lookup
  dns.promises.resolveSrv = function (hostname) {
    return new Promise((resolve, reject) => {
      dns.resolveSrv(hostname, (err, records) => {
        if (err) return reject(err);
        resolve(records);
      });
    });
  };

  dns.promises.resolveTxt = function (hostname) {
    return new Promise((resolve, reject) => {
      dns.resolveTxt(hostname, (err, records) => {
        if (err) return reject(err);
        resolve(records);
      });
    });
  };

  dns.promises.lookup = function (hostname, options) {
    return new Promise((resolve, reject) => {
      dns.lookup(hostname, options, (err, address, family) => {
        if (err) return reject(err);
        if (options && options.all) {
          return resolve(address);
        }
        resolve({ address, family });
      });
    });
  };
}
