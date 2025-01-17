const express = require("express");
const proxy = require("http-proxy-middleware");
const md5 = require("md5");

const app = express();
app.use(express.json());

const host = "http://212.77.128.203/nodejsapp/proxy";

class ProxyTableFacade {
  constructor(...allowedProxyArr) {
    this.allowedProxy = new Set(...allowedProxyArr);
    this.proxyTable = {};
    this.proxyTableDateAdded = {};
    var self = this;
    setInterval(function() {
      self.deleteOldProxyUrl();
    }, 7200000);
  }
  add(url) {
    let matches = url.match(/^https?:\/\/[^\/]+/i);
    if (!(matches && this.allowedProxy.has(matches[0]))) {
      return "";
    }
    var proxyUrl = "/" + md5(url);
    this.proxyTable[proxyUrl] = url;
    this.proxyTableDateAdded[proxyUrl] = Date.now();
    return host + proxyUrl;
  }
  deleteOldProxyUrl() {
    var time = Date.now();
    for (var key in this.proxyTableDateAdded) {
      if (this.proxyTableDateAdded[key] + 7200000 < time) {
        delete this.proxyTable[key];
        delete this.proxyTableDateAdded[key];
      }
    }
  }
}

const proxyTableFacade = new ProxyTableFacade([
  "http://xn--42-mlcqimbe0a8d2b.xn--p1ai",
  "http://xn--d1abdw2b.net",
  "https://xn--d1abdw2b.net"
]);

app.get("/get-url-proxy", function(req, res) {
  let status = true;
  let urlProxy = "";
  let errorText = "";
  if (typeof req.query.url === "undefined") {
    errorText = "url undefined";
    urlProxy = "";
    status = false;
  }

  if (status) {
    urlProxy = proxyTableFacade.add(req.query.url);
  }

  if (status && !urlProxy) {
    status = false;
    errorText = "not allowed";
  }

  res.send({
    status,
    errorText,
    urlProxy
  });
});

app.get("/proxy", function(req, res) {
  let status = true;
  let urlProxy = "";
  let errorText = "";
  if (typeof req.query.url === "undefined") {
    errorText = "url undefined";
    urlProxy = "";
    status = false;
  }

  if (status) {
    urlProxy = proxyTableFacade.add(req.query.url);
  }

  if (status && !urlProxy) {
    status = false;
    errorText = "not allowed";
  }

  if (status && urlProxy) {
    res.redirect(urlProxy);
  } else {
    res.send({
      status,
      errorText,
      urlProxy
    });
  }
});

const options = {
  target: "http://212.77.128.205/",
  router: proxyTableFacade.proxyTable,
  secure: false,
  pathRewrite: function(path, req) {
    return path.replace(path, "");
  },
  changeOrigin: true
};
const myProxy = proxy(options);

app.use(myProxy);
app.listen(8006);
