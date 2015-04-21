!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.arangojs=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';
module.exports = require('./lib/database');

},{"./lib/database":5}],2:[function(require,module,exports){
'use strict';
var promisify = require('./util/promisify');
var inherits = require('util').inherits;
var extend = require('extend');
var ArrayCursor = require('./cursor');

module.exports = extend(function (connection, body) {
  var Ctor = body.type === 3 ? EdgeCollection : DocumentCollection;
  return new Ctor(connection, body);
}, {
  _BaseCollection: BaseCollection,
  DocumentCollection: DocumentCollection,
  EdgeCollection: EdgeCollection
});

function BaseCollection(connection, body) {
  this._connection = connection;
  this._api = this._connection.route('_api');
  extend(this, body);
  delete this.code;
  delete this.error;
}

extend(BaseCollection.prototype, {
  _documentPath: function _documentPath(documentHandle) {
    return (this.type === 3 ? 'edge/' : 'document/') + this._documentHandle(documentHandle);
  },
  _documentHandle: function _documentHandle(documentHandle) {
    if (documentHandle._id) {
      documentHandle = documentHandle._id;
    } else if (documentHandle._key) {
      documentHandle = documentHandle._key;
    }
    if (documentHandle.indexOf('/') === -1) {
      documentHandle = this.name + '/' + documentHandle;
    }
    return documentHandle;
  },
  _indexHandle: function _indexHandle(indexHandle) {
    if (indexHandle.id) {
      indexHandle = indexHandle.id;
    }
    if (indexHandle.indexOf('/') === -1) {
      indexHandle = this.name + '/' + indexHandle;
    }
    return indexHandle;
  },
  _get: function _get(path, update, opts, cb) {
    if (typeof opts === 'function') {
      cb = opts;
      opts = undefined;
    }

    var _promisify = promisify(cb);

    var promise = _promisify.promise;
    var callback = _promisify.callback;

    var self = this;
    self._api.get('collection/' + self.name + '/' + path, opts, function (err, res) {
      if (err) callback(err);else {
        if (update) {
          extend(self, res.body);
          delete self.code;
          delete self.error;
        }
        callback(null, res.body);
      }
    });
    return promise;
  },
  _put: function _put(path, data, update, cb) {
    var _promisify2 = promisify(cb);

    var promise = _promisify2.promise;
    var callback = _promisify2.callback;

    var self = this;
    self._api.put('collection/' + self.name + '/' + path, data, function (err, res) {
      if (err) callback(err);else {
        if (update) extend(self, res.body);
        callback(null, res.body);
      }
    });
    return promise;
  },
  properties: function properties(cb) {
    return this._get('properties', true, cb);
  },
  count: function count(cb) {
    return this._get('count', true, cb);
  },
  figures: function figures(cb) {
    return this._get('figures', true, cb);
  },
  revision: function revision(cb) {
    return this._get('revision', true, cb);
  },
  checksum: function checksum(opts, cb) {
    return this._get('checksum', true, opts, cb);
  },
  load: function load(count, cb) {
    if (typeof count === 'function') {
      cb = count;
      count = undefined;
    }
    return this._put('load', typeof count === 'boolean' ? { count: count } : undefined, true, cb);
  },
  unload: function unload(cb) {
    return this._put('unload', undefined, true, cb);
  },
  setProperties: function setProperties(properties, cb) {
    return this._put('properties', properties, true, cb);
  },
  rename: function rename(name, cb) {
    return this._put('rename', { name: name }, true, cb);
  },
  rotate: function rotate(cb) {
    return this._put('rotate', undefined, false, cb);
  },
  truncate: function truncate(cb) {
    return this._put('truncate', undefined, true, cb);
  },
  drop: function drop(cb) {
    var _promisify3 = promisify(cb);

    var promise = _promisify3.promise;
    var callback = _promisify3.callback;

    var self = this;
    self._api['delete']('collection/' + self.name, function (err, res) {
      if (err) callback(err);else callback(null, res.body);
    });
    return promise;
  },
  replace: function replace(documentHandle, data, opts, cb) {
    if (typeof opts === 'function') {
      cb = opts;
      opts = undefined;
    }

    var _promisify4 = promisify(cb);

    var promise = _promisify4.promise;
    var callback = _promisify4.callback;

    opts = extend({}, opts, { collection: this.name });
    this._api.put(this._documentPath(documentHandle), data, opts, function (err, res) {
      if (err) callback(err);else callback(null, res.body);
    });
    return promise;
  },
  update: function update(documentHandle, data, opts, cb) {
    if (typeof opts === 'function') {
      cb = opts;
      opts = undefined;
    }

    var _promisify5 = promisify(cb);

    var promise = _promisify5.promise;
    var callback = _promisify5.callback;

    opts = extend({}, opts, { collection: this.name });
    this._api.patch(this._documentPath(documentHandle), data, opts, function (err, res) {
      if (err) callback(err);else callback(null, res.body);
    });
    return promise;
  },
  remove: function remove(documentHandle, opts, cb) {
    if (typeof opts === 'function') {
      cb = opts;
      opts = undefined;
    }

    var _promisify6 = promisify(cb);

    var promise = _promisify6.promise;
    var callback = _promisify6.callback;

    opts = extend({}, opts, { collection: this.name });
    this._api['delete'](this._documentPath(documentHandle), opts, function (err, res) {
      if (err) callback(err);else callback(null, res.body);
    });
    return promise;
  },
  all: function all(type, cb) {
    if (typeof type === 'function') {
      cb = type;
      type = undefined;
    }

    var _promisify7 = promisify(cb);

    var promise = _promisify7.promise;
    var callback = _promisify7.callback;

    this._api.get('document', {
      type: type || 'id',
      collection: this.name
    }, function (err, res) {
      if (err) callback(err);else callback(null, res.body.documents);
    });
    return promise;
  },
  'import': function _import(data, opts, cb) {
    if (typeof opts === 'function') {
      cb = opts;
      opts = undefined;
    }

    var _promisify8 = promisify(cb);

    var promise = _promisify8.promise;
    var callback = _promisify8.callback;

    this._api.request({
      method: 'POST',
      path: 'import',
      body: data,
      ld: Boolean(!opts || opts.type !== 'array'),
      qs: extend({
        type: 'auto'
      }, opts, {
        collection: this.name
      })
    }, function (err, res) {
      if (err) callback(err);else callback(null, res.body);
    });
    return promise;
  },
  indexes: function indexes(cb) {
    var _promisify9 = promisify(cb);

    var promise = _promisify9.promise;
    var callback = _promisify9.callback;

    this._api.get('index', { collection: this.name }, function (err, res) {
      if (err) callback(err);else callback(null, res.body.indexes);
    });
    return promise;
  },
  index: function index(indexHandle, cb) {
    var _promisify10 = promisify(cb);

    var promise = _promisify10.promise;
    var callback = _promisify10.callback;

    this._api.get('index/' + this._indexHandle(indexHandle), function (err, res) {
      if (err) callback(err);else callback(null, res.body);
    });
    return promise;
  },
  createIndex: function createIndex(details, cb) {
    var _promisify11 = promisify(cb);

    var promise = _promisify11.promise;
    var callback = _promisify11.callback;

    this._api.post('index', details, {
      collection: this.name
    }, function (err, res) {
      if (err) callback(err);else callback(null, res.body);
    });
    return promise;
  },
  dropIndex: function dropIndex(indexHandle, cb) {
    var _promisify12 = promisify(cb);

    var promise = _promisify12.promise;
    var callback = _promisify12.callback;

    this._api['delete']('index/' + this._indexHandle(indexHandle), function (err, res) {
      if (err) callback(err);else callback(null, res.body);
    });
    return promise;
  },
  createCapConstraint: function createCapConstraint(size, cb) {
    if (typeof size === 'number') {
      size = { size: size };
    }

    var _promisify13 = promisify(cb);

    var promise = _promisify13.promise;
    var callback = _promisify13.callback;

    this._api.post('index', extend({}, size, {
      type: 'cap'
    }), { collection: this.name }, function (err, res) {
      if (err) callback(err);else callback(null, res.body);
    });
    return promise;
  },
  createHashIndex: function createHashIndex(fields, unique, cb) {
    if (typeof unique === 'function') {
      cb = unique;
      unique = undefined;
    }
    if (typeof fields === 'string') {
      fields = [fields];
    }

    var _promisify14 = promisify(cb);

    var promise = _promisify14.promise;
    var callback = _promisify14.callback;

    this._api.post('index', {
      type: 'hash',
      fields: fields,
      unique: Boolean(unique)
    }, { collection: this.name }, function (err, res) {
      if (err) callback(err);else callback(null, res.body);
    });
    return promise;
  },
  createSkipList: function createSkipList(fields, unique, cb) {
    if (typeof unique === 'function') {
      cb = unique;
      unique = undefined;
    }
    if (typeof fields === 'string') {
      fields = [fields];
    }

    var _promisify15 = promisify(cb);

    var promise = _promisify15.promise;
    var callback = _promisify15.callback;

    this._api.post('index', {
      type: 'skiplist',
      fields: fields,
      unique: Boolean(unique)
    }, { collection: this.name }, function (err, res) {
      if (err) callback(err);else callback(null, res.body);
    });
    return promise;
  },
  createGeoIndex: function createGeoIndex(fields, opts, cb) {
    if (typeof opts === 'function') {
      cb = opts;
      opts = undefined;
    }
    if (typeof fields === 'string') {
      fields = [fields];
    }

    var _promisify16 = promisify(cb);

    var promise = _promisify16.promise;
    var callback = _promisify16.callback;

    this._api.post('index', extend({}, opts, {
      type: 'geo',
      fields: fields
    }), { collection: this.name }, function (err, res) {
      if (err) callback(err);else callback(null, res.body);
    });
    return promise;
  },
  createFulltextIndex: function createFulltextIndex(fields, minLength, cb) {
    if (typeof minLength === 'function') {
      cb = minLength;
      minLength = undefined;
    }
    if (typeof fields === 'string') {
      fields = [fields];
    }

    var _promisify17 = promisify(cb);

    var promise = _promisify17.promise;
    var callback = _promisify17.callback;

    this._api.post('index', {
      type: 'fulltext',
      fields: fields,
      minLength: minLength ? Number(minLength) : undefined
    }, { collection: this.name }, function (err, res) {
      if (err) callback(err);else callback(null, res.body);
    });
    return promise;
  },
  fulltext: function fulltext(field, query, opts, cb) {
    if (typeof opts === 'function') {
      cb = opts;
      opts = undefined;
    }
    if (opts) {
      opts = extend({}, opts);
      if (opts.index) opts.index = this._indexHandle(opts.index);
    }

    var _promisify18 = promisify(cb);

    var promise = _promisify18.promise;
    var callback = _promisify18.callback;

    var self = this;
    self._api.put('simple/fulltext', extend(opts, {
      collection: this.name,
      attribute: field,
      query: query
    }), function (err, res) {
      if (err) callback(err);else callback(null, new ArrayCursor(self._connection, res.body));
    });
    return promise;
  },
  near: function near(latitude, longitude, opts, cb) {
    if (typeof opts === 'function') {
      cb = opts;
      opts = undefined;
    }
    if (opts) {
      opts = extend({}, opts);
      if (opts.geo) opts.geo = this._indexHandle(opts.geo);
    }

    var _promisify19 = promisify(cb);

    var promise = _promisify19.promise;
    var callback = _promisify19.callback;

    var self = this;
    self._api.put('simple/near', extend(opts, {
      collection: this.name,
      latitude: latitude,
      longitude: longitude
    }), function (err, res) {
      if (err) callback(err);else callback(null, new ArrayCursor(self._connection, res.body));
    });
    return promise;
  },
  within: function within(latitude, longitude, radius, opts, cb) {
    if (typeof opts === 'function') {
      cb = opts;
      opts = undefined;
    }
    if (opts) {
      opts = extend({}, opts);
      if (opts.geo) opts.geo = this._indexHandle(opts.geo);
    }

    var _promisify20 = promisify(cb);

    var promise = _promisify20.promise;
    var callback = _promisify20.callback;

    var self = this;
    self._api.put('simple/within', extend(opts, {
      collection: this.name,
      latitude: latitude,
      longitude: longitude,
      radius: Number(radius)
    }), function (err, res) {
      if (err) callback(err);else callback(null, new ArrayCursor(self._connection, res.body));
    });
    return promise;
  }
});

function DocumentCollection(connection, body) {
  BaseCollection.call(this, connection, body);
}

inherits(DocumentCollection, BaseCollection);

extend(DocumentCollection.prototype, {
  document: function document(documentHandle, cb) {
    var _promisify21 = promisify(cb);

    var promise = _promisify21.promise;
    var callback = _promisify21.callback;

    this._api.get('document/' + this._documentHandle(documentHandle), function (err, res) {
      if (err) callback(err);else callback(null, res.body);
    });
    return promise;
  },
  save: function save(data, cb) {
    var _promisify22 = promisify(cb);

    var promise = _promisify22.promise;
    var callback = _promisify22.callback;

    this._api.post('document/', data, {
      collection: this.name
    }, function (err, res) {
      if (err) callback(err);else callback(null, res.body);
    });
    return promise;
  }
});

function EdgeCollection(connection, body) {
  BaseCollection.call(this, connection, body);
}

inherits(EdgeCollection, BaseCollection);

extend(EdgeCollection.prototype, {
  edge: function edge(documentHandle, cb) {
    var _promisify23 = promisify(cb);

    var promise = _promisify23.promise;
    var callback = _promisify23.callback;

    this._api.get('edge/' + this._documentHandle(documentHandle), function (err, res) {
      if (err) callback(err);else callback(null, res.body);
    });
    return promise;
  },
  save: function save(data, fromId, toId, cb) {
    var _promisify24 = promisify(cb);

    var promise = _promisify24.promise;
    var callback = _promisify24.callback;

    this._api.post('edge/', data, {
      collection: this.name,
      from: this._documentHandle(fromId),
      to: this._documentHandle(toId)
    }, function (err, res) {
      if (err) callback(err);else callback(null, res.body);
    });
    return promise;
  },
  _edges: function _edges(documentHandle, direction, cb) {
    var _promisify25 = promisify(cb);

    var promise = _promisify25.promise;
    var callback = _promisify25.callback;

    this._api.get('edges/' + this.name, {
      vertex: this._documentHandle(documentHandle),
      direction: direction
    }, function (err, res) {
      if (err) callback(err);else callback(null, res.body.edges);
    });
    return promise;
  },
  edges: function edges(vertex, cb) {
    return this._edges(vertex, undefined, cb);
  },
  inEdges: function inEdges(vertex, cb) {
    return this._edges(vertex, 'in', cb);
  },
  outEdges: function outEdges(vertex, cb) {
    return this._edges(vertex, 'out', cb);
  },
  traversal: function traversal(startVertex, opts, cb) {
    if (typeof opts === 'function') {
      cb = opts;
      opts = undefined;
    }

    var _promisify26 = promisify(cb);

    var promise = _promisify26.promise;
    var callback = _promisify26.callback;

    this._api.post('traversal', extend({}, opts, {
      startVertex: startVertex,
      edgeCollection: this.name
    }), function (err, res) {
      if (err) callback(err);else callback(null, res.body.result);
    });
    return promise;
  }
});
},{"./cursor":4,"./util/promisify":10,"extend":18,"util":17}],3:[function(require,module,exports){
'use strict';
var promisify = require('./util/promisify');
var extend = require('extend');
var qs = require('querystring');
var xhr = require('request');
var ArangoError = require('./error');
var Route = require('./route');
var jsonMime = /\/(json|javascript)(\W|$)/;

module.exports = Connection;

function Connection(config) {
  if (typeof config === 'string') {
    config = { url: config };
  }
  this.config = extend({}, Connection.defaults, config);
  if (!this.config.headers) this.config.headers = {};
  if (!this.config.headers['x-arango-version']) {
    this.config.headers['x-arango-version'] = this.config.arangoVersion;
  }
}

Connection.defaults = {
  url: 'http://localhost:8529',
  databaseName: '_system',
  arangoVersion: 20300
};

extend(Connection.prototype, {
  _resolveUrl: function _resolveUrl(opts) {
    var url = this.config.url;
    if (!opts.absolutePath) {
      url += '/_db/' + this.config.databaseName;
      if (opts.basePath) url += '/' + opts.basePath;
    }
    url += opts.path ? (opts.path.charAt(0) === '/' ? '' : '/') + opts.path : '';
    if (opts.qs) url += '?' + (typeof opts.qs === 'string' ? opts.qs : qs.stringify(opts.qs));
    return url;
  },
  route: function route(path) {
    return new Route(this, path);
  },
  request: function request(opts, cb) {
    var _promisify = promisify(cb);

    var promise = _promisify.promise;
    var callback = _promisify.callback;

    if (!opts) opts = {};
    var body = opts.body;
    var headers = { 'content-type': 'text/plain' };

    if (body && typeof body === 'object') {
      if (opts.ld) {
        body = body.map(function (obj) {
          return JSON.stringify(obj);
        }).join('\r\n') + '\r\n';
        headers['content-type'] = 'application/x-ldjson';
      } else {
        body = JSON.stringify(body);
        headers['content-type'] = 'application/json';
      }
    }

    xhr({
      url: this._resolveUrl(opts),
      headers: extend(headers, this.config.headers, opts.headers),
      method: (opts.method || 'get').toUpperCase(),
      body: body
    }, function (err, response, rawBody) {
      response.rawBody = rawBody;
      if (err) callback(err, response);else if (response.headers['content-type'].match(jsonMime)) {
        try {
          response.body = JSON.parse(rawBody);
        } catch (e) {
          return callback(extend(e, { response: response }));
        }
        if (!response.body.error) callback(null, response);else callback(extend(new ArangoError(response.body), { response: response }));
      } else callback(null, extend(response, { body: rawBody }));
    });
    return promise;
  }
});
},{"./error":6,"./route":8,"./util/promisify":10,"extend":18,"querystring":15,"request":19}],4:[function(require,module,exports){
'use strict';
var promisify = require('./util/promisify');
var extend = require('extend');

module.exports = ArrayCursor;

function ArrayCursor(connection, body) {
  this.extra = body.extra;
  this._connection = connection;
  this._api = this._connection.route('_api');
  this._result = body.result;
  this._hasMore = Boolean(body.hasMore);
  this._id = body.id;
  this._index = 0;
}

extend(ArrayCursor.prototype, {
  _drain: function _drain(cb) {
    var _promisify = promisify(cb);

    var promise = _promisify.promise;
    var callback = _promisify.callback;

    var self = this;
    self._more(function (err) {
      if (err) callback(err);else if (!self._hasMore) callback(null, self);else self._drain(cb);
    });
    return promise;
  },
  _more: function _more(callback) {
    var self = this;
    if (!self._hasMore) callback(null, self);else {
      self._api.put('cursor/' + this._id, function (err, res) {
        if (err) callback(err);else {
          self._result.push.apply(self._result, res.body.result);
          self._hasMore = res.body.hasMore;
          callback(null, self);
        }
      });
    }
  },
  all: function all(cb) {
    var _promisify2 = promisify(cb);

    var promise = _promisify2.promise;
    var callback = _promisify2.callback;

    var self = this;
    self._drain(function (err) {
      self._index = self._result.length;
      if (err) callback(err);else callback(null, self._result);
    });
    return promise;
  },
  next: function next(cb) {
    var _promisify3 = promisify(cb);

    var promise = _promisify3.promise;
    var callback = _promisify3.callback;

    var self = this;
    function next() {
      var value = self._result[self._index];
      self._index += 1;
      callback(null, value);
    }
    if (self._index < self._result.length) next();else {
      if (!self._hasMore) callback(null);else {
        self._more(function (err) {
          if (err) callback(err);else next();
        });
      }
    }
    return promise;
  },
  hasNext: function hasNext() {
    return this._hasMore || this._index < this._result.length;
  },
  each: function each(fn, cb) {
    var _promisify4 = promisify(cb);

    var promise = _promisify4.promise;
    var callback = _promisify4.callback;

    var self = this;
    self._drain(function (err) {
      if (err) callback(err);else {
        try {
          var result;
          for (self._index = 0; self._index < self._result.length; self._index++) {
            result = fn(self._result[self._index], self._index, self);
            if (result === false) break;
          }
          callback(null);
        } catch (e) {
          callback(e);
        }
      }
    });
    return promise;
  },
  every: function every(fn, cb) {
    var _promisify5 = promisify(cb);

    var promise = _promisify5.promise;
    var callback = _promisify5.callback;

    var self = this;
    function loop() {
      try {
        var result = true;
        while (self._index < self._result.length) {
          result = fn(self._result[self._index], self._index, self);
          self._index++;
          if (!result) break;
        }
        if (!self._hasMore || !result) callback(null, result);else {
          self._more(function (err) {
            if (err) callback(err);else loop();
          });
        }
      } catch (e) {
        callback(e);
      }
    }
    self._index = 0;
    loop();
    return promise;
  },
  some: function some(fn, cb) {
    var _promisify6 = promisify(cb);

    var promise = _promisify6.promise;
    var callback = _promisify6.callback;

    var self = this;
    function loop() {
      try {
        var result = false;
        while (self._index < self._result.length) {
          result = fn(self._result[self._index], self._index, self);
          self._index++;
          if (result) break;
        }
        if (!self._hasMore || result) callback(null, result);else {
          self._more(function (err) {
            if (err) callback(err);else loop();
          });
        }
      } catch (e) {
        callback(e);
      }
    }
    self._index = 0;
    loop();
    return promise;
  },
  map: function map(fn, cb) {
    var _promisify7 = promisify(cb);

    var promise = _promisify7.promise;
    var callback = _promisify7.callback;

    var self = this,
        result = [];

    function loop(x) {
      try {
        while (self._index < self._result.length) {
          result.push(fn(self._result[self._index], self._index, self));
          self._index++;
        }
        if (!self._hasMore) callback(null, result);else {
          self._more(function (err) {
            if (err) callback(err);else loop();
          });
        }
      } catch (e) {
        callback(e);
      }
    }
    self._index = 0;
    loop();
    return promise;
  },
  reduce: function reduce(fn, accu, cb) {
    if (typeof accu === 'function') {
      cb = accu;
      accu = undefined;
    }

    var _promisify8 = promisify(cb);

    var promise = _promisify8.promise;
    var callback = _promisify8.callback;

    var self = this;
    function loop() {
      try {
        while (self._index < self._result.length) {
          accu = fn(accu, self._result[self._index], self._index, self);
          self._index++;
        }
        if (!self._hasMore) callback(null, accu);else {
          self._more(function (err) {
            if (err) callback(err);else loop();
          });
        }
      } catch (e) {
        callback(e);
      }
    }
    if (accu !== undefined) {
      self._index = 0;
      loop();
    } else if (self._result.length > 1) {
      accu = self._result[0];
      self._index = 1;
      loop();
    } else {
      self._more(function (err) {
        if (err) callback(err);else {
          accu = self._result[0];
          self._index = 1;
          loop();
        }
      });
    }
    return promise;
  },
  rewind: function rewind() {
    this._index = 0;
    return this;
  }
});
},{"./util/promisify":10,"extend":18}],5:[function(require,module,exports){
'use strict';
var promisify = require('./util/promisify');
var extend = require('extend');
var Connection = require('./connection');
var ArrayCursor = require('./cursor');
var createCollection = require('./collection');
var Graph = require('./graph');
var all = require('./util/all');

module.exports = Database;

function Database(config) {
  if (!(this instanceof Database)) {
    return new Database(config);
  }
  this._connection = new Connection(config);
  this._api = this._connection.route('_api');
  this.name = this._connection.config.databaseName;
}

extend(Database.prototype, {
  route: function route(path, headers) {
    return this._connection.route(path, headers);
  },
  createCollection: (function (_createCollection) {
    function createCollection(_x, _x2) {
      return _createCollection.apply(this, arguments);
    }

    createCollection.toString = function () {
      return _createCollection.toString();
    };

    return createCollection;
  })(function (properties, cb) {
    var _promisify = promisify(cb);

    var promise = _promisify.promise;
    var callback = _promisify.callback;

    if (typeof properties === 'string') {
      properties = { name: properties };
    }
    var self = this;
    self._api.post('collection', extend({
      type: 2
    }, properties), function (err, res) {
      if (err) callback(err);else callback(null, createCollection(self._connection, res.body));
    });
    return promise;
  }),
  createEdgeCollection: function createEdgeCollection(properties, cb) {
    var _promisify2 = promisify(cb);

    var promise = _promisify2.promise;
    var callback = _promisify2.callback;

    if (typeof properties === 'string') {
      properties = { name: properties };
    }
    var self = this;
    self._api.post('collection', extend({}, properties, { type: 3 }), function (err, res) {
      if (err) callback(err);else callback(null, createCollection(self._connection, res.body));
    });
    return promise;
  },
  collection: function collection(collectionName, autoCreate, cb) {
    if (typeof autoCreate === 'function') {
      cb = autoCreate;
      autoCreate = undefined;
    }

    var _promisify3 = promisify(cb);

    var promise = _promisify3.promise;
    var callback = _promisify3.callback;

    var self = this;
    self._api.get('collection/' + collectionName, function (err, res) {
      if (err) {
        if (!autoCreate || err.name !== 'ArangoError' || err.errorNum !== 1203) callback(err);else self.createCollection({ name: collectionName }, cb);
      } else callback(null, createCollection(self._connection, res.body));
    });
    return promise;
  },
  collections: function collections(cb) {
    var _promisify4 = promisify(cb);

    var promise = _promisify4.promise;
    var callback = _promisify4.callback;

    var self = this;
    self._api.get('collection', {
      excludeSystem: true
    }, function (err, res) {
      if (err) callback(err);else {
        callback(null, res.body.collections.map(function (data) {
          return createCollection(self._connection, data);
        }));
      }
    });
    return promise;
  },
  allCollections: function allCollections(cb) {
    var _promisify5 = promisify(cb);

    var promise = _promisify5.promise;
    var callback = _promisify5.callback;

    var self = this;
    self._api.get('collection', {
      excludeSystem: false
    }, function (err, res) {
      if (err) callback(err);else {
        callback(null, res.body.collections.map(function (data) {
          return createCollection(self._connection, data);
        }));
      }
    });
    return promise;
  },
  dropCollection: function dropCollection(collectionName, cb) {
    var _promisify6 = promisify(cb);

    var promise = _promisify6.promise;
    var callback = _promisify6.callback;

    var self = this;
    self._api['delete']('collection/' + collectionName, function (err, res) {
      if (err) callback(err);else callback(null);
    });
    return promise;
  },
  createGraph: function createGraph(properties, cb) {
    var _promisify7 = promisify(cb);

    var promise = _promisify7.promise;
    var callback = _promisify7.callback;

    var self = this;
    self._api.post('gharial', properties, function (err, res) {
      if (err) callback(err);else callback(null, new Graph(self._connection, res.body.graph));
    });
    return promise;
  },
  graph: function graph(graphName, autoCreate, cb) {
    if (typeof autoCreate === 'function') {
      cb = autoCreate;
      autoCreate = undefined;
    }

    var _promisify8 = promisify(cb);

    var promise = _promisify8.promise;
    var callback = _promisify8.callback;

    var self = this;
    self._api.get('gharial/' + graphName, function (err, res) {
      if (err) {
        if (!autoCreate || err.name !== 'ArangoError' || err.errorNum !== 1924) callback(err);else self.createGraph({ name: graphName }, cb);
      } else callback(null, new Graph(self._connection, res.body.graph));
    });
    return promise;
  },
  graphs: function graphs(cb) {
    var _promisify9 = promisify(cb);

    var promise = _promisify9.promise;
    var callback = _promisify9.callback;

    var self = this;
    self._api.get('gharial', function (err, res) {
      if (err) callback(err);else {
        callback(null, res.body.graphs.map(function (graph) {
          return new Graph(self._connection, graph);
        }));
      }
    });
    return promise;
  },
  dropGraph: function dropGraph(graphName, dropCollections, cb) {
    if (typeof dropCollections === 'function') {
      cb = dropCollections;
      dropCollections = undefined;
    }
    return this._api['delete']('graph/' + graphName, { dropCollections: dropCollections }, cb);
  },
  createDatabase: function createDatabase(databaseName, cb) {
    var _promisify10 = promisify(cb);

    var promise = _promisify10.promise;
    var callback = _promisify10.callback;

    var self = this;
    self._api.post('database', { name: databaseName }, function (err, res) {
      if (err) callback(err);else {
        callback(null, new Database(extend({}, self._connection.config, { databaseName: databaseName })));
      }
    });
    return promise;
  },
  database: function database(databaseName, autoCreate, cb) {
    if (typeof autoCreate === 'function') {
      cb = autoCreate;
      autoCreate = undefined;
    }

    var _promisify11 = promisify(cb);

    var promise = _promisify11.promise;
    var callback = _promisify11.callback;

    var self = this;
    self._connection.request({
      method: 'get',
      path: '/_db/' + databaseName + '/_api/database/current',
      absolutePath: true
    }, function (err, res) {
      if (err) {
        if (!autoCreate || err.name !== 'ArangoError' || err.errorNum !== 1228) callback(err);else self.createDatabase(databaseName, cb);
      } else {
        callback(null, new Database(extend({}, self._connection.config, { databaseName: databaseName })));
      }
    });
    return promise;
  },
  databases: function databases(cb) {
    var _promisify12 = promisify(cb);

    var promise = _promisify12.promise;
    var callback = _promisify12.callback;

    var self = this;
    self._api.get('database', function (err, res) {
      if (err) callback(err);else {
        callback(null, res.body.result.map(function (databaseName) {
          return new Database(extend({}, self._connection.config, { databaseName: databaseName }));
        }));
      }
    });
    return promise;
  },
  dropDatabase: function dropDatabase(databaseName, cb) {
    var _promisify13 = promisify(cb);

    var promise = _promisify13.promise;
    var callback = _promisify13.callback;

    var self = this;
    self._api['delete']('database/' + databaseName, function (err, res) {
      if (err) callback(err);else callback(null);
    });
    return promise;
  },
  truncate: function truncate(cb) {
    var _promisify14 = promisify(cb);

    var promise = _promisify14.promise;
    var callback = _promisify14.callback;

    var self = this;
    self._api.get('collection', {
      excludeSystem: true
    }, function (err, res) {
      if (err) callback(err);else {
        all(res.body.collections.map(function (data) {
          return function (cb) {
            self._api.put('collection/' + data.name + '/truncate', function (err, res) {
              if (err) cb(err);else cb(null, res.body);
            });
          };
        }), cb);
      }
    });
    return promise;
  },
  truncateAll: function truncateAll(cb) {
    var _promisify15 = promisify(cb);

    var promise = _promisify15.promise;
    var callback = _promisify15.callback;

    var self = this;
    self._api.get('collection', {
      excludeSystem: false
    }, function (err, res) {
      if (err) callback(err);else {
        all(res.body.collections.map(function (data) {
          return function (cb) {
            self._api.put('collection/' + data.name + '/truncate', function (err, res) {
              if (err) cb(err);else cb(null, res.body);
            });
          };
        }), cb);
      }
    });
    return promise;
  },
  transaction: function transaction(collections, action, params, lockTimeout, cb) {
    if (typeof lockTimeout === 'function') {
      cb = lockTimeout;
      lockTimeout = undefined;
    }
    if (typeof params === 'function') {
      cb = params;
      params = undefined;
    }
    if (typeof params === 'number') {
      lockTimeout = params;
      params = undefined;
    }
    if (typeof collections === 'string' || Array.isArray(collections)) {
      collections = { write: collections };
    }

    var _promisify16 = promisify(cb);

    var promise = _promisify16.promise;
    var callback = _promisify16.callback;

    this._api.post('transaction', {
      collections: collections,
      action: action,
      params: params,
      lockTimeout: lockTimeout
    }, function (err, res) {
      if (err) callback(err);else callback(null, res.body.result);
    });
    return promise;
  },
  query: (function (_query) {
    function query(_x3, _x4, _x5) {
      return _query.apply(this, arguments);
    }

    query.toString = function () {
      return _query.toString();
    };

    return query;
  })(function (query, bindVars, cb) {
    if (typeof bindVars === 'function') {
      cb = bindVars;
      bindVars = undefined;
    }

    var _promisify17 = promisify(cb);

    var promise = _promisify17.promise;
    var callback = _promisify17.callback;

    if (query && typeof query.toAQL === 'function') {
      query = query.toAQL();
    }
    var self = this;
    self._api.post('cursor', {
      query: query,
      bindVars: bindVars
    }, function (err, res) {
      if (err) callback(err);else callback(null, new ArrayCursor(self._connection, res.body));
    });
    return promise;
  }),
  functions: function functions(cb) {
    var _promisify18 = promisify(cb);

    var promise = _promisify18.promise;
    var callback = _promisify18.callback;

    this._api.get('aqlfunction', function (err, res) {
      if (err) callback(err);else callback(null, res.body);
    });
    return promise;
  },
  createFunction: function createFunction(name, code, cb) {
    var _promisify19 = promisify(cb);

    var promise = _promisify19.promise;
    var callback = _promisify19.callback;

    this._api.post('aqlfunction', {
      name: name,
      code: code
    }, function (err, res) {
      if (err) callback(err);else callback(null, res.body);
    });
    return promise;
  },
  dropFunction: function dropFunction(name, group, cb) {
    if (typeof group === 'function') {
      cb = group;
      group = undefined;
    }

    var _promisify20 = promisify(cb);

    var promise = _promisify20.promise;
    var callback = _promisify20.callback;

    this._api['delete']('aqlfunction/' + name, {
      group: Boolean(group)
    }, function (err, res) {
      if (err) callback(err);else callback(null, res.body);
    });
    return promise;
  }
});
},{"./collection":2,"./connection":3,"./cursor":4,"./graph":7,"./util/all":9,"./util/promisify":10,"extend":18}],6:[function(require,module,exports){
'use strict';
var inherits = require('util').inherits;

module.exports = ArangoError;

function ArangoError(obj) {
  this.message = obj.errorMessage;
  this.errorNum = obj.errorNum;
  this.code = obj.code;
  var err = new Error(this.message);
  err.name = this.name;
  if (err.fileName) this.fileName = err.fileName;
  if (err.lineNumber) this.lineNumber = err.lineNumber;
  if (err.columnNumber) this.columnNumber = err.columnNumber;
  if (err.stack) this.stack = err.stack;
  if (err.description) this.description = err.description;
  if (err.number) this.number = err.number;
}

inherits(ArangoError, Error);
ArangoError.prototype.name = 'ArangoError';
},{"util":17}],7:[function(require,module,exports){
'use strict';
var promisify = require('./util/promisify');
var extend = require('extend');
var inherits = require('util').inherits;
var BaseCollection = require('./collection')._BaseCollection;

module.exports = Graph;

function Graph(connection, body) {
  this._connection = connection;
  this._api = this._connection.route('_api');
  extend(this, body);
  this._gharial = this._api.route('gharial/' + this.name);
}

Graph.VertexCollection = VertexCollection;
Graph.EdgeCollection = EdgeCollection;

extend(Graph.prototype, {
  drop: function drop(dropCollections, cb) {
    if (typeof dropCollections === 'function') {
      cb = dropCollections;
      dropCollections = undefined;
    }

    var _promisify = promisify(cb);

    var promise = _promisify.promise;
    var callback = _promisify.callback;

    this._gharial['delete']({
      dropCollections: dropCollections
    }, function (err, res) {
      if (err) callback(err);else callback(null, res.body);
    });
    return promise;
  },
  vertexCollection: function vertexCollection(collectionName, cb) {
    var _promisify2 = promisify(cb);

    var promise = _promisify2.promise;
    var callback = _promisify2.callback;

    var self = this;
    self._api.get('collection/' + collectionName, function (err, res) {
      if (err) callback(err);else callback(null, new VertexCollection(self._connection, res.body, self));
    });
    return promise;
  },
  addVertexCollection: function addVertexCollection(collectionName, cb) {
    var _promisify3 = promisify(cb);

    var promise = _promisify3.promise;
    var callback = _promisify3.callback;

    this._gharial.post('vertex', { collection: collectionName }, function (err, res) {
      if (err) callback(err);else callback(null, res.body);
    });
    return promise;
  },
  removeVertexCollection: function removeVertexCollection(collectionName, dropCollection, cb) {
    if (typeof dropCollection === 'function') {
      cb = dropCollection;
      dropCollection = undefined;
    }

    var _promisify4 = promisify(cb);

    var promise = _promisify4.promise;
    var callback = _promisify4.callback;

    this._gharial['delete']('vertex/' + collectionName, { dropCollection: dropCollection }, function (err, res) {
      if (err) callback(err);else callback(null, res.body);
    });
    return promise;
  },
  edgeCollection: function edgeCollection(collectionName, cb) {
    var _promisify5 = promisify(cb);

    var promise = _promisify5.promise;
    var callback = _promisify5.callback;

    var self = this;
    self._api.get('collection/' + collectionName, function (err, res) {
      if (err) callback(err);else callback(null, new EdgeCollection(self._connection, res.body, self));
    });
    return promise;
  },
  addEdgeDefinition: function addEdgeDefinition(definition, cb) {
    var _promisify6 = promisify(cb);

    var promise = _promisify6.promise;
    var callback = _promisify6.callback;

    this._gharial.post('edge', definition, function (err, res) {
      if (err) callback(err);else callback(null, res.body);
    });
    return promise;
  },
  replaceEdgeDefinition: function replaceEdgeDefinition(definitionName, definition, cb) {
    var _promisify7 = promisify(cb);

    var promise = _promisify7.promise;
    var callback = _promisify7.callback;

    this._api.put('gharial/' + this.name + '/edge/' + definitionName, definition, function (err, res) {
      if (err) callback(err);else callback(null, res.body);
    });
    return promise;
  },
  removeEdgeDefinition: function removeEdgeDefinition(definitionName, dropCollection, cb) {
    if (typeof dropCollection === 'function') {
      cb = dropCollection;
      dropCollection = undefined;
    }

    var _promisify8 = promisify(cb);

    var promise = _promisify8.promise;
    var callback = _promisify8.callback;

    this._gharial['delete']('edge/' + definitionName, { dropCollection: dropCollection }, function (err, res) {
      if (err) callback(err);else callback(null, res.body);
    });
    return promise;
  },
  traversal: function traversal(startVertex, opts, cb) {
    if (typeof opts === 'function') {
      cb = opts;
      opts = undefined;
    }

    var _promisify9 = promisify(cb);

    var promise = _promisify9.promise;
    var callback = _promisify9.callback;

    this._api.post('traversal', extend({}, opts, {
      startVertex: startVertex,
      graphName: this.name
    }), function (err, res) {
      if (err) callback(err);else callback(null, res.body.result);
    });
    return promise;
  }
});

function VertexCollection(connection, body, graph) {
  this.graph = graph;
  BaseCollection.call(this, connection, body);
  this._gharial = this._api.route('gharial/' + this.graph.name + '/vertex/' + this.name);
}
inherits(VertexCollection, BaseCollection);

extend(VertexCollection.prototype, {
  vertex: function vertex(documentHandle, cb) {
    var _promisify10 = promisify(cb);

    var promise = _promisify10.promise;
    var callback = _promisify10.callback;

    this._gharial.get(documentHandle, function (err, res) {
      if (err) callback(err);else callback(null, res.body);
    });
    return promise;
  },
  save: function save(data, cb) {
    var _promisify11 = promisify(cb);

    var promise = _promisify11.promise;
    var callback = _promisify11.callback;

    this._gharial.post(data, {
      collection: this.name
    }, function (err, res) {
      if (err) callback(err);else callback(null, res.body);
    });
    return promise;
  }
});

function EdgeCollection(connection, body, graph) {
  this.graph = graph;
  BaseCollection.call(this, connection, body);
  this._gharial = this._api.route('gharial/' + this.graph.name + '/edge/' + this.name);
}
inherits(EdgeCollection, BaseCollection);

extend(EdgeCollection.prototype, {
  edge: function edge(documentHandle, cb) {
    var _promisify12 = promisify(cb);

    var promise = _promisify12.promise;
    var callback = _promisify12.callback;

    this._gharial.get(documentHandle, function (err, res) {
      if (err) callback(err);else callback(null, res.body);
    });
    return promise;
  },
  save: function save(data, fromId, toId, cb) {
    if (typeof fromId === 'function') {
      cb = fromId;
      fromId = undefined;
    } else {
      data._from = this._documentHandle(fromId);
      data._to = this._documentHandle(toId);
    }

    var _promisify13 = promisify(cb);

    var promise = _promisify13.promise;
    var callback = _promisify13.callback;

    this._gharial.post(data, function (err, res) {
      if (err) callback(err);else callback(null, res.body);
    });
    return promise;
  }
});
},{"./collection":2,"./util/promisify":10,"extend":18,"util":17}],8:[function(require,module,exports){
'use strict';
var extend = require('extend');

module.exports = Route;

function Route(connection, path, headers) {
  this._connection = connection;
  this._path = path || '';
  this._headers = headers;
}

extend(Route.prototype, {
  route: function route(path, headers) {
    if (!path) path = '';else if (path.charAt(0) !== '/') path = '/' + path;
    return new Route(this._connection, this._path + path, extend({}, this._headers, headers));
  },
  request: function request(opts, callback) {
    opts = extend({}, opts);
    opts.basePath = this._path;
    opts.headers = extend({}, this._headers, opts.headers);
    return this._connection.request(opts, callback);
  },
  get: function get(path, qs, callback) {
    if (typeof path !== 'string') {
      callback = qs;
      qs = path;
      path = undefined;
    }
    if (typeof qs === 'function') {
      callback = qs;
      qs = undefined;
    }
    if (!path) path = '';else if (this._path && path.charAt(0) !== '/') path = '/' + path;
    return this.request({
      method: 'get',
      path: path,
      qs: qs
    }, callback);
  },
  post: function post(path, body, qs, callback) {
    if (typeof path !== 'string') {
      callback = qs;
      qs = body;
      body = path;
      path = undefined;
    }
    if (typeof qs === 'function') {
      callback = qs;
      qs = undefined;
    }
    if (typeof body === 'function') {
      callback = body;
      body = undefined;
    }
    if (!path) path = '';else if (this._path && path.charAt(0) !== '/') path = '/' + path;
    return this.request({
      method: 'post',
      path: path,
      body: body,
      qs: qs
    }, callback);
  },
  put: function put(path, body, qs, callback) {
    if (typeof path !== 'string') {
      callback = body;
      body = qs;
      qs = path;
      path = undefined;
    }
    if (typeof qs === 'function') {
      callback = qs;
      qs = undefined;
    }
    if (typeof body === 'function') {
      callback = body;
      body = undefined;
    }
    if (!path) path = '';else if (this._path && path.charAt(0) !== '/') path = '/' + path;
    return this.request({
      method: 'put',
      path: path,
      body: body,
      qs: qs
    }, callback);
  },
  patch: function patch(path, body, qs, callback) {
    if (typeof path !== 'string') {
      callback = body;
      body = qs;
      qs = path;
      path = undefined;
    }
    if (typeof qs === 'function') {
      callback = qs;
      qs = undefined;
    }
    if (typeof body === 'function') {
      callback = body;
      body = undefined;
    }
    if (!path) path = '';else if (this._path && path.charAt(0) !== '/') path = '/' + path;
    return this.request({
      method: 'patch',
      path: path,
      body: body,
      qs: qs
    }, callback);
  },
  'delete': function _delete(path, qs, callback) {
    if (typeof path !== 'string') {
      callback = qs;
      qs = path;
      path = undefined;
    }
    if (typeof qs === 'function') {
      callback = qs;
      qs = undefined;
    }
    if (!path) path = '';else if (this._path && path.charAt(0) !== '/') path = '/' + path;
    return this.request({
      method: 'delete',
      path: path,
      qs: qs
    }, callback);
  },
  head: function head(path, qs, callback) {
    if (typeof path !== 'string') {
      callback = qs;
      qs = path;
      path = undefined;
    }
    if (typeof qs === 'function') {
      callback = qs;
      qs = undefined;
    }
    if (!path) path = '';else if (this._path && path.charAt(0) !== '/') path = '/' + path;
    return this.request({
      method: 'head',
      path: path,
      qs: qs
    }, callback);
  }
});
},{"extend":18}],9:[function(require,module,exports){
'use strict';
module.exports = function all(arr, callback) {
  var result = [];
  var pending = arr.length;
  var called = false;

  if (arr.length === 0) {
    return callback(null, result);
  }function step(i) {
    return function (err, res) {
      pending -= 1;
      if (!err) result[i] = res;
      if (!called) {
        if (err) callback(err);else if (pending === 0) callback(null, result);else return;
        called = true;
      }
    };
  }

  arr.forEach(function (fn, i) {
    fn(step(i));
  });
};
},{}],10:[function(require,module,exports){
'use strict';
module.exports = function promisify(callback) {
  if (typeof Promise !== 'function') {
    return { callback: callback || function () {} };
  }
  var cb = callback;
  var promise = new Promise(function (resolve, reject) {
    callback = function (err, res) {
      if (err) reject(err);else resolve(res);
      if (cb) cb(err, res);
    };
  });
  return { callback: callback, promise: promise };
};
},{}],11:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],12:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canMutationObserver = typeof window !== 'undefined'
    && window.MutationObserver;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    var queue = [];

    if (canMutationObserver) {
        var hiddenDiv = document.createElement("div");
        var observer = new MutationObserver(function () {
            var queueList = queue.slice();
            queue.length = 0;
            queueList.forEach(function (fn) {
                fn();
            });
        });

        observer.observe(hiddenDiv, { attributes: true });

        return function nextTick(fn) {
            if (!queue.length) {
                hiddenDiv.setAttribute('yes', 'no');
            }
            queue.push(fn);
        };
    }

    if (canPost) {
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],13:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],14:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],15:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":13,"./encode":14}],16:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],17:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":16,"_process":12,"inherits":11}],18:[function(require,module,exports){
var hasOwn = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;
var undefined;

var isPlainObject = function isPlainObject(obj) {
	'use strict';
	if (!obj || toString.call(obj) !== '[object Object]') {
		return false;
	}

	var has_own_constructor = hasOwn.call(obj, 'constructor');
	var has_is_property_of_method = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
	// Not own constructor property must be Object
	if (obj.constructor && !has_own_constructor && !has_is_property_of_method) {
		return false;
	}

	// Own properties are enumerated firstly, so to speed up,
	// if last one is own, then all properties are own.
	var key;
	for (key in obj) {}

	return key === undefined || hasOwn.call(obj, key);
};

module.exports = function extend() {
	'use strict';
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[0],
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if (typeof target === 'boolean') {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	} else if ((typeof target !== 'object' && typeof target !== 'function') || target == null) {
		target = {};
	}

	for (; i < length; ++i) {
		options = arguments[i];
		// Only deal with non-null/undefined values
		if (options != null) {
			// Extend the base object
			for (name in options) {
				src = target[name];
				copy = options[name];

				// Prevent never-ending loop
				if (target === copy) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if (deep && copy && (isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))) {
					if (copyIsArray) {
						copyIsArray = false;
						clone = src && Array.isArray(src) ? src : [];
					} else {
						clone = src && isPlainObject(src) ? src : {};
					}

					// Never move original objects, clone them
					target[name] = extend(deep, clone, copy);

				// Don't bring in undefined values
				} else if (copy !== undefined) {
					target[name] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};


},{}],19:[function(require,module,exports){
"use strict";
var window = require("global/window")
var once = require("once")
var parseHeaders = require("parse-headers")


var XHR = window.XMLHttpRequest || noop
var XDR = "withCredentials" in (new XHR()) ? XHR : window.XDomainRequest

module.exports = createXHR

function createXHR(options, callback) {
    function readystatechange() {
        if (xhr.readyState === 4) {
            loadFunc()
        }
    }

    function getBody() {
        // Chrome with requestType=blob throws errors arround when even testing access to responseText
        var body = undefined

        if (xhr.response) {
            body = xhr.response
        } else if (xhr.responseType === "text" || !xhr.responseType) {
            body = xhr.responseText || xhr.responseXML
        }

        if (isJson) {
            try {
                body = JSON.parse(body)
            } catch (e) {}
        }

        return body
    }
    
    var failureResponse = {
                body: undefined,
                headers: {},
                statusCode: 0,
                method: method,
                url: uri,
                rawRequest: xhr
            }
    
    function errorFunc(evt) {
        clearTimeout(timeoutTimer)
        if(!(evt instanceof Error)){
            evt = new Error("" + (evt || "unknown") )
        }
        evt.statusCode = 0
        callback(evt, failureResponse)
    }

    // will load the data & process the response in a special response object
    function loadFunc() {
        clearTimeout(timeoutTimer)
        
        var status = (xhr.status === 1223 ? 204 : xhr.status)
        var response = failureResponse
        var err = null
        
        if (status !== 0){
            response = {
                body: getBody(),
                statusCode: status,
                method: method,
                headers: {},
                url: uri,
                rawRequest: xhr
            }
            if(xhr.getAllResponseHeaders){ //remember xhr can in fact be XDR for CORS in IE
                response.headers = parseHeaders(xhr.getAllResponseHeaders())
            }
        } else {
            err = new Error("Internal XMLHttpRequest Error")
        }
        callback(err, response, response.body)
        
    }
    
    if (typeof options === "string") {
        options = { uri: options }
    }

    options = options || {}
    if(typeof callback === "undefined"){
        throw new Error("callback argument missing")
    }
    callback = once(callback)

    var xhr = options.xhr || null

    if (!xhr) {
        if (options.cors || options.useXDR) {
            xhr = new XDR()
        }else{
            xhr = new XHR()
        }
    }

    var key
    var uri = xhr.url = options.uri || options.url
    var method = xhr.method = options.method || "GET"
    var body = options.body || options.data
    var headers = xhr.headers = options.headers || {}
    var sync = !!options.sync
    var isJson = false
    var timeoutTimer

    if ("json" in options) {
        isJson = true
        headers["Accept"] || (headers["Accept"] = "application/json") //Don't override existing accept header declared by user
        if (method !== "GET" && method !== "HEAD") {
            headers["Content-Type"] = "application/json"
            body = JSON.stringify(options.json)
        }
    }

    xhr.onreadystatechange = readystatechange
    xhr.onload = loadFunc
    xhr.onerror = errorFunc
    // IE9 must have onprogress be set to a unique function.
    xhr.onprogress = function () {
        // IE must die
    }
    xhr.ontimeout = errorFunc
    xhr.open(method, uri, !sync)
    //has to be after open
    xhr.withCredentials = !!options.withCredentials
    
    // Cannot set timeout with sync request
    // not setting timeout on the xhr object, because of old webkits etc. not handling that correctly
    // both npm's request and jquery 1.x use this kind of timeout, so this is being consistent
    if (!sync && options.timeout > 0 ) {
        timeoutTimer = setTimeout(function(){
            xhr.abort("timeout");
        }, options.timeout+2 );
    }

    if (xhr.setRequestHeader) {
        for(key in headers){
            if(headers.hasOwnProperty(key)){
                xhr.setRequestHeader(key, headers[key])
            }
        }
    } else if (options.headers) {
        throw new Error("Headers cannot be set on an XDomainRequest object")
    }

    if ("responseType" in options) {
        xhr.responseType = options.responseType
    }
    
    if ("beforeSend" in options && 
        typeof options.beforeSend === "function"
    ) {
        options.beforeSend(xhr)
    }

    xhr.send(body)

    return xhr


}


function noop() {}

},{"global/window":20,"once":21,"parse-headers":25}],20:[function(require,module,exports){
(function (global){
if (typeof window !== "undefined") {
    module.exports = window;
} else if (typeof global !== "undefined") {
    module.exports = global;
} else if (typeof self !== "undefined"){
    module.exports = self;
} else {
    module.exports = {};
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],21:[function(require,module,exports){
module.exports = once

once.proto = once(function () {
  Object.defineProperty(Function.prototype, 'once', {
    value: function () {
      return once(this)
    },
    configurable: true
  })
})

function once (fn) {
  var called = false
  return function () {
    if (called) return
    called = true
    return fn.apply(this, arguments)
  }
}

},{}],22:[function(require,module,exports){
var isFunction = require('is-function')

module.exports = forEach

var toString = Object.prototype.toString
var hasOwnProperty = Object.prototype.hasOwnProperty

function forEach(list, iterator, context) {
    if (!isFunction(iterator)) {
        throw new TypeError('iterator must be a function')
    }

    if (arguments.length < 3) {
        context = this
    }
    
    if (toString.call(list) === '[object Array]')
        forEachArray(list, iterator, context)
    else if (typeof list === 'string')
        forEachString(list, iterator, context)
    else
        forEachObject(list, iterator, context)
}

function forEachArray(array, iterator, context) {
    for (var i = 0, len = array.length; i < len; i++) {
        if (hasOwnProperty.call(array, i)) {
            iterator.call(context, array[i], i, array)
        }
    }
}

function forEachString(string, iterator, context) {
    for (var i = 0, len = string.length; i < len; i++) {
        // no such thing as a sparse string.
        iterator.call(context, string.charAt(i), i, string)
    }
}

function forEachObject(object, iterator, context) {
    for (var k in object) {
        if (hasOwnProperty.call(object, k)) {
            iterator.call(context, object[k], k, object)
        }
    }
}

},{"is-function":23}],23:[function(require,module,exports){
module.exports = isFunction

var toString = Object.prototype.toString

function isFunction (fn) {
  var string = toString.call(fn)
  return string === '[object Function]' ||
    (typeof fn === 'function' && string !== '[object RegExp]') ||
    (typeof window !== 'undefined' &&
     // IE8 and below
     (fn === window.setTimeout ||
      fn === window.alert ||
      fn === window.confirm ||
      fn === window.prompt))
};

},{}],24:[function(require,module,exports){

exports = module.exports = trim;

function trim(str){
  return str.replace(/^\s*|\s*$/g, '');
}

exports.left = function(str){
  return str.replace(/^\s*/, '');
};

exports.right = function(str){
  return str.replace(/\s*$/, '');
};

},{}],25:[function(require,module,exports){
var trim = require('trim')
  , forEach = require('for-each')
  , isArray = function(arg) {
      return Object.prototype.toString.call(arg) === '[object Array]';
    }

module.exports = function (headers) {
  if (!headers)
    return {}

  var result = {}

  forEach(
      trim(headers).split('\n')
    , function (row) {
        var index = row.indexOf(':')
          , key = trim(row.slice(0, index)).toLowerCase()
          , value = trim(row.slice(index + 1))

        if (typeof(result[key]) === 'undefined') {
          result[key] = value
        } else if (isArray(result[key])) {
          result[key].push(value)
        } else {
          result[key] = [ result[key], value ]
        }
      }
  )

  return result
}
},{"for-each":22,"trim":24}]},{},[1])(1)
});