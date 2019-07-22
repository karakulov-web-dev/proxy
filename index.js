const express = require("express");
const proxy = require("http-proxy-middleware");
const md5 = require("md5");

const app = express();
app.use(express.json());

const host = "http://212.77.128.203/nodejsapp/proxy";

function ProxyTableFacade() {
  this.proxyTable = {};
  this.proxyTableDateAdded = {};
  var self = this;
  setInterval(function() {
    self.deleteOldProxyUrl();
  }, 7200000);
}
ProxyTableFacade.prototype.add = function(url) {
  var proxyUrl = "/" + md5(url);
  this.proxyTable[proxyUrl] = url;
  this.proxyTableDateAdded[proxyUrl] = Date.now();
  return host + proxyUrl;
};
ProxyTableFacade.prototype.deleteOldProxyUrl = function() {
  var time = Date.now();
  for (var key in this.proxyTableDateAdded) {
    if (this.proxyTableDateAdded[key] + 7200000 < time) {
      delete this.proxyTable[key];
      delete this.proxyTableDateAdded[key];
    }
  }
};

const proxyTableFacade = new ProxyTableFacade();

app.get("/get-url-proxy", function(req, res) {
  var status;
  var urlProxy;
  if (typeof req.query.url !== "undefined") {
    status = true;
    errorText = "";
    urlProxy = proxyTableFacade.add(req.query.url);
  } else {
    status = false;
    errorText = "url undefined";
    urlProxy = "";
  }
  res.send({
    status,
    errorText,
    urlProxy
  });
});

app.get("/proxy", function(req, res) {
  var urlProxy;
  if (typeof req.query.url !== "undefined") {
    status = true;
    errorText = "";
    urlProxy = proxyTableFacade.add(req.query.url);
  } else {
    status = false;
    errorText = "url undefined";
    urlProxy = "";
  }
  res.redirect(urlProxy);
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
