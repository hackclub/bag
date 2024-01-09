var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined")
    return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// ../node_modules/dotenv/package.json
var require_package = __commonJS({
  "../node_modules/dotenv/package.json"(exports, module) {
    module.exports = {
      name: "dotenv",
      version: "16.3.1",
      description: "Loads environment variables from .env file",
      main: "lib/main.js",
      types: "lib/main.d.ts",
      exports: {
        ".": {
          types: "./lib/main.d.ts",
          require: "./lib/main.js",
          default: "./lib/main.js"
        },
        "./config": "./config.js",
        "./config.js": "./config.js",
        "./lib/env-options": "./lib/env-options.js",
        "./lib/env-options.js": "./lib/env-options.js",
        "./lib/cli-options": "./lib/cli-options.js",
        "./lib/cli-options.js": "./lib/cli-options.js",
        "./package.json": "./package.json"
      },
      scripts: {
        "dts-check": "tsc --project tests/types/tsconfig.json",
        lint: "standard",
        "lint-readme": "standard-markdown",
        pretest: "npm run lint && npm run dts-check",
        test: "tap tests/*.js --100 -Rspec",
        prerelease: "npm test",
        release: "standard-version"
      },
      repository: {
        type: "git",
        url: "git://github.com/motdotla/dotenv.git"
      },
      funding: "https://github.com/motdotla/dotenv?sponsor=1",
      keywords: [
        "dotenv",
        "env",
        ".env",
        "environment",
        "variables",
        "config",
        "settings"
      ],
      readmeFilename: "README.md",
      license: "BSD-2-Clause",
      devDependencies: {
        "@definitelytyped/dtslint": "^0.0.133",
        "@types/node": "^18.11.3",
        decache: "^4.6.1",
        sinon: "^14.0.1",
        standard: "^17.0.0",
        "standard-markdown": "^7.1.0",
        "standard-version": "^9.5.0",
        tap: "^16.3.0",
        tar: "^6.1.11",
        typescript: "^4.8.4"
      },
      engines: {
        node: ">=12"
      },
      browser: {
        fs: false
      }
    };
  }
});

// ../node_modules/dotenv/lib/main.js
var require_main = __commonJS({
  "../node_modules/dotenv/lib/main.js"(exports, module) {
    "use strict";
    var fs = __require("fs");
    var path = __require("path");
    var os = __require("os");
    var crypto = __require("crypto");
    var packageJson = require_package();
    var version = packageJson.version;
    var LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;
    function parse(src) {
      const obj = {};
      let lines = src.toString();
      lines = lines.replace(/\r\n?/mg, "\n");
      let match;
      while ((match = LINE.exec(lines)) != null) {
        const key = match[1];
        let value = match[2] || "";
        value = value.trim();
        const maybeQuote = value[0];
        value = value.replace(/^(['"`])([\s\S]*)\1$/mg, "$2");
        if (maybeQuote === '"') {
          value = value.replace(/\\n/g, "\n");
          value = value.replace(/\\r/g, "\r");
        }
        obj[key] = value;
      }
      return obj;
    }
    function _parseVault(options) {
      const vaultPath = _vaultPath(options);
      const result = DotenvModule.configDotenv({ path: vaultPath });
      if (!result.parsed) {
        throw new Error(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`);
      }
      const keys = _dotenvKey(options).split(",");
      const length = keys.length;
      let decrypted;
      for (let i = 0; i < length; i++) {
        try {
          const key = keys[i].trim();
          const attrs = _instructions(result, key);
          decrypted = DotenvModule.decrypt(attrs.ciphertext, attrs.key);
          break;
        } catch (error) {
          if (i + 1 >= length) {
            throw error;
          }
        }
      }
      return DotenvModule.parse(decrypted);
    }
    function _log(message) {
      console.log(`[dotenv@${version}][INFO] ${message}`);
    }
    function _warn(message) {
      console.log(`[dotenv@${version}][WARN] ${message}`);
    }
    function _debug(message) {
      console.log(`[dotenv@${version}][DEBUG] ${message}`);
    }
    function _dotenvKey(options) {
      if (options && options.DOTENV_KEY && options.DOTENV_KEY.length > 0) {
        return options.DOTENV_KEY;
      }
      if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
        return process.env.DOTENV_KEY;
      }
      return "";
    }
    function _instructions(result, dotenvKey) {
      let uri;
      try {
        uri = new URL(dotenvKey);
      } catch (error) {
        if (error.code === "ERR_INVALID_URL") {
          throw new Error("INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenv.org/vault/.env.vault?environment=development");
        }
        throw error;
      }
      const key = uri.password;
      if (!key) {
        throw new Error("INVALID_DOTENV_KEY: Missing key part");
      }
      const environment = uri.searchParams.get("environment");
      if (!environment) {
        throw new Error("INVALID_DOTENV_KEY: Missing environment part");
      }
      const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`;
      const ciphertext = result.parsed[environmentKey];
      if (!ciphertext) {
        throw new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`);
      }
      return { ciphertext, key };
    }
    function _vaultPath(options) {
      let dotenvPath = path.resolve(process.cwd(), ".env");
      if (options && options.path && options.path.length > 0) {
        dotenvPath = options.path;
      }
      return dotenvPath.endsWith(".vault") ? dotenvPath : `${dotenvPath}.vault`;
    }
    function _resolveHome(envPath) {
      return envPath[0] === "~" ? path.join(os.homedir(), envPath.slice(1)) : envPath;
    }
    function _configVault(options) {
      _log("Loading env from encrypted .env.vault");
      const parsed = DotenvModule._parseVault(options);
      let processEnv = process.env;
      if (options && options.processEnv != null) {
        processEnv = options.processEnv;
      }
      DotenvModule.populate(processEnv, parsed, options);
      return { parsed };
    }
    function configDotenv(options) {
      let dotenvPath = path.resolve(process.cwd(), ".env");
      let encoding = "utf8";
      const debug = Boolean(options && options.debug);
      if (options) {
        if (options.path != null) {
          dotenvPath = _resolveHome(options.path);
        }
        if (options.encoding != null) {
          encoding = options.encoding;
        }
      }
      try {
        const parsed = DotenvModule.parse(fs.readFileSync(dotenvPath, { encoding }));
        let processEnv = process.env;
        if (options && options.processEnv != null) {
          processEnv = options.processEnv;
        }
        DotenvModule.populate(processEnv, parsed, options);
        return { parsed };
      } catch (e) {
        if (debug) {
          _debug(`Failed to load ${dotenvPath} ${e.message}`);
        }
        return { error: e };
      }
    }
    function config(options) {
      const vaultPath = _vaultPath(options);
      if (_dotenvKey(options).length === 0) {
        return DotenvModule.configDotenv(options);
      }
      if (!fs.existsSync(vaultPath)) {
        _warn(`You set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}. Did you forget to build it?`);
        return DotenvModule.configDotenv(options);
      }
      return DotenvModule._configVault(options);
    }
    function decrypt(encrypted, keyStr) {
      const key = Buffer.from(keyStr.slice(-64), "hex");
      let ciphertext = Buffer.from(encrypted, "base64");
      const nonce = ciphertext.slice(0, 12);
      const authTag = ciphertext.slice(-16);
      ciphertext = ciphertext.slice(12, -16);
      try {
        const aesgcm = crypto.createDecipheriv("aes-256-gcm", key, nonce);
        aesgcm.setAuthTag(authTag);
        return `${aesgcm.update(ciphertext)}${aesgcm.final()}`;
      } catch (error) {
        const isRange = error instanceof RangeError;
        const invalidKeyLength = error.message === "Invalid key length";
        const decryptionFailed = error.message === "Unsupported state or unable to authenticate data";
        if (isRange || invalidKeyLength) {
          const msg = "INVALID_DOTENV_KEY: It must be 64 characters long (or more)";
          throw new Error(msg);
        } else if (decryptionFailed) {
          const msg = "DECRYPTION_FAILED: Please check your DOTENV_KEY";
          throw new Error(msg);
        } else {
          console.error("Error: ", error.code);
          console.error("Error: ", error.message);
          throw error;
        }
      }
    }
    function populate(processEnv, parsed, options = {}) {
      const debug = Boolean(options && options.debug);
      const override = Boolean(options && options.override);
      if (typeof parsed !== "object") {
        throw new Error("OBJECT_REQUIRED: Please check the processEnv argument being passed to populate");
      }
      for (const key of Object.keys(parsed)) {
        if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
          if (override === true) {
            processEnv[key] = parsed[key];
          }
          if (debug) {
            if (override === true) {
              _debug(`"${key}" is already defined and WAS overwritten`);
            } else {
              _debug(`"${key}" is already defined and was NOT overwritten`);
            }
          }
        } else {
          processEnv[key] = parsed[key];
        }
      }
    }
    var DotenvModule = {
      configDotenv,
      _configVault,
      _parseVault,
      config,
      decrypt,
      parse,
      populate
    };
    module.exports.configDotenv = DotenvModule.configDotenv;
    module.exports._configVault = DotenvModule._configVault;
    module.exports._parseVault = DotenvModule._parseVault;
    module.exports.config = DotenvModule.config;
    module.exports.decrypt = DotenvModule.decrypt;
    module.exports.parse = DotenvModule.parse;
    module.exports.populate = DotenvModule.populate;
    module.exports = DotenvModule;
  }
});

// ../node_modules/dotenv/lib/env-options.js
var require_env_options = __commonJS({
  "../node_modules/dotenv/lib/env-options.js"(exports, module) {
    "use strict";
    var options = {};
    if (process.env.DOTENV_CONFIG_ENCODING != null) {
      options.encoding = process.env.DOTENV_CONFIG_ENCODING;
    }
    if (process.env.DOTENV_CONFIG_PATH != null) {
      options.path = process.env.DOTENV_CONFIG_PATH;
    }
    if (process.env.DOTENV_CONFIG_DEBUG != null) {
      options.debug = process.env.DOTENV_CONFIG_DEBUG;
    }
    if (process.env.DOTENV_CONFIG_OVERRIDE != null) {
      options.override = process.env.DOTENV_CONFIG_OVERRIDE;
    }
    if (process.env.DOTENV_CONFIG_DOTENV_KEY != null) {
      options.DOTENV_KEY = process.env.DOTENV_CONFIG_DOTENV_KEY;
    }
    module.exports = options;
  }
});

// ../node_modules/dotenv/lib/cli-options.js
var require_cli_options = __commonJS({
  "../node_modules/dotenv/lib/cli-options.js"(exports, module) {
    "use strict";
    var re = /^dotenv_config_(encoding|path|debug|override|DOTENV_KEY)=(.+)$/;
    module.exports = function optionMatcher(args) {
      return args.reduce(function(acc, cur) {
        const matches = cur.match(re);
        if (matches) {
          acc[matches[1]] = matches[2];
        }
        return acc;
      }, {});
    };
  }
});

// src/index.ts
import { createPromiseClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-node";

// ../node_modules/@bufbuild/protobuf/dist/esm/private/assert.js
function assert(condition, msg) {
  if (!condition) {
    throw new Error(msg);
  }
}
var FLOAT32_MAX = 34028234663852886e22;
var FLOAT32_MIN = -34028234663852886e22;
var UINT32_MAX = 4294967295;
var INT32_MAX = 2147483647;
var INT32_MIN = -2147483648;
function assertInt32(arg) {
  if (typeof arg !== "number")
    throw new Error("invalid int 32: " + typeof arg);
  if (!Number.isInteger(arg) || arg > INT32_MAX || arg < INT32_MIN)
    throw new Error("invalid int 32: " + arg);
}
function assertUInt32(arg) {
  if (typeof arg !== "number")
    throw new Error("invalid uint 32: " + typeof arg);
  if (!Number.isInteger(arg) || arg > UINT32_MAX || arg < 0)
    throw new Error("invalid uint 32: " + arg);
}
function assertFloat32(arg) {
  if (typeof arg !== "number")
    throw new Error("invalid float 32: " + typeof arg);
  if (!Number.isFinite(arg))
    return;
  if (arg > FLOAT32_MAX || arg < FLOAT32_MIN)
    throw new Error("invalid float 32: " + arg);
}

// ../node_modules/@bufbuild/protobuf/dist/esm/private/enum.js
var enumTypeSymbol = Symbol("@bufbuild/protobuf/enum-type");
function getEnumType(enumObject) {
  const t = enumObject[enumTypeSymbol];
  assert(t, "missing enum type on enum object");
  return t;
}
function setEnumType(enumObject, typeName, values, opt) {
  enumObject[enumTypeSymbol] = makeEnumType(typeName, values.map((v) => ({
    no: v.no,
    name: v.name,
    localName: enumObject[v.no]
  })), opt);
}
function makeEnumType(typeName, values, _opt) {
  const names = /* @__PURE__ */ Object.create(null);
  const numbers = /* @__PURE__ */ Object.create(null);
  const normalValues = [];
  for (const value of values) {
    const n = normalizeEnumValue(value);
    normalValues.push(n);
    names[value.name] = n;
    numbers[value.no] = n;
  }
  return {
    typeName,
    values: normalValues,
    // We do not surface options at this time
    // options: opt?.options ?? Object.create(null),
    findName(name) {
      return names[name];
    },
    findNumber(no) {
      return numbers[no];
    }
  };
}
function makeEnum(typeName, values, opt) {
  const enumObject = {};
  for (const value of values) {
    const n = normalizeEnumValue(value);
    enumObject[n.localName] = n.no;
    enumObject[n.no] = n.localName;
  }
  setEnumType(enumObject, typeName, values, opt);
  return enumObject;
}
function normalizeEnumValue(value) {
  if ("localName" in value) {
    return value;
  }
  return Object.assign(Object.assign({}, value), { localName: value.name });
}

// ../node_modules/@bufbuild/protobuf/dist/esm/message.js
var Message = class {
  /**
   * Compare with a message of the same type.
   */
  equals(other) {
    return this.getType().runtime.util.equals(this.getType(), this, other);
  }
  /**
   * Create a deep copy.
   */
  clone() {
    return this.getType().runtime.util.clone(this);
  }
  /**
   * Parse from binary data, merging fields.
   *
   * Repeated fields are appended. Map entries are added, overwriting
   * existing keys.
   *
   * If a message field is already present, it will be merged with the
   * new data.
   */
  fromBinary(bytes, options) {
    const type = this.getType(), format = type.runtime.bin, opt = format.makeReadOptions(options);
    format.readMessage(this, opt.readerFactory(bytes), bytes.byteLength, opt);
    return this;
  }
  /**
   * Parse a message from a JSON value.
   */
  fromJson(jsonValue, options) {
    const type = this.getType(), format = type.runtime.json, opt = format.makeReadOptions(options);
    format.readMessage(type, jsonValue, opt, this);
    return this;
  }
  /**
   * Parse a message from a JSON string.
   */
  fromJsonString(jsonString, options) {
    let json;
    try {
      json = JSON.parse(jsonString);
    } catch (e) {
      throw new Error(`cannot decode ${this.getType().typeName} from JSON: ${e instanceof Error ? e.message : String(e)}`);
    }
    return this.fromJson(json, options);
  }
  /**
   * Serialize the message to binary data.
   */
  toBinary(options) {
    const type = this.getType(), bin = type.runtime.bin, opt = bin.makeWriteOptions(options), writer = opt.writerFactory();
    bin.writeMessage(this, writer, opt);
    return writer.finish();
  }
  /**
   * Serialize the message to a JSON value, a JavaScript value that can be
   * passed to JSON.stringify().
   */
  toJson(options) {
    const type = this.getType(), json = type.runtime.json, opt = json.makeWriteOptions(options);
    return json.writeMessage(this, opt);
  }
  /**
   * Serialize the message to a JSON string.
   */
  toJsonString(options) {
    var _a;
    const value = this.toJson(options);
    return JSON.stringify(value, null, (_a = options === null || options === void 0 ? void 0 : options.prettySpaces) !== null && _a !== void 0 ? _a : 0);
  }
  /**
   * Override for serialization behavior. This will be invoked when calling
   * JSON.stringify on this message (i.e. JSON.stringify(msg)).
   *
   * Note that this will not serialize google.protobuf.Any with a packed
   * message because the protobuf JSON format specifies that it needs to be
   * unpacked, and this is only possible with a type registry to look up the
   * message type.  As a result, attempting to serialize a message with this
   * type will throw an Error.
   *
   * This method is protected because you should not need to invoke it
   * directly -- instead use JSON.stringify or toJsonString for
   * stringified JSON.  Alternatively, if actual JSON is desired, you should
   * use toJson.
   */
  toJSON() {
    return this.toJson({
      emitDefaultValues: true
    });
  }
  /**
   * Retrieve the MessageType of this message - a singleton that represents
   * the protobuf message declaration and provides metadata for reflection-
   * based operations.
   */
  getType() {
    return Object.getPrototypeOf(this).constructor;
  }
};

// ../node_modules/@bufbuild/protobuf/dist/esm/private/message-type.js
function makeMessageType(runtime, typeName, fields, opt) {
  var _a;
  const localName = (_a = opt === null || opt === void 0 ? void 0 : opt.localName) !== null && _a !== void 0 ? _a : typeName.substring(typeName.lastIndexOf(".") + 1);
  const type = {
    [localName]: function(data) {
      runtime.util.initFields(this);
      runtime.util.initPartial(data, this);
    }
  }[localName];
  Object.setPrototypeOf(type.prototype, new Message());
  Object.assign(type, {
    runtime,
    typeName,
    fields: runtime.util.newFieldList(fields),
    fromBinary(bytes, options) {
      return new type().fromBinary(bytes, options);
    },
    fromJson(jsonValue, options) {
      return new type().fromJson(jsonValue, options);
    },
    fromJsonString(jsonString, options) {
      return new type().fromJsonString(jsonString, options);
    },
    equals(a, b) {
      return runtime.util.equals(type, a, b);
    }
  });
  return type;
}

// ../node_modules/@bufbuild/protobuf/dist/esm/private/proto-runtime.js
function makeProtoRuntime(syntax, json, bin, util) {
  return {
    syntax,
    json,
    bin,
    util,
    makeMessageType(typeName, fields, opt) {
      return makeMessageType(this, typeName, fields, opt);
    },
    makeEnum,
    makeEnumType,
    getEnumType
  };
}

// ../node_modules/@bufbuild/protobuf/dist/esm/field.js
var ScalarType;
(function(ScalarType2) {
  ScalarType2[ScalarType2["DOUBLE"] = 1] = "DOUBLE";
  ScalarType2[ScalarType2["FLOAT"] = 2] = "FLOAT";
  ScalarType2[ScalarType2["INT64"] = 3] = "INT64";
  ScalarType2[ScalarType2["UINT64"] = 4] = "UINT64";
  ScalarType2[ScalarType2["INT32"] = 5] = "INT32";
  ScalarType2[ScalarType2["FIXED64"] = 6] = "FIXED64";
  ScalarType2[ScalarType2["FIXED32"] = 7] = "FIXED32";
  ScalarType2[ScalarType2["BOOL"] = 8] = "BOOL";
  ScalarType2[ScalarType2["STRING"] = 9] = "STRING";
  ScalarType2[ScalarType2["BYTES"] = 12] = "BYTES";
  ScalarType2[ScalarType2["UINT32"] = 13] = "UINT32";
  ScalarType2[ScalarType2["SFIXED32"] = 15] = "SFIXED32";
  ScalarType2[ScalarType2["SFIXED64"] = 16] = "SFIXED64";
  ScalarType2[ScalarType2["SINT32"] = 17] = "SINT32";
  ScalarType2[ScalarType2["SINT64"] = 18] = "SINT64";
})(ScalarType || (ScalarType = {}));
var LongType;
(function(LongType2) {
  LongType2[LongType2["BIGINT"] = 0] = "BIGINT";
  LongType2[LongType2["STRING"] = 1] = "STRING";
})(LongType || (LongType = {}));

// ../node_modules/@bufbuild/protobuf/dist/esm/google/varint.js
function varint64read() {
  let lowBits = 0;
  let highBits = 0;
  for (let shift = 0; shift < 28; shift += 7) {
    let b = this.buf[this.pos++];
    lowBits |= (b & 127) << shift;
    if ((b & 128) == 0) {
      this.assertBounds();
      return [lowBits, highBits];
    }
  }
  let middleByte = this.buf[this.pos++];
  lowBits |= (middleByte & 15) << 28;
  highBits = (middleByte & 112) >> 4;
  if ((middleByte & 128) == 0) {
    this.assertBounds();
    return [lowBits, highBits];
  }
  for (let shift = 3; shift <= 31; shift += 7) {
    let b = this.buf[this.pos++];
    highBits |= (b & 127) << shift;
    if ((b & 128) == 0) {
      this.assertBounds();
      return [lowBits, highBits];
    }
  }
  throw new Error("invalid varint");
}
function varint64write(lo, hi, bytes) {
  for (let i = 0; i < 28; i = i + 7) {
    const shift = lo >>> i;
    const hasNext = !(shift >>> 7 == 0 && hi == 0);
    const byte = (hasNext ? shift | 128 : shift) & 255;
    bytes.push(byte);
    if (!hasNext) {
      return;
    }
  }
  const splitBits = lo >>> 28 & 15 | (hi & 7) << 4;
  const hasMoreBits = !(hi >> 3 == 0);
  bytes.push((hasMoreBits ? splitBits | 128 : splitBits) & 255);
  if (!hasMoreBits) {
    return;
  }
  for (let i = 3; i < 31; i = i + 7) {
    const shift = hi >>> i;
    const hasNext = !(shift >>> 7 == 0);
    const byte = (hasNext ? shift | 128 : shift) & 255;
    bytes.push(byte);
    if (!hasNext) {
      return;
    }
  }
  bytes.push(hi >>> 31 & 1);
}
var TWO_PWR_32_DBL = 4294967296;
function int64FromString(dec) {
  const minus = dec[0] === "-";
  if (minus) {
    dec = dec.slice(1);
  }
  const base = 1e6;
  let lowBits = 0;
  let highBits = 0;
  function add1e6digit(begin, end) {
    const digit1e6 = Number(dec.slice(begin, end));
    highBits *= base;
    lowBits = lowBits * base + digit1e6;
    if (lowBits >= TWO_PWR_32_DBL) {
      highBits = highBits + (lowBits / TWO_PWR_32_DBL | 0);
      lowBits = lowBits % TWO_PWR_32_DBL;
    }
  }
  add1e6digit(-24, -18);
  add1e6digit(-18, -12);
  add1e6digit(-12, -6);
  add1e6digit(-6);
  return minus ? negate(lowBits, highBits) : newBits(lowBits, highBits);
}
function int64ToString(lo, hi) {
  let bits = newBits(lo, hi);
  const negative = bits.hi & 2147483648;
  if (negative) {
    bits = negate(bits.lo, bits.hi);
  }
  const result = uInt64ToString(bits.lo, bits.hi);
  return negative ? "-" + result : result;
}
function uInt64ToString(lo, hi) {
  ({ lo, hi } = toUnsigned(lo, hi));
  if (hi <= 2097151) {
    return String(TWO_PWR_32_DBL * hi + lo);
  }
  const low = lo & 16777215;
  const mid = (lo >>> 24 | hi << 8) & 16777215;
  const high = hi >> 16 & 65535;
  let digitA = low + mid * 6777216 + high * 6710656;
  let digitB = mid + high * 8147497;
  let digitC = high * 2;
  const base = 1e7;
  if (digitA >= base) {
    digitB += Math.floor(digitA / base);
    digitA %= base;
  }
  if (digitB >= base) {
    digitC += Math.floor(digitB / base);
    digitB %= base;
  }
  return digitC.toString() + decimalFrom1e7WithLeadingZeros(digitB) + decimalFrom1e7WithLeadingZeros(digitA);
}
function toUnsigned(lo, hi) {
  return { lo: lo >>> 0, hi: hi >>> 0 };
}
function newBits(lo, hi) {
  return { lo: lo | 0, hi: hi | 0 };
}
function negate(lowBits, highBits) {
  highBits = ~highBits;
  if (lowBits) {
    lowBits = ~lowBits + 1;
  } else {
    highBits += 1;
  }
  return newBits(lowBits, highBits);
}
var decimalFrom1e7WithLeadingZeros = (digit1e7) => {
  const partial = String(digit1e7);
  return "0000000".slice(partial.length) + partial;
};
function varint32write(value, bytes) {
  if (value >= 0) {
    while (value > 127) {
      bytes.push(value & 127 | 128);
      value = value >>> 7;
    }
    bytes.push(value);
  } else {
    for (let i = 0; i < 9; i++) {
      bytes.push(value & 127 | 128);
      value = value >> 7;
    }
    bytes.push(1);
  }
}
function varint32read() {
  let b = this.buf[this.pos++];
  let result = b & 127;
  if ((b & 128) == 0) {
    this.assertBounds();
    return result;
  }
  b = this.buf[this.pos++];
  result |= (b & 127) << 7;
  if ((b & 128) == 0) {
    this.assertBounds();
    return result;
  }
  b = this.buf[this.pos++];
  result |= (b & 127) << 14;
  if ((b & 128) == 0) {
    this.assertBounds();
    return result;
  }
  b = this.buf[this.pos++];
  result |= (b & 127) << 21;
  if ((b & 128) == 0) {
    this.assertBounds();
    return result;
  }
  b = this.buf[this.pos++];
  result |= (b & 15) << 28;
  for (let readBytes = 5; (b & 128) !== 0 && readBytes < 10; readBytes++)
    b = this.buf[this.pos++];
  if ((b & 128) != 0)
    throw new Error("invalid varint");
  this.assertBounds();
  return result >>> 0;
}

// ../node_modules/@bufbuild/protobuf/dist/esm/proto-int64.js
function makeInt64Support() {
  const dv = new DataView(new ArrayBuffer(8));
  const ok = typeof BigInt === "function" && typeof dv.getBigInt64 === "function" && typeof dv.getBigUint64 === "function" && typeof dv.setBigInt64 === "function" && typeof dv.setBigUint64 === "function" && (typeof process != "object" || typeof process.env != "object" || process.env.BUF_BIGINT_DISABLE !== "1");
  if (ok) {
    const MIN = BigInt("-9223372036854775808"), MAX = BigInt("9223372036854775807"), UMIN = BigInt("0"), UMAX = BigInt("18446744073709551615");
    return {
      zero: BigInt(0),
      supported: true,
      parse(value) {
        const bi = typeof value == "bigint" ? value : BigInt(value);
        if (bi > MAX || bi < MIN) {
          throw new Error(`int64 invalid: ${value}`);
        }
        return bi;
      },
      uParse(value) {
        const bi = typeof value == "bigint" ? value : BigInt(value);
        if (bi > UMAX || bi < UMIN) {
          throw new Error(`uint64 invalid: ${value}`);
        }
        return bi;
      },
      enc(value) {
        dv.setBigInt64(0, this.parse(value), true);
        return {
          lo: dv.getInt32(0, true),
          hi: dv.getInt32(4, true)
        };
      },
      uEnc(value) {
        dv.setBigInt64(0, this.uParse(value), true);
        return {
          lo: dv.getInt32(0, true),
          hi: dv.getInt32(4, true)
        };
      },
      dec(lo, hi) {
        dv.setInt32(0, lo, true);
        dv.setInt32(4, hi, true);
        return dv.getBigInt64(0, true);
      },
      uDec(lo, hi) {
        dv.setInt32(0, lo, true);
        dv.setInt32(4, hi, true);
        return dv.getBigUint64(0, true);
      }
    };
  }
  const assertInt64String = (value) => assert(/^-?[0-9]+$/.test(value), `int64 invalid: ${value}`);
  const assertUInt64String = (value) => assert(/^[0-9]+$/.test(value), `uint64 invalid: ${value}`);
  return {
    zero: "0",
    supported: false,
    parse(value) {
      if (typeof value != "string") {
        value = value.toString();
      }
      assertInt64String(value);
      return value;
    },
    uParse(value) {
      if (typeof value != "string") {
        value = value.toString();
      }
      assertUInt64String(value);
      return value;
    },
    enc(value) {
      if (typeof value != "string") {
        value = value.toString();
      }
      assertInt64String(value);
      return int64FromString(value);
    },
    uEnc(value) {
      if (typeof value != "string") {
        value = value.toString();
      }
      assertUInt64String(value);
      return int64FromString(value);
    },
    dec(lo, hi) {
      return int64ToString(lo, hi);
    },
    uDec(lo, hi) {
      return uInt64ToString(lo, hi);
    }
  };
}
var protoInt64 = makeInt64Support();

// ../node_modules/@bufbuild/protobuf/dist/esm/binary-encoding.js
var WireType;
(function(WireType2) {
  WireType2[WireType2["Varint"] = 0] = "Varint";
  WireType2[WireType2["Bit64"] = 1] = "Bit64";
  WireType2[WireType2["LengthDelimited"] = 2] = "LengthDelimited";
  WireType2[WireType2["StartGroup"] = 3] = "StartGroup";
  WireType2[WireType2["EndGroup"] = 4] = "EndGroup";
  WireType2[WireType2["Bit32"] = 5] = "Bit32";
})(WireType || (WireType = {}));
var BinaryWriter = class {
  constructor(textEncoder) {
    this.stack = [];
    this.textEncoder = textEncoder !== null && textEncoder !== void 0 ? textEncoder : new TextEncoder();
    this.chunks = [];
    this.buf = [];
  }
  /**
   * Return all bytes written and reset this writer.
   */
  finish() {
    this.chunks.push(new Uint8Array(this.buf));
    let len = 0;
    for (let i = 0; i < this.chunks.length; i++)
      len += this.chunks[i].length;
    let bytes = new Uint8Array(len);
    let offset = 0;
    for (let i = 0; i < this.chunks.length; i++) {
      bytes.set(this.chunks[i], offset);
      offset += this.chunks[i].length;
    }
    this.chunks = [];
    return bytes;
  }
  /**
   * Start a new fork for length-delimited data like a message
   * or a packed repeated field.
   *
   * Must be joined later with `join()`.
   */
  fork() {
    this.stack.push({ chunks: this.chunks, buf: this.buf });
    this.chunks = [];
    this.buf = [];
    return this;
  }
  /**
   * Join the last fork. Write its length and bytes, then
   * return to the previous state.
   */
  join() {
    let chunk = this.finish();
    let prev = this.stack.pop();
    if (!prev)
      throw new Error("invalid state, fork stack empty");
    this.chunks = prev.chunks;
    this.buf = prev.buf;
    this.uint32(chunk.byteLength);
    return this.raw(chunk);
  }
  /**
   * Writes a tag (field number and wire type).
   *
   * Equivalent to `uint32( (fieldNo << 3 | type) >>> 0 )`.
   *
   * Generated code should compute the tag ahead of time and call `uint32()`.
   */
  tag(fieldNo, type) {
    return this.uint32((fieldNo << 3 | type) >>> 0);
  }
  /**
   * Write a chunk of raw bytes.
   */
  raw(chunk) {
    if (this.buf.length) {
      this.chunks.push(new Uint8Array(this.buf));
      this.buf = [];
    }
    this.chunks.push(chunk);
    return this;
  }
  /**
   * Write a `uint32` value, an unsigned 32 bit varint.
   */
  uint32(value) {
    assertUInt32(value);
    while (value > 127) {
      this.buf.push(value & 127 | 128);
      value = value >>> 7;
    }
    this.buf.push(value);
    return this;
  }
  /**
   * Write a `int32` value, a signed 32 bit varint.
   */
  int32(value) {
    assertInt32(value);
    varint32write(value, this.buf);
    return this;
  }
  /**
   * Write a `bool` value, a variant.
   */
  bool(value) {
    this.buf.push(value ? 1 : 0);
    return this;
  }
  /**
   * Write a `bytes` value, length-delimited arbitrary data.
   */
  bytes(value) {
    this.uint32(value.byteLength);
    return this.raw(value);
  }
  /**
   * Write a `string` value, length-delimited data converted to UTF-8 text.
   */
  string(value) {
    let chunk = this.textEncoder.encode(value);
    this.uint32(chunk.byteLength);
    return this.raw(chunk);
  }
  /**
   * Write a `float` value, 32-bit floating point number.
   */
  float(value) {
    assertFloat32(value);
    let chunk = new Uint8Array(4);
    new DataView(chunk.buffer).setFloat32(0, value, true);
    return this.raw(chunk);
  }
  /**
   * Write a `double` value, a 64-bit floating point number.
   */
  double(value) {
    let chunk = new Uint8Array(8);
    new DataView(chunk.buffer).setFloat64(0, value, true);
    return this.raw(chunk);
  }
  /**
   * Write a `fixed32` value, an unsigned, fixed-length 32-bit integer.
   */
  fixed32(value) {
    assertUInt32(value);
    let chunk = new Uint8Array(4);
    new DataView(chunk.buffer).setUint32(0, value, true);
    return this.raw(chunk);
  }
  /**
   * Write a `sfixed32` value, a signed, fixed-length 32-bit integer.
   */
  sfixed32(value) {
    assertInt32(value);
    let chunk = new Uint8Array(4);
    new DataView(chunk.buffer).setInt32(0, value, true);
    return this.raw(chunk);
  }
  /**
   * Write a `sint32` value, a signed, zigzag-encoded 32-bit varint.
   */
  sint32(value) {
    assertInt32(value);
    value = (value << 1 ^ value >> 31) >>> 0;
    varint32write(value, this.buf);
    return this;
  }
  /**
   * Write a `fixed64` value, a signed, fixed-length 64-bit integer.
   */
  sfixed64(value) {
    let chunk = new Uint8Array(8), view = new DataView(chunk.buffer), tc = protoInt64.enc(value);
    view.setInt32(0, tc.lo, true);
    view.setInt32(4, tc.hi, true);
    return this.raw(chunk);
  }
  /**
   * Write a `fixed64` value, an unsigned, fixed-length 64 bit integer.
   */
  fixed64(value) {
    let chunk = new Uint8Array(8), view = new DataView(chunk.buffer), tc = protoInt64.uEnc(value);
    view.setInt32(0, tc.lo, true);
    view.setInt32(4, tc.hi, true);
    return this.raw(chunk);
  }
  /**
   * Write a `int64` value, a signed 64-bit varint.
   */
  int64(value) {
    let tc = protoInt64.enc(value);
    varint64write(tc.lo, tc.hi, this.buf);
    return this;
  }
  /**
   * Write a `sint64` value, a signed, zig-zag-encoded 64-bit varint.
   */
  sint64(value) {
    let tc = protoInt64.enc(value), sign = tc.hi >> 31, lo = tc.lo << 1 ^ sign, hi = (tc.hi << 1 | tc.lo >>> 31) ^ sign;
    varint64write(lo, hi, this.buf);
    return this;
  }
  /**
   * Write a `uint64` value, an unsigned 64-bit varint.
   */
  uint64(value) {
    let tc = protoInt64.uEnc(value);
    varint64write(tc.lo, tc.hi, this.buf);
    return this;
  }
};
var BinaryReader = class {
  constructor(buf, textDecoder) {
    this.varint64 = varint64read;
    this.uint32 = varint32read;
    this.buf = buf;
    this.len = buf.length;
    this.pos = 0;
    this.view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    this.textDecoder = textDecoder !== null && textDecoder !== void 0 ? textDecoder : new TextDecoder();
  }
  /**
   * Reads a tag - field number and wire type.
   */
  tag() {
    let tag = this.uint32(), fieldNo = tag >>> 3, wireType = tag & 7;
    if (fieldNo <= 0 || wireType < 0 || wireType > 5)
      throw new Error("illegal tag: field no " + fieldNo + " wire type " + wireType);
    return [fieldNo, wireType];
  }
  /**
   * Skip one element on the wire and return the skipped data.
   * Supports WireType.StartGroup since v2.0.0-alpha.23.
   */
  skip(wireType) {
    let start = this.pos;
    switch (wireType) {
      case WireType.Varint:
        while (this.buf[this.pos++] & 128) {
        }
        break;
      case WireType.Bit64:
        this.pos += 4;
      case WireType.Bit32:
        this.pos += 4;
        break;
      case WireType.LengthDelimited:
        let len = this.uint32();
        this.pos += len;
        break;
      case WireType.StartGroup:
        let t;
        while ((t = this.tag()[1]) !== WireType.EndGroup) {
          this.skip(t);
        }
        break;
      default:
        throw new Error("cant skip wire type " + wireType);
    }
    this.assertBounds();
    return this.buf.subarray(start, this.pos);
  }
  /**
   * Throws error if position in byte array is out of range.
   */
  assertBounds() {
    if (this.pos > this.len)
      throw new RangeError("premature EOF");
  }
  /**
   * Read a `int32` field, a signed 32 bit varint.
   */
  int32() {
    return this.uint32() | 0;
  }
  /**
   * Read a `sint32` field, a signed, zigzag-encoded 32-bit varint.
   */
  sint32() {
    let zze = this.uint32();
    return zze >>> 1 ^ -(zze & 1);
  }
  /**
   * Read a `int64` field, a signed 64-bit varint.
   */
  int64() {
    return protoInt64.dec(...this.varint64());
  }
  /**
   * Read a `uint64` field, an unsigned 64-bit varint.
   */
  uint64() {
    return protoInt64.uDec(...this.varint64());
  }
  /**
   * Read a `sint64` field, a signed, zig-zag-encoded 64-bit varint.
   */
  sint64() {
    let [lo, hi] = this.varint64();
    let s = -(lo & 1);
    lo = (lo >>> 1 | (hi & 1) << 31) ^ s;
    hi = hi >>> 1 ^ s;
    return protoInt64.dec(lo, hi);
  }
  /**
   * Read a `bool` field, a variant.
   */
  bool() {
    let [lo, hi] = this.varint64();
    return lo !== 0 || hi !== 0;
  }
  /**
   * Read a `fixed32` field, an unsigned, fixed-length 32-bit integer.
   */
  fixed32() {
    return this.view.getUint32((this.pos += 4) - 4, true);
  }
  /**
   * Read a `sfixed32` field, a signed, fixed-length 32-bit integer.
   */
  sfixed32() {
    return this.view.getInt32((this.pos += 4) - 4, true);
  }
  /**
   * Read a `fixed64` field, an unsigned, fixed-length 64 bit integer.
   */
  fixed64() {
    return protoInt64.uDec(this.sfixed32(), this.sfixed32());
  }
  /**
   * Read a `fixed64` field, a signed, fixed-length 64-bit integer.
   */
  sfixed64() {
    return protoInt64.dec(this.sfixed32(), this.sfixed32());
  }
  /**
   * Read a `float` field, 32-bit floating point number.
   */
  float() {
    return this.view.getFloat32((this.pos += 4) - 4, true);
  }
  /**
   * Read a `double` field, a 64-bit floating point number.
   */
  double() {
    return this.view.getFloat64((this.pos += 8) - 8, true);
  }
  /**
   * Read a `bytes` field, length-delimited arbitrary data.
   */
  bytes() {
    let len = this.uint32(), start = this.pos;
    this.pos += len;
    this.assertBounds();
    return this.buf.subarray(start, start + len);
  }
  /**
   * Read a `string` field, length-delimited data converted to UTF-8 text.
   */
  string() {
    return this.textDecoder.decode(this.bytes());
  }
};

// ../node_modules/@bufbuild/protobuf/dist/esm/private/field-wrapper.js
function wrapField(type, value) {
  if (value instanceof Message || !type.fieldWrapper) {
    return value;
  }
  return type.fieldWrapper.wrapField(value);
}
var wktWrapperToScalarType = {
  "google.protobuf.DoubleValue": ScalarType.DOUBLE,
  "google.protobuf.FloatValue": ScalarType.FLOAT,
  "google.protobuf.Int64Value": ScalarType.INT64,
  "google.protobuf.UInt64Value": ScalarType.UINT64,
  "google.protobuf.Int32Value": ScalarType.INT32,
  "google.protobuf.UInt32Value": ScalarType.UINT32,
  "google.protobuf.BoolValue": ScalarType.BOOL,
  "google.protobuf.StringValue": ScalarType.STRING,
  "google.protobuf.BytesValue": ScalarType.BYTES
};

// ../node_modules/@bufbuild/protobuf/dist/esm/private/scalars.js
function scalarEquals(type, a, b) {
  if (a === b) {
    return true;
  }
  if (type == ScalarType.BYTES) {
    if (!(a instanceof Uint8Array) || !(b instanceof Uint8Array)) {
      return false;
    }
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  }
  switch (type) {
    case ScalarType.UINT64:
    case ScalarType.FIXED64:
    case ScalarType.INT64:
    case ScalarType.SFIXED64:
    case ScalarType.SINT64:
      return a == b;
  }
  return false;
}
function scalarDefaultValue(type, longType) {
  switch (type) {
    case ScalarType.BOOL:
      return false;
    case ScalarType.UINT64:
    case ScalarType.FIXED64:
    case ScalarType.INT64:
    case ScalarType.SFIXED64:
    case ScalarType.SINT64:
      return longType == 0 ? protoInt64.zero : "0";
    case ScalarType.DOUBLE:
    case ScalarType.FLOAT:
      return 0;
    case ScalarType.BYTES:
      return new Uint8Array(0);
    case ScalarType.STRING:
      return "";
    default:
      return 0;
  }
}
function scalarTypeInfo(type, value) {
  const isUndefined = value === void 0;
  let wireType = WireType.Varint;
  let isIntrinsicDefault = value === 0;
  switch (type) {
    case ScalarType.STRING:
      isIntrinsicDefault = isUndefined || !value.length;
      wireType = WireType.LengthDelimited;
      break;
    case ScalarType.BOOL:
      isIntrinsicDefault = value === false;
      break;
    case ScalarType.DOUBLE:
      wireType = WireType.Bit64;
      break;
    case ScalarType.FLOAT:
      wireType = WireType.Bit32;
      break;
    case ScalarType.INT64:
      isIntrinsicDefault = isUndefined || value == 0;
      break;
    case ScalarType.UINT64:
      isIntrinsicDefault = isUndefined || value == 0;
      break;
    case ScalarType.FIXED64:
      isIntrinsicDefault = isUndefined || value == 0;
      wireType = WireType.Bit64;
      break;
    case ScalarType.BYTES:
      isIntrinsicDefault = isUndefined || !value.byteLength;
      wireType = WireType.LengthDelimited;
      break;
    case ScalarType.FIXED32:
      wireType = WireType.Bit32;
      break;
    case ScalarType.SFIXED32:
      wireType = WireType.Bit32;
      break;
    case ScalarType.SFIXED64:
      isIntrinsicDefault = isUndefined || value == 0;
      wireType = WireType.Bit64;
      break;
    case ScalarType.SINT64:
      isIntrinsicDefault = isUndefined || value == 0;
      break;
  }
  const method = ScalarType[type].toLowerCase();
  return [wireType, method, isUndefined || isIntrinsicDefault];
}

// ../node_modules/@bufbuild/protobuf/dist/esm/private/binary-format-common.js
var unknownFieldsSymbol = Symbol("@bufbuild/protobuf/unknown-fields");
var readDefaults = {
  readUnknownFields: true,
  readerFactory: (bytes) => new BinaryReader(bytes)
};
var writeDefaults = {
  writeUnknownFields: true,
  writerFactory: () => new BinaryWriter()
};
function makeReadOptions(options) {
  return options ? Object.assign(Object.assign({}, readDefaults), options) : readDefaults;
}
function makeWriteOptions(options) {
  return options ? Object.assign(Object.assign({}, writeDefaults), options) : writeDefaults;
}
function makeBinaryFormatCommon() {
  return {
    makeReadOptions,
    makeWriteOptions,
    listUnknownFields(message) {
      var _a;
      return (_a = message[unknownFieldsSymbol]) !== null && _a !== void 0 ? _a : [];
    },
    discardUnknownFields(message) {
      delete message[unknownFieldsSymbol];
    },
    writeUnknownFields(message, writer) {
      const m = message;
      const c = m[unknownFieldsSymbol];
      if (c) {
        for (const f of c) {
          writer.tag(f.no, f.wireType).raw(f.data);
        }
      }
    },
    onUnknownField(message, no, wireType, data) {
      const m = message;
      if (!Array.isArray(m[unknownFieldsSymbol])) {
        m[unknownFieldsSymbol] = [];
      }
      m[unknownFieldsSymbol].push({ no, wireType, data });
    },
    readMessage(message, reader, length, options) {
      const type = message.getType();
      const end = length === void 0 ? reader.len : reader.pos + length;
      while (reader.pos < end) {
        const [fieldNo, wireType] = reader.tag(), field = type.fields.find(fieldNo);
        if (!field) {
          const data = reader.skip(wireType);
          if (options.readUnknownFields) {
            this.onUnknownField(message, fieldNo, wireType, data);
          }
          continue;
        }
        let target = message, repeated = field.repeated, localName = field.localName;
        if (field.oneof) {
          target = target[field.oneof.localName];
          if (target.case != localName) {
            delete target.value;
          }
          target.case = localName;
          localName = "value";
        }
        switch (field.kind) {
          case "scalar":
          case "enum":
            const scalarType = field.kind == "enum" ? ScalarType.INT32 : field.T;
            let read = readScalar;
            if (field.kind == "scalar" && field.L > 0) {
              read = readScalarLTString;
            }
            if (repeated) {
              let arr = target[localName];
              if (wireType == WireType.LengthDelimited && scalarType != ScalarType.STRING && scalarType != ScalarType.BYTES) {
                let e = reader.uint32() + reader.pos;
                while (reader.pos < e) {
                  arr.push(read(reader, scalarType));
                }
              } else {
                arr.push(read(reader, scalarType));
              }
            } else {
              target[localName] = read(reader, scalarType);
            }
            break;
          case "message":
            const messageType = field.T;
            if (repeated) {
              target[localName].push(readMessageField(reader, new messageType(), options));
            } else {
              if (target[localName] instanceof Message) {
                readMessageField(reader, target[localName], options);
              } else {
                target[localName] = readMessageField(reader, new messageType(), options);
                if (messageType.fieldWrapper && !field.oneof && !field.repeated) {
                  target[localName] = messageType.fieldWrapper.unwrapField(target[localName]);
                }
              }
            }
            break;
          case "map":
            let [mapKey, mapVal] = readMapEntry(field, reader, options);
            target[localName][mapKey] = mapVal;
            break;
        }
      }
    }
  };
}
function readMessageField(reader, message, options) {
  const format = message.getType().runtime.bin;
  format.readMessage(message, reader, reader.uint32(), options);
  return message;
}
function readMapEntry(field, reader, options) {
  const length = reader.uint32(), end = reader.pos + length;
  let key, val;
  while (reader.pos < end) {
    let [fieldNo] = reader.tag();
    switch (fieldNo) {
      case 1:
        key = readScalar(reader, field.K);
        break;
      case 2:
        switch (field.V.kind) {
          case "scalar":
            val = readScalar(reader, field.V.T);
            break;
          case "enum":
            val = reader.int32();
            break;
          case "message":
            val = readMessageField(reader, new field.V.T(), options);
            break;
        }
        break;
    }
  }
  if (key === void 0) {
    let keyRaw = scalarDefaultValue(field.K, LongType.BIGINT);
    key = field.K == ScalarType.BOOL ? keyRaw.toString() : keyRaw;
  }
  if (typeof key != "string" && typeof key != "number") {
    key = key.toString();
  }
  if (val === void 0) {
    switch (field.V.kind) {
      case "scalar":
        val = scalarDefaultValue(field.V.T, LongType.BIGINT);
        break;
      case "enum":
        val = 0;
        break;
      case "message":
        val = new field.V.T();
        break;
    }
  }
  return [key, val];
}
function readScalarLTString(reader, type) {
  const v = readScalar(reader, type);
  return typeof v == "bigint" ? v.toString() : v;
}
function readScalar(reader, type) {
  switch (type) {
    case ScalarType.STRING:
      return reader.string();
    case ScalarType.BOOL:
      return reader.bool();
    case ScalarType.DOUBLE:
      return reader.double();
    case ScalarType.FLOAT:
      return reader.float();
    case ScalarType.INT32:
      return reader.int32();
    case ScalarType.INT64:
      return reader.int64();
    case ScalarType.UINT64:
      return reader.uint64();
    case ScalarType.FIXED64:
      return reader.fixed64();
    case ScalarType.BYTES:
      return reader.bytes();
    case ScalarType.FIXED32:
      return reader.fixed32();
    case ScalarType.SFIXED32:
      return reader.sfixed32();
    case ScalarType.SFIXED64:
      return reader.sfixed64();
    case ScalarType.SINT64:
      return reader.sint64();
    case ScalarType.UINT32:
      return reader.uint32();
    case ScalarType.SINT32:
      return reader.sint32();
  }
}
function writeMapEntry(writer, options, field, key, value) {
  writer.tag(field.no, WireType.LengthDelimited);
  writer.fork();
  let keyValue = key;
  switch (field.K) {
    case ScalarType.INT32:
    case ScalarType.FIXED32:
    case ScalarType.UINT32:
    case ScalarType.SFIXED32:
    case ScalarType.SINT32:
      keyValue = Number.parseInt(key);
      break;
    case ScalarType.BOOL:
      assert(key == "true" || key == "false");
      keyValue = key == "true";
      break;
  }
  writeScalar(writer, field.K, 1, keyValue, true);
  switch (field.V.kind) {
    case "scalar":
      writeScalar(writer, field.V.T, 2, value, true);
      break;
    case "enum":
      writeScalar(writer, ScalarType.INT32, 2, value, true);
      break;
    case "message":
      writeMessageField(writer, options, field.V.T, 2, value);
      break;
  }
  writer.join();
}
function writeMessageField(writer, options, type, fieldNo, value) {
  if (value !== void 0) {
    const message = wrapField(type, value);
    writer.tag(fieldNo, WireType.LengthDelimited).bytes(message.toBinary(options));
  }
}
function writeScalar(writer, type, fieldNo, value, emitIntrinsicDefault) {
  let [wireType, method, isIntrinsicDefault] = scalarTypeInfo(type, value);
  if (!isIntrinsicDefault || emitIntrinsicDefault) {
    writer.tag(fieldNo, wireType)[method](value);
  }
}
function writePacked(writer, type, fieldNo, value) {
  if (!value.length) {
    return;
  }
  writer.tag(fieldNo, WireType.LengthDelimited).fork();
  let [, method] = scalarTypeInfo(type);
  for (let i = 0; i < value.length; i++) {
    writer[method](value[i]);
  }
  writer.join();
}

// ../node_modules/@bufbuild/protobuf/dist/esm/private/binary-format-proto3.js
function makeBinaryFormatProto3() {
  return Object.assign(Object.assign({}, makeBinaryFormatCommon()), { writeMessage(message, writer, options) {
    const type = message.getType();
    for (const field of type.fields.byNumber()) {
      let value, repeated = field.repeated, localName = field.localName;
      if (field.oneof) {
        const oneof = message[field.oneof.localName];
        if (oneof.case !== localName) {
          continue;
        }
        value = oneof.value;
      } else {
        value = message[localName];
      }
      switch (field.kind) {
        case "scalar":
        case "enum":
          let scalarType = field.kind == "enum" ? ScalarType.INT32 : field.T;
          if (repeated) {
            if (field.packed) {
              writePacked(writer, scalarType, field.no, value);
            } else {
              for (const item of value) {
                writeScalar(writer, scalarType, field.no, item, true);
              }
            }
          } else {
            if (value !== void 0) {
              writeScalar(writer, scalarType, field.no, value, !!field.oneof || field.opt);
            }
          }
          break;
        case "message":
          if (repeated) {
            for (const item of value) {
              writeMessageField(writer, options, field.T, field.no, item);
            }
          } else {
            writeMessageField(writer, options, field.T, field.no, value);
          }
          break;
        case "map":
          for (const [key, val] of Object.entries(value)) {
            writeMapEntry(writer, options, field, key, val);
          }
          break;
      }
    }
    if (options.writeUnknownFields) {
      this.writeUnknownFields(message, writer);
    }
    return writer;
  } });
}

// ../node_modules/@bufbuild/protobuf/dist/esm/proto-base64.js
var encTable = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("");
var decTable = [];
for (let i = 0; i < encTable.length; i++)
  decTable[encTable[i].charCodeAt(0)] = i;
decTable["-".charCodeAt(0)] = encTable.indexOf("+");
decTable["_".charCodeAt(0)] = encTable.indexOf("/");
var protoBase64 = {
  /**
   * Decodes a base64 string to a byte array.
   *
   * - ignores white-space, including line breaks and tabs
   * - allows inner padding (can decode concatenated base64 strings)
   * - does not require padding
   * - understands base64url encoding:
   *   "-" instead of "+",
   *   "_" instead of "/",
   *   no padding
   */
  dec(base64Str) {
    let es = base64Str.length * 3 / 4;
    if (base64Str[base64Str.length - 2] == "=")
      es -= 2;
    else if (base64Str[base64Str.length - 1] == "=")
      es -= 1;
    let bytes = new Uint8Array(es), bytePos = 0, groupPos = 0, b, p = 0;
    for (let i = 0; i < base64Str.length; i++) {
      b = decTable[base64Str.charCodeAt(i)];
      if (b === void 0) {
        switch (base64Str[i]) {
          case "=":
            groupPos = 0;
          case "\n":
          case "\r":
          case "	":
          case " ":
            continue;
          default:
            throw Error("invalid base64 string.");
        }
      }
      switch (groupPos) {
        case 0:
          p = b;
          groupPos = 1;
          break;
        case 1:
          bytes[bytePos++] = p << 2 | (b & 48) >> 4;
          p = b;
          groupPos = 2;
          break;
        case 2:
          bytes[bytePos++] = (p & 15) << 4 | (b & 60) >> 2;
          p = b;
          groupPos = 3;
          break;
        case 3:
          bytes[bytePos++] = (p & 3) << 6 | b;
          groupPos = 0;
          break;
      }
    }
    if (groupPos == 1)
      throw Error("invalid base64 string.");
    return bytes.subarray(0, bytePos);
  },
  /**
   * Encode a byte array to a base64 string.
   */
  enc(bytes) {
    let base64 = "", groupPos = 0, b, p = 0;
    for (let i = 0; i < bytes.length; i++) {
      b = bytes[i];
      switch (groupPos) {
        case 0:
          base64 += encTable[b >> 2];
          p = (b & 3) << 4;
          groupPos = 1;
          break;
        case 1:
          base64 += encTable[p | b >> 4];
          p = (b & 15) << 2;
          groupPos = 2;
          break;
        case 2:
          base64 += encTable[p | b >> 6];
          base64 += encTable[b & 63];
          groupPos = 0;
          break;
      }
    }
    if (groupPos) {
      base64 += encTable[p];
      base64 += "=";
      if (groupPos == 1)
        base64 += "=";
    }
    return base64;
  }
};

// ../node_modules/@bufbuild/protobuf/dist/esm/private/json-format-common.js
var jsonReadDefaults = {
  ignoreUnknownFields: false
};
var jsonWriteDefaults = {
  emitDefaultValues: false,
  enumAsInteger: false,
  useProtoFieldName: false,
  prettySpaces: 0
};
function makeReadOptions2(options) {
  return options ? Object.assign(Object.assign({}, jsonReadDefaults), options) : jsonReadDefaults;
}
function makeWriteOptions2(options) {
  return options ? Object.assign(Object.assign({}, jsonWriteDefaults), options) : jsonWriteDefaults;
}
function makeJsonFormatCommon(makeWriteField) {
  const writeField = makeWriteField(writeEnum, writeScalar2);
  return {
    makeReadOptions: makeReadOptions2,
    makeWriteOptions: makeWriteOptions2,
    readMessage(type, json, options, message) {
      if (json == null || Array.isArray(json) || typeof json != "object") {
        throw new Error(`cannot decode message ${type.typeName} from JSON: ${this.debug(json)}`);
      }
      message = message !== null && message !== void 0 ? message : new type();
      const oneofSeen = {};
      for (const [jsonKey, jsonValue] of Object.entries(json)) {
        const field = type.fields.findJsonName(jsonKey);
        if (!field) {
          if (!options.ignoreUnknownFields) {
            throw new Error(`cannot decode message ${type.typeName} from JSON: key "${jsonKey}" is unknown`);
          }
          continue;
        }
        let localName = field.localName;
        let target = message;
        if (field.oneof) {
          if (jsonValue === null && field.kind == "scalar") {
            continue;
          }
          const seen = oneofSeen[field.oneof.localName];
          if (seen) {
            throw new Error(`cannot decode message ${type.typeName} from JSON: multiple keys for oneof "${field.oneof.name}" present: "${seen}", "${jsonKey}"`);
          }
          oneofSeen[field.oneof.localName] = jsonKey;
          target = target[field.oneof.localName] = { case: localName };
          localName = "value";
        }
        if (field.repeated) {
          if (jsonValue === null) {
            continue;
          }
          if (!Array.isArray(jsonValue)) {
            throw new Error(`cannot decode field ${type.typeName}.${field.name} from JSON: ${this.debug(jsonValue)}`);
          }
          const targetArray = target[localName];
          for (const jsonItem of jsonValue) {
            if (jsonItem === null) {
              throw new Error(`cannot decode field ${type.typeName}.${field.name} from JSON: ${this.debug(jsonItem)}`);
            }
            let val;
            switch (field.kind) {
              case "message":
                val = field.T.fromJson(jsonItem, options);
                break;
              case "enum":
                val = readEnum(field.T, jsonItem, options.ignoreUnknownFields);
                if (val === void 0)
                  continue;
                break;
              case "scalar":
                try {
                  val = readScalar2(field.T, jsonItem, field.L);
                } catch (e) {
                  let m = `cannot decode field ${type.typeName}.${field.name} from JSON: ${this.debug(jsonItem)}`;
                  if (e instanceof Error && e.message.length > 0) {
                    m += `: ${e.message}`;
                  }
                  throw new Error(m);
                }
                break;
            }
            targetArray.push(val);
          }
        } else if (field.kind == "map") {
          if (jsonValue === null) {
            continue;
          }
          if (Array.isArray(jsonValue) || typeof jsonValue != "object") {
            throw new Error(`cannot decode field ${type.typeName}.${field.name} from JSON: ${this.debug(jsonValue)}`);
          }
          const targetMap = target[localName];
          for (const [jsonMapKey, jsonMapValue] of Object.entries(jsonValue)) {
            if (jsonMapValue === null) {
              throw new Error(`cannot decode field ${type.typeName}.${field.name} from JSON: map value null`);
            }
            let val;
            switch (field.V.kind) {
              case "message":
                val = field.V.T.fromJson(jsonMapValue, options);
                break;
              case "enum":
                val = readEnum(field.V.T, jsonMapValue, options.ignoreUnknownFields);
                if (val === void 0)
                  continue;
                break;
              case "scalar":
                try {
                  val = readScalar2(field.V.T, jsonMapValue, LongType.BIGINT);
                } catch (e) {
                  let m = `cannot decode map value for field ${type.typeName}.${field.name} from JSON: ${this.debug(jsonValue)}`;
                  if (e instanceof Error && e.message.length > 0) {
                    m += `: ${e.message}`;
                  }
                  throw new Error(m);
                }
                break;
            }
            try {
              targetMap[readScalar2(field.K, field.K == ScalarType.BOOL ? jsonMapKey == "true" ? true : jsonMapKey == "false" ? false : jsonMapKey : jsonMapKey, LongType.BIGINT).toString()] = val;
            } catch (e) {
              let m = `cannot decode map key for field ${type.typeName}.${field.name} from JSON: ${this.debug(jsonValue)}`;
              if (e instanceof Error && e.message.length > 0) {
                m += `: ${e.message}`;
              }
              throw new Error(m);
            }
          }
        } else {
          switch (field.kind) {
            case "message":
              const messageType = field.T;
              if (jsonValue === null && messageType.typeName != "google.protobuf.Value") {
                if (field.oneof) {
                  throw new Error(`cannot decode field ${type.typeName}.${field.name} from JSON: null is invalid for oneof field "${jsonKey}"`);
                }
                continue;
              }
              if (target[localName] instanceof Message) {
                target[localName].fromJson(jsonValue, options);
              } else {
                target[localName] = messageType.fromJson(jsonValue, options);
                if (messageType.fieldWrapper && !field.oneof) {
                  target[localName] = messageType.fieldWrapper.unwrapField(target[localName]);
                }
              }
              break;
            case "enum":
              const enumValue = readEnum(field.T, jsonValue, options.ignoreUnknownFields);
              if (enumValue !== void 0) {
                target[localName] = enumValue;
              }
              break;
            case "scalar":
              try {
                target[localName] = readScalar2(field.T, jsonValue, field.L);
              } catch (e) {
                let m = `cannot decode field ${type.typeName}.${field.name} from JSON: ${this.debug(jsonValue)}`;
                if (e instanceof Error && e.message.length > 0) {
                  m += `: ${e.message}`;
                }
                throw new Error(m);
              }
              break;
          }
        }
      }
      return message;
    },
    writeMessage(message, options) {
      const type = message.getType();
      const json = {};
      let field;
      try {
        for (const member of type.fields.byMember()) {
          let jsonValue;
          if (member.kind == "oneof") {
            const oneof = message[member.localName];
            if (oneof.value === void 0) {
              continue;
            }
            field = member.findField(oneof.case);
            if (!field) {
              throw "oneof case not found: " + oneof.case;
            }
            jsonValue = writeField(field, oneof.value, options);
          } else {
            field = member;
            jsonValue = writeField(field, message[field.localName], options);
          }
          if (jsonValue !== void 0) {
            json[options.useProtoFieldName ? field.name : field.jsonName] = jsonValue;
          }
        }
      } catch (e) {
        const m = field ? `cannot encode field ${type.typeName}.${field.name} to JSON` : `cannot encode message ${type.typeName} to JSON`;
        const r = e instanceof Error ? e.message : String(e);
        throw new Error(m + (r.length > 0 ? `: ${r}` : ""));
      }
      return json;
    },
    readScalar: readScalar2,
    writeScalar: writeScalar2,
    debug: debugJsonValue
  };
}
function debugJsonValue(json) {
  if (json === null) {
    return "null";
  }
  switch (typeof json) {
    case "object":
      return Array.isArray(json) ? "array" : "object";
    case "string":
      return json.length > 100 ? "string" : `"${json.split('"').join('\\"')}"`;
    default:
      return String(json);
  }
}
function readScalar2(type, json, longType) {
  switch (type) {
    case ScalarType.DOUBLE:
    case ScalarType.FLOAT:
      if (json === null)
        return 0;
      if (json === "NaN")
        return Number.NaN;
      if (json === "Infinity")
        return Number.POSITIVE_INFINITY;
      if (json === "-Infinity")
        return Number.NEGATIVE_INFINITY;
      if (json === "") {
        break;
      }
      if (typeof json == "string" && json.trim().length !== json.length) {
        break;
      }
      if (typeof json != "string" && typeof json != "number") {
        break;
      }
      const float = Number(json);
      if (Number.isNaN(float)) {
        break;
      }
      if (!Number.isFinite(float)) {
        break;
      }
      if (type == ScalarType.FLOAT)
        assertFloat32(float);
      return float;
    case ScalarType.INT32:
    case ScalarType.FIXED32:
    case ScalarType.SFIXED32:
    case ScalarType.SINT32:
    case ScalarType.UINT32:
      if (json === null)
        return 0;
      let int32;
      if (typeof json == "number")
        int32 = json;
      else if (typeof json == "string" && json.length > 0) {
        if (json.trim().length === json.length)
          int32 = Number(json);
      }
      if (int32 === void 0)
        break;
      if (type == ScalarType.UINT32)
        assertUInt32(int32);
      else
        assertInt32(int32);
      return int32;
    case ScalarType.INT64:
    case ScalarType.SFIXED64:
    case ScalarType.SINT64:
      if (json === null)
        return protoInt64.zero;
      if (typeof json != "number" && typeof json != "string")
        break;
      const long = protoInt64.parse(json);
      return longType ? long.toString() : long;
    case ScalarType.FIXED64:
    case ScalarType.UINT64:
      if (json === null)
        return protoInt64.zero;
      if (typeof json != "number" && typeof json != "string")
        break;
      const uLong = protoInt64.uParse(json);
      return longType ? uLong.toString() : uLong;
    case ScalarType.BOOL:
      if (json === null)
        return false;
      if (typeof json !== "boolean")
        break;
      return json;
    case ScalarType.STRING:
      if (json === null)
        return "";
      if (typeof json !== "string") {
        break;
      }
      try {
        encodeURIComponent(json);
      } catch (e) {
        throw new Error("invalid UTF8");
      }
      return json;
    case ScalarType.BYTES:
      if (json === null || json === "")
        return new Uint8Array(0);
      if (typeof json !== "string")
        break;
      return protoBase64.dec(json);
  }
  throw new Error();
}
function readEnum(type, json, ignoreUnknownFields) {
  if (json === null) {
    return 0;
  }
  switch (typeof json) {
    case "number":
      if (Number.isInteger(json)) {
        return json;
      }
      break;
    case "string":
      const value = type.findName(json);
      if (value || ignoreUnknownFields) {
        return value === null || value === void 0 ? void 0 : value.no;
      }
      break;
  }
  throw new Error(`cannot decode enum ${type.typeName} from JSON: ${debugJsonValue(json)}`);
}
function writeEnum(type, value, emitIntrinsicDefault, enumAsInteger) {
  var _a;
  if (value === void 0) {
    return value;
  }
  if (value === 0 && !emitIntrinsicDefault) {
    return void 0;
  }
  if (enumAsInteger) {
    return value;
  }
  if (type.typeName == "google.protobuf.NullValue") {
    return null;
  }
  const val = type.findNumber(value);
  return (_a = val === null || val === void 0 ? void 0 : val.name) !== null && _a !== void 0 ? _a : value;
}
function writeScalar2(type, value, emitIntrinsicDefault) {
  if (value === void 0) {
    return void 0;
  }
  switch (type) {
    case ScalarType.INT32:
    case ScalarType.SFIXED32:
    case ScalarType.SINT32:
    case ScalarType.FIXED32:
    case ScalarType.UINT32:
      assert(typeof value == "number");
      return value != 0 || emitIntrinsicDefault ? value : void 0;
    case ScalarType.FLOAT:
    case ScalarType.DOUBLE:
      assert(typeof value == "number");
      if (Number.isNaN(value))
        return "NaN";
      if (value === Number.POSITIVE_INFINITY)
        return "Infinity";
      if (value === Number.NEGATIVE_INFINITY)
        return "-Infinity";
      return value !== 0 || emitIntrinsicDefault ? value : void 0;
    case ScalarType.STRING:
      assert(typeof value == "string");
      return value.length > 0 || emitIntrinsicDefault ? value : void 0;
    case ScalarType.BOOL:
      assert(typeof value == "boolean");
      return value || emitIntrinsicDefault ? value : void 0;
    case ScalarType.UINT64:
    case ScalarType.FIXED64:
    case ScalarType.INT64:
    case ScalarType.SFIXED64:
    case ScalarType.SINT64:
      assert(typeof value == "bigint" || typeof value == "string" || typeof value == "number");
      return emitIntrinsicDefault || value != 0 ? value.toString(10) : void 0;
    case ScalarType.BYTES:
      assert(value instanceof Uint8Array);
      return emitIntrinsicDefault || value.byteLength > 0 ? protoBase64.enc(value) : void 0;
  }
}

// ../node_modules/@bufbuild/protobuf/dist/esm/private/json-format-proto3.js
function makeJsonFormatProto3() {
  return makeJsonFormatCommon((writeEnum2, writeScalar3) => {
    return function writeField(field, value, options) {
      if (field.kind == "map") {
        const jsonObj = {};
        switch (field.V.kind) {
          case "scalar":
            for (const [entryKey, entryValue] of Object.entries(value)) {
              const val = writeScalar3(field.V.T, entryValue, true);
              assert(val !== void 0);
              jsonObj[entryKey.toString()] = val;
            }
            break;
          case "message":
            for (const [entryKey, entryValue] of Object.entries(value)) {
              jsonObj[entryKey.toString()] = entryValue.toJson(options);
            }
            break;
          case "enum":
            const enumType = field.V.T;
            for (const [entryKey, entryValue] of Object.entries(value)) {
              assert(entryValue === void 0 || typeof entryValue == "number");
              const val = writeEnum2(enumType, entryValue, true, options.enumAsInteger);
              assert(val !== void 0);
              jsonObj[entryKey.toString()] = val;
            }
            break;
        }
        return options.emitDefaultValues || Object.keys(jsonObj).length > 0 ? jsonObj : void 0;
      } else if (field.repeated) {
        const jsonArr = [];
        switch (field.kind) {
          case "scalar":
            for (let i = 0; i < value.length; i++) {
              jsonArr.push(writeScalar3(field.T, value[i], true));
            }
            break;
          case "enum":
            for (let i = 0; i < value.length; i++) {
              jsonArr.push(writeEnum2(field.T, value[i], true, options.enumAsInteger));
            }
            break;
          case "message":
            for (let i = 0; i < value.length; i++) {
              jsonArr.push(wrapField(field.T, value[i]).toJson(options));
            }
            break;
        }
        return options.emitDefaultValues || jsonArr.length > 0 ? jsonArr : void 0;
      } else {
        switch (field.kind) {
          case "scalar":
            return writeScalar3(field.T, value, !!field.oneof || field.opt || options.emitDefaultValues);
          case "enum":
            return writeEnum2(field.T, value, !!field.oneof || field.opt || options.emitDefaultValues, options.enumAsInteger);
          case "message":
            return value !== void 0 ? wrapField(field.T, value).toJson(options) : void 0;
        }
      }
    };
  });
}

// ../node_modules/@bufbuild/protobuf/dist/esm/private/util-common.js
function makeUtilCommon() {
  return {
    setEnumType,
    initPartial(source, target) {
      if (source === void 0) {
        return;
      }
      const type = target.getType();
      for (const member of type.fields.byMember()) {
        const localName = member.localName, t = target, s = source;
        if (s[localName] === void 0) {
          continue;
        }
        switch (member.kind) {
          case "oneof":
            const sk = s[localName].case;
            if (sk === void 0) {
              continue;
            }
            const sourceField = member.findField(sk);
            let val = s[localName].value;
            if (sourceField && sourceField.kind == "message" && !(val instanceof sourceField.T)) {
              val = new sourceField.T(val);
            } else if (sourceField && sourceField.kind === "scalar" && sourceField.T === ScalarType.BYTES) {
              val = toU8Arr(val);
            }
            t[localName] = { case: sk, value: val };
            break;
          case "scalar":
          case "enum":
            let copy = s[localName];
            if (member.T === ScalarType.BYTES) {
              copy = member.repeated ? copy.map(toU8Arr) : toU8Arr(copy);
            }
            t[localName] = copy;
            break;
          case "map":
            switch (member.V.kind) {
              case "scalar":
              case "enum":
                if (member.V.T === ScalarType.BYTES) {
                  for (const [k, v] of Object.entries(s[localName])) {
                    t[localName][k] = toU8Arr(v);
                  }
                } else {
                  Object.assign(t[localName], s[localName]);
                }
                break;
              case "message":
                const messageType = member.V.T;
                for (const k of Object.keys(s[localName])) {
                  let val2 = s[localName][k];
                  if (!messageType.fieldWrapper) {
                    val2 = new messageType(val2);
                  }
                  t[localName][k] = val2;
                }
                break;
            }
            break;
          case "message":
            const mt = member.T;
            if (member.repeated) {
              t[localName] = s[localName].map((val2) => val2 instanceof mt ? val2 : new mt(val2));
            } else if (s[localName] !== void 0) {
              const val2 = s[localName];
              if (mt.fieldWrapper) {
                if (
                  // We can't use BytesValue.typeName as that will create a circular import
                  mt.typeName === "google.protobuf.BytesValue"
                ) {
                  t[localName] = toU8Arr(val2);
                } else {
                  t[localName] = val2;
                }
              } else {
                t[localName] = val2 instanceof mt ? val2 : new mt(val2);
              }
            }
            break;
        }
      }
    },
    equals(type, a, b) {
      if (a === b) {
        return true;
      }
      if (!a || !b) {
        return false;
      }
      return type.fields.byMember().every((m) => {
        const va = a[m.localName];
        const vb = b[m.localName];
        if (m.repeated) {
          if (va.length !== vb.length) {
            return false;
          }
          switch (m.kind) {
            case "message":
              return va.every((a2, i) => m.T.equals(a2, vb[i]));
            case "scalar":
              return va.every((a2, i) => scalarEquals(m.T, a2, vb[i]));
            case "enum":
              return va.every((a2, i) => scalarEquals(ScalarType.INT32, a2, vb[i]));
          }
          throw new Error(`repeated cannot contain ${m.kind}`);
        }
        switch (m.kind) {
          case "message":
            return m.T.equals(va, vb);
          case "enum":
            return scalarEquals(ScalarType.INT32, va, vb);
          case "scalar":
            return scalarEquals(m.T, va, vb);
          case "oneof":
            if (va.case !== vb.case) {
              return false;
            }
            const s = m.findField(va.case);
            if (s === void 0) {
              return true;
            }
            switch (s.kind) {
              case "message":
                return s.T.equals(va.value, vb.value);
              case "enum":
                return scalarEquals(ScalarType.INT32, va.value, vb.value);
              case "scalar":
                return scalarEquals(s.T, va.value, vb.value);
            }
            throw new Error(`oneof cannot contain ${s.kind}`);
          case "map":
            const keys = Object.keys(va).concat(Object.keys(vb));
            switch (m.V.kind) {
              case "message":
                const messageType = m.V.T;
                return keys.every((k) => messageType.equals(va[k], vb[k]));
              case "enum":
                return keys.every((k) => scalarEquals(ScalarType.INT32, va[k], vb[k]));
              case "scalar":
                const scalarType = m.V.T;
                return keys.every((k) => scalarEquals(scalarType, va[k], vb[k]));
            }
            break;
        }
      });
    },
    clone(message) {
      const type = message.getType(), target = new type(), any = target;
      for (const member of type.fields.byMember()) {
        const source = message[member.localName];
        let copy;
        if (member.repeated) {
          copy = source.map(cloneSingularField);
        } else if (member.kind == "map") {
          copy = any[member.localName];
          for (const [key, v] of Object.entries(source)) {
            copy[key] = cloneSingularField(v);
          }
        } else if (member.kind == "oneof") {
          const f = member.findField(source.case);
          copy = f ? { case: source.case, value: cloneSingularField(source.value) } : { case: void 0 };
        } else {
          copy = cloneSingularField(source);
        }
        any[member.localName] = copy;
      }
      return target;
    }
  };
}
function cloneSingularField(value) {
  if (value === void 0) {
    return value;
  }
  if (value instanceof Message) {
    return value.clone();
  }
  if (value instanceof Uint8Array) {
    const c = new Uint8Array(value.byteLength);
    c.set(value);
    return c;
  }
  return value;
}
function toU8Arr(input) {
  return input instanceof Uint8Array ? input : new Uint8Array(input);
}

// ../node_modules/@bufbuild/protobuf/dist/esm/private/field-list.js
var InternalFieldList = class {
  constructor(fields, normalizer) {
    this._fields = fields;
    this._normalizer = normalizer;
  }
  findJsonName(jsonName) {
    if (!this.jsonNames) {
      const t = {};
      for (const f of this.list()) {
        t[f.jsonName] = t[f.name] = f;
      }
      this.jsonNames = t;
    }
    return this.jsonNames[jsonName];
  }
  find(fieldNo) {
    if (!this.numbers) {
      const t = {};
      for (const f of this.list()) {
        t[f.no] = f;
      }
      this.numbers = t;
    }
    return this.numbers[fieldNo];
  }
  list() {
    if (!this.all) {
      this.all = this._normalizer(this._fields);
    }
    return this.all;
  }
  byNumber() {
    if (!this.numbersAsc) {
      this.numbersAsc = this.list().concat().sort((a, b) => a.no - b.no);
    }
    return this.numbersAsc;
  }
  byMember() {
    if (!this.members) {
      this.members = [];
      const a = this.members;
      let o;
      for (const f of this.list()) {
        if (f.oneof) {
          if (f.oneof !== o) {
            o = f.oneof;
            a.push(o);
          }
        } else {
          a.push(f);
        }
      }
    }
    return this.members;
  }
};

// ../node_modules/@bufbuild/protobuf/dist/esm/private/names.js
function localFieldName(protoName, inOneof) {
  const name = protoCamelCase(protoName);
  if (inOneof) {
    return name;
  }
  return safeObjectProperty(safeMessageProperty(name));
}
function localOneofName(protoName) {
  return localFieldName(protoName, false);
}
var fieldJsonName = protoCamelCase;
function protoCamelCase(snakeCase) {
  let capNext = false;
  const b = [];
  for (let i = 0; i < snakeCase.length; i++) {
    let c = snakeCase.charAt(i);
    switch (c) {
      case "_":
        capNext = true;
        break;
      case "0":
      case "1":
      case "2":
      case "3":
      case "4":
      case "5":
      case "6":
      case "7":
      case "8":
      case "9":
        b.push(c);
        capNext = false;
        break;
      default:
        if (capNext) {
          capNext = false;
          c = c.toUpperCase();
        }
        b.push(c);
        break;
    }
  }
  return b.join("");
}
var reservedObjectProperties = /* @__PURE__ */ new Set([
  // names reserved by JavaScript
  "constructor",
  "toString",
  "toJSON",
  "valueOf"
]);
var reservedMessageProperties = /* @__PURE__ */ new Set([
  // names reserved by the runtime
  "getType",
  "clone",
  "equals",
  "fromBinary",
  "fromJson",
  "fromJsonString",
  "toBinary",
  "toJson",
  "toJsonString",
  // names reserved by the runtime for the future
  "toObject"
]);
var fallback = (name) => `${name}$`;
var safeMessageProperty = (name) => {
  if (reservedMessageProperties.has(name)) {
    return fallback(name);
  }
  return name;
};
var safeObjectProperty = (name) => {
  if (reservedObjectProperties.has(name)) {
    return fallback(name);
  }
  return name;
};

// ../node_modules/@bufbuild/protobuf/dist/esm/private/field.js
var InternalOneofInfo = class {
  constructor(name) {
    this.kind = "oneof";
    this.repeated = false;
    this.packed = false;
    this.opt = false;
    this.default = void 0;
    this.fields = [];
    this.name = name;
    this.localName = localOneofName(name);
  }
  addField(field) {
    assert(field.oneof === this, `field ${field.name} not one of ${this.name}`);
    this.fields.push(field);
  }
  findField(localName) {
    if (!this._lookup) {
      this._lookup = /* @__PURE__ */ Object.create(null);
      for (let i = 0; i < this.fields.length; i++) {
        this._lookup[this.fields[i].localName] = this.fields[i];
      }
    }
    return this._lookup[localName];
  }
};

// ../node_modules/@bufbuild/protobuf/dist/esm/proto3.js
var proto3 = makeProtoRuntime("proto3", makeJsonFormatProto3(), makeBinaryFormatProto3(), Object.assign(Object.assign({}, makeUtilCommon()), {
  newFieldList(fields) {
    return new InternalFieldList(fields, normalizeFieldInfosProto3);
  },
  initFields(target) {
    for (const member of target.getType().fields.byMember()) {
      if (member.opt) {
        continue;
      }
      const name = member.localName, t = target;
      if (member.repeated) {
        t[name] = [];
        continue;
      }
      switch (member.kind) {
        case "oneof":
          t[name] = { case: void 0 };
          break;
        case "enum":
          t[name] = 0;
          break;
        case "map":
          t[name] = {};
          break;
        case "scalar":
          t[name] = scalarDefaultValue(member.T, member.L);
          break;
        case "message":
          break;
      }
    }
  }
}));
function normalizeFieldInfosProto3(fieldInfos) {
  var _a, _b, _c, _d;
  const r = [];
  let o;
  for (const field of typeof fieldInfos == "function" ? fieldInfos() : fieldInfos) {
    const f = field;
    f.localName = localFieldName(field.name, field.oneof !== void 0);
    f.jsonName = (_a = field.jsonName) !== null && _a !== void 0 ? _a : fieldJsonName(field.name);
    f.repeated = (_b = field.repeated) !== null && _b !== void 0 ? _b : false;
    if (field.kind == "scalar") {
      f.L = (_c = field.L) !== null && _c !== void 0 ? _c : LongType.BIGINT;
    }
    f.packed = (_d = field.packed) !== null && _d !== void 0 ? _d : field.kind == "enum" || field.kind == "scalar" && field.T != ScalarType.BYTES && field.T != ScalarType.STRING;
    if (field.oneof !== void 0) {
      const ooname = typeof field.oneof == "string" ? field.oneof : field.oneof.name;
      if (!o || o.name != ooname) {
        o = new InternalOneofInfo(ooname);
      }
      f.oneof = o;
      o.addField(f);
    }
    r.push(f);
  }
  return r;
}

// ../node_modules/@bufbuild/protobuf/dist/esm/service-type.js
var MethodKind;
(function(MethodKind2) {
  MethodKind2[MethodKind2["Unary"] = 0] = "Unary";
  MethodKind2[MethodKind2["ServerStreaming"] = 1] = "ServerStreaming";
  MethodKind2[MethodKind2["ClientStreaming"] = 2] = "ClientStreaming";
  MethodKind2[MethodKind2["BiDiStreaming"] = 3] = "BiDiStreaming";
})(MethodKind || (MethodKind = {}));
var MethodIdempotency;
(function(MethodIdempotency2) {
  MethodIdempotency2[MethodIdempotency2["NoSideEffects"] = 1] = "NoSideEffects";
  MethodIdempotency2[MethodIdempotency2["Idempotent"] = 2] = "Idempotent";
})(MethodIdempotency || (MethodIdempotency = {}));

// gen/eliza_pb.ts
var _App = class _App extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: int32 id = 1;
     */
    this.id = 0;
    /**
     * @generated from field: string name = 2;
     */
    this.name = "";
    /**
     * @generated from field: string description = 3;
     */
    this.description = "";
    /**
     * @generated from field: string permissions = 4;
     */
    this.permissions = "";
    /**
     * @generated from field: bool public = 5;
     */
    this.public = false;
    /**
     * @generated from field: string metadata = 6;
     */
    this.metadata = "";
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _App().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _App().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _App().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_App, a, b);
  }
};
_App.runtime = proto3;
_App.typeName = "connectrpc.eliza.v1.App";
_App.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "id",
    kind: "scalar",
    T: 5
    /* ScalarType.INT32 */
  },
  {
    no: 2,
    name: "name",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  },
  {
    no: 3,
    name: "description",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  },
  {
    no: 4,
    name: "permissions",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  },
  {
    no: 5,
    name: "public",
    kind: "scalar",
    T: 8
    /* ScalarType.BOOL */
  },
  {
    no: 6,
    name: "metadata",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  }
]);
var App = _App;
var _Identity = class _Identity extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: string slack = 1;
     */
    this.slack = "";
    /**
     * @generated from field: repeated connectrpc.eliza.v1.Instance inventory = 2;
     */
    this.inventory = [];
    /**
     * @generated from field: string metadata = 3;
     */
    this.metadata = "";
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _Identity().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _Identity().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _Identity().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_Identity, a, b);
  }
};
_Identity.runtime = proto3;
_Identity.typeName = "connectrpc.eliza.v1.Identity";
_Identity.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "slack",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  },
  { no: 2, name: "inventory", kind: "message", T: Instance, repeated: true },
  {
    no: 3,
    name: "metadata",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  }
]);
var Identity = _Identity;
var _Item = class _Item extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: string name = 1;
     */
    this.name = "";
    /**
     * @generated from field: string image = 2;
     */
    this.image = "";
    /**
     * @generated from field: string description = 3;
     */
    this.description = "";
    /**
     * @generated from field: string reaction = 4;
     */
    this.reaction = "";
    /**
     * @generated from field: bool commodity = 5;
     */
    this.commodity = false;
    /**
     * @generated from field: bool tradable = 6;
     */
    this.tradable = false;
    /**
     * @generated from field: bool public = 7;
     */
    this.public = false;
    /**
     * @generated from field: string metadata = 8;
     */
    this.metadata = "";
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _Item().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _Item().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _Item().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_Item, a, b);
  }
};
_Item.runtime = proto3;
_Item.typeName = "connectrpc.eliza.v1.Item";
_Item.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "name",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  },
  {
    no: 2,
    name: "image",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  },
  {
    no: 3,
    name: "description",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  },
  {
    no: 4,
    name: "reaction",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  },
  {
    no: 5,
    name: "commodity",
    kind: "scalar",
    T: 8
    /* ScalarType.BOOL */
  },
  {
    no: 6,
    name: "tradable",
    kind: "scalar",
    T: 8
    /* ScalarType.BOOL */
  },
  {
    no: 7,
    name: "public",
    kind: "scalar",
    T: 8
    /* ScalarType.BOOL */
  },
  {
    no: 8,
    name: "metadata",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  }
]);
var Item = _Item;
var _Instance = class _Instance extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: int32 id = 1;
     */
    this.id = 0;
    /**
     * @generated from field: string itemId = 2;
     */
    this.itemId = "";
    /**
     * @generated from field: string identityId = 3;
     */
    this.identityId = "";
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _Instance().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _Instance().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _Instance().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_Instance, a, b);
  }
};
_Instance.runtime = proto3;
_Instance.typeName = "connectrpc.eliza.v1.Instance";
_Instance.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "id",
    kind: "scalar",
    T: 5
    /* ScalarType.INT32 */
  },
  {
    no: 2,
    name: "itemId",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  },
  {
    no: 3,
    name: "identityId",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  },
  { no: 4, name: "item", kind: "message", T: Item }
]);
var Instance = _Instance;
var _RecipeResponse = class _RecipeResponse extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: int32 id = 1;
     */
    this.id = 0;
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _RecipeResponse().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _RecipeResponse().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _RecipeResponse().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_RecipeResponse, a, b);
  }
};
_RecipeResponse.runtime = proto3;
_RecipeResponse.typeName = "connectrpc.eliza.v1.RecipeResponse";
_RecipeResponse.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "id",
    kind: "scalar",
    T: 5
    /* ScalarType.INT32 */
  }
]);
var RecipeResponse = _RecipeResponse;
var _TradeResponse = class _TradeResponse extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: int32 id = 1;
     */
    this.id = 0;
    /**
     * @generated from field: string initiatorIdentityId = 2;
     */
    this.initiatorIdentityId = "";
    /**
     * @generated from field: string receiverIdentityId = 3;
     */
    this.receiverIdentityId = "";
    /**
     * @generated from field: bool public = 4;
     */
    this.public = false;
    /**
     * @generated from field: bool closed = 5;
     */
    this.closed = false;
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _TradeResponse().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _TradeResponse().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _TradeResponse().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_TradeResponse, a, b);
  }
};
_TradeResponse.runtime = proto3;
_TradeResponse.typeName = "connectrpc.eliza.v1.TradeResponse";
_TradeResponse.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "id",
    kind: "scalar",
    T: 5
    /* ScalarType.INT32 */
  },
  {
    no: 2,
    name: "initiatorIdentityId",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  },
  {
    no: 3,
    name: "receiverIdentityId",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  },
  {
    no: 4,
    name: "public",
    kind: "scalar",
    T: 8
    /* ScalarType.BOOL */
  },
  {
    no: 5,
    name: "closed",
    kind: "scalar",
    T: 8
    /* ScalarType.BOOL */
  }
]);
var TradeResponse = _TradeResponse;
var _CreateInstanceRequest = class _CreateInstanceRequest extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: int32 appId = 1;
     */
    this.appId = 0;
    /**
     * @generated from field: string key = 2;
     */
    this.key = "";
    /**
     * @generated from field: string itemId = 3;
     */
    this.itemId = "";
    /**
     * @generated from field: string identityId = 4;
     */
    this.identityId = "";
    /**
     * @generated from field: int32 quantity = 5;
     */
    this.quantity = 0;
    /**
     * @generated from field: string metadata = 6;
     */
    this.metadata = "";
    /**
     * @generated from field: string note = 7;
     */
    this.note = "";
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _CreateInstanceRequest().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _CreateInstanceRequest().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _CreateInstanceRequest().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_CreateInstanceRequest, a, b);
  }
};
_CreateInstanceRequest.runtime = proto3;
_CreateInstanceRequest.typeName = "connectrpc.eliza.v1.CreateInstanceRequest";
_CreateInstanceRequest.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "appId",
    kind: "scalar",
    T: 5
    /* ScalarType.INT32 */
  },
  {
    no: 2,
    name: "key",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  },
  {
    no: 3,
    name: "itemId",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  },
  {
    no: 4,
    name: "identityId",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  },
  {
    no: 5,
    name: "quantity",
    kind: "scalar",
    T: 5
    /* ScalarType.INT32 */
  },
  {
    no: 6,
    name: "metadata",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  },
  {
    no: 7,
    name: "note",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  }
]);
var CreateInstanceRequest = _CreateInstanceRequest;
var _CreateInstanceResponse = class _CreateInstanceResponse extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: string response = 1;
     */
    this.response = "";
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _CreateInstanceResponse().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _CreateInstanceResponse().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _CreateInstanceResponse().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_CreateInstanceResponse, a, b);
  }
};
_CreateInstanceResponse.runtime = proto3;
_CreateInstanceResponse.typeName = "connectrpc.eliza.v1.CreateInstanceResponse";
_CreateInstanceResponse.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "response",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  },
  { no: 2, name: "instance", kind: "message", T: Instance }
]);
var CreateInstanceResponse = _CreateInstanceResponse;
var _CreateAppRequest = class _CreateAppRequest extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: int32 appId = 1;
     */
    this.appId = 0;
    /**
     * @generated from field: string key = 2;
     */
    this.key = "";
    /**
     * @generated from field: string name = 3;
     */
    this.name = "";
    /**
     * @generated from field: string description = 4;
     */
    this.description = "";
    /**
     * @generated from field: int32 permissions = 5;
     */
    this.permissions = 0;
    /**
     * @generated from field: bool public = 6;
     */
    this.public = false;
    /**
     * @generated from field: string metadata = 7;
     */
    this.metadata = "";
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _CreateAppRequest().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _CreateAppRequest().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _CreateAppRequest().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_CreateAppRequest, a, b);
  }
};
_CreateAppRequest.runtime = proto3;
_CreateAppRequest.typeName = "connectrpc.eliza.v1.CreateAppRequest";
_CreateAppRequest.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "appId",
    kind: "scalar",
    T: 5
    /* ScalarType.INT32 */
  },
  {
    no: 2,
    name: "key",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  },
  {
    no: 3,
    name: "name",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  },
  {
    no: 4,
    name: "description",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  },
  {
    no: 5,
    name: "permissions",
    kind: "scalar",
    T: 5
    /* ScalarType.INT32 */
  },
  {
    no: 6,
    name: "public",
    kind: "scalar",
    T: 8
    /* ScalarType.BOOL */
  },
  {
    no: 7,
    name: "metadata",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  }
]);
var CreateAppRequest = _CreateAppRequest;
var _CreateAppResponse = class _CreateAppResponse extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: string response = 1;
     */
    this.response = "";
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _CreateAppResponse().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _CreateAppResponse().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _CreateAppResponse().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_CreateAppResponse, a, b);
  }
};
_CreateAppResponse.runtime = proto3;
_CreateAppResponse.typeName = "connectrpc.eliza.v1.CreateAppResponse";
_CreateAppResponse.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "response",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  },
  { no: 2, name: "app", kind: "message", T: App }
]);
var CreateAppResponse = _CreateAppResponse;
var _CreateItemRequest = class _CreateItemRequest extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: int32 appId = 1;
     */
    this.appId = 0;
    /**
     * @generated from field: string key = 2;
     */
    this.key = "";
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _CreateItemRequest().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _CreateItemRequest().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _CreateItemRequest().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_CreateItemRequest, a, b);
  }
};
_CreateItemRequest.runtime = proto3;
_CreateItemRequest.typeName = "connectrpc.eliza.v1.CreateItemRequest";
_CreateItemRequest.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "appId",
    kind: "scalar",
    T: 5
    /* ScalarType.INT32 */
  },
  {
    no: 2,
    name: "key",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  },
  { no: 3, name: "item", kind: "message", T: Item }
]);
var CreateItemRequest = _CreateItemRequest;
var _CreateItemResponse = class _CreateItemResponse extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: string response = 1;
     */
    this.response = "";
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _CreateItemResponse().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _CreateItemResponse().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _CreateItemResponse().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_CreateItemResponse, a, b);
  }
};
_CreateItemResponse.runtime = proto3;
_CreateItemResponse.typeName = "connectrpc.eliza.v1.CreateItemResponse";
_CreateItemResponse.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "response",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  },
  { no: 2, name: "item", kind: "message", T: Item }
]);
var CreateItemResponse = _CreateItemResponse;
var _CreateRecipeRequest = class _CreateRecipeRequest extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: int32 appId = 1;
     */
    this.appId = 0;
    /**
     * @generated from field: string key = 2;
     */
    this.key = "";
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _CreateRecipeRequest().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _CreateRecipeRequest().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _CreateRecipeRequest().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_CreateRecipeRequest, a, b);
  }
};
_CreateRecipeRequest.runtime = proto3;
_CreateRecipeRequest.typeName = "connectrpc.eliza.v1.CreateRecipeRequest";
_CreateRecipeRequest.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "appId",
    kind: "scalar",
    T: 5
    /* ScalarType.INT32 */
  },
  {
    no: 2,
    name: "key",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  }
]);
var CreateRecipeRequest = _CreateRecipeRequest;
var _CreateRecipeResponse = class _CreateRecipeResponse extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: string response = 1;
     */
    this.response = "";
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _CreateRecipeResponse().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _CreateRecipeResponse().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _CreateRecipeResponse().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_CreateRecipeResponse, a, b);
  }
};
_CreateRecipeResponse.runtime = proto3;
_CreateRecipeResponse.typeName = "connectrpc.eliza.v1.CreateRecipeResponse";
_CreateRecipeResponse.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "response",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  }
]);
var CreateRecipeResponse = _CreateRecipeResponse;
var _CreateTradeRequest = class _CreateTradeRequest extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: int32 appId = 1;
     */
    this.appId = 0;
    /**
     * @generated from field: string key = 2;
     */
    this.key = "";
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _CreateTradeRequest().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _CreateTradeRequest().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _CreateTradeRequest().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_CreateTradeRequest, a, b);
  }
};
_CreateTradeRequest.runtime = proto3;
_CreateTradeRequest.typeName = "connectrpc.eliza.v1.CreateTradeRequest";
_CreateTradeRequest.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "appId",
    kind: "scalar",
    T: 5
    /* ScalarType.INT32 */
  },
  {
    no: 2,
    name: "key",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  }
]);
var CreateTradeRequest = _CreateTradeRequest;
var _CreateTradeResponse = class _CreateTradeResponse extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: string response = 1;
     */
    this.response = "";
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _CreateTradeResponse().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _CreateTradeResponse().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _CreateTradeResponse().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_CreateTradeResponse, a, b);
  }
};
_CreateTradeResponse.runtime = proto3;
_CreateTradeResponse.typeName = "connectrpc.eliza.v1.CreateTradeResponse";
_CreateTradeResponse.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "response",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  }
]);
var CreateTradeResponse = _CreateTradeResponse;
var _ReadIdentityRequest = class _ReadIdentityRequest extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: int32 appId = 1;
     */
    this.appId = 0;
    /**
     * @generated from field: string key = 2;
     */
    this.key = "";
    /**
     * @generated from field: string identityId = 3;
     */
    this.identityId = "";
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _ReadIdentityRequest().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _ReadIdentityRequest().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _ReadIdentityRequest().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_ReadIdentityRequest, a, b);
  }
};
_ReadIdentityRequest.runtime = proto3;
_ReadIdentityRequest.typeName = "connectrpc.eliza.v1.ReadIdentityRequest";
_ReadIdentityRequest.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "appId",
    kind: "scalar",
    T: 5
    /* ScalarType.INT32 */
  },
  {
    no: 2,
    name: "key",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  },
  {
    no: 3,
    name: "identityId",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  }
]);
var ReadIdentityRequest = _ReadIdentityRequest;
var _ReadIdentityResponse = class _ReadIdentityResponse extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: string response = 1;
     */
    this.response = "";
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _ReadIdentityResponse().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _ReadIdentityResponse().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _ReadIdentityResponse().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_ReadIdentityResponse, a, b);
  }
};
_ReadIdentityResponse.runtime = proto3;
_ReadIdentityResponse.typeName = "connectrpc.eliza.v1.ReadIdentityResponse";
_ReadIdentityResponse.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "response",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  },
  { no: 2, name: "identity", kind: "message", T: Identity }
]);
var ReadIdentityResponse = _ReadIdentityResponse;
var _ReadInventoryRequest = class _ReadInventoryRequest extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: int32 appId = 1;
     */
    this.appId = 0;
    /**
     * @generated from field: string key = 2;
     */
    this.key = "";
    /**
     * @generated from field: string identityId = 3;
     */
    this.identityId = "";
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _ReadInventoryRequest().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _ReadInventoryRequest().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _ReadInventoryRequest().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_ReadInventoryRequest, a, b);
  }
};
_ReadInventoryRequest.runtime = proto3;
_ReadInventoryRequest.typeName = "connectrpc.eliza.v1.ReadInventoryRequest";
_ReadInventoryRequest.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "appId",
    kind: "scalar",
    T: 5
    /* ScalarType.INT32 */
  },
  {
    no: 2,
    name: "key",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  },
  {
    no: 3,
    name: "identityId",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  }
]);
var ReadInventoryRequest = _ReadInventoryRequest;
var _ReadInventoryResponse = class _ReadInventoryResponse extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: string response = 1;
     */
    this.response = "";
    /**
     * @generated from field: repeated connectrpc.eliza.v1.Instance inventory = 2;
     */
    this.inventory = [];
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _ReadInventoryResponse().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _ReadInventoryResponse().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _ReadInventoryResponse().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_ReadInventoryResponse, a, b);
  }
};
_ReadInventoryResponse.runtime = proto3;
_ReadInventoryResponse.typeName = "connectrpc.eliza.v1.ReadInventoryResponse";
_ReadInventoryResponse.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "response",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  },
  { no: 2, name: "inventory", kind: "message", T: Instance, repeated: true }
]);
var ReadInventoryResponse = _ReadInventoryResponse;
var _ReadItemRequest = class _ReadItemRequest extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: int32 appId = 1;
     */
    this.appId = 0;
    /**
     * @generated from field: string key = 2;
     */
    this.key = "";
    /**
     * @generated from field: string query = 3;
     */
    this.query = "";
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _ReadItemRequest().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _ReadItemRequest().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _ReadItemRequest().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_ReadItemRequest, a, b);
  }
};
_ReadItemRequest.runtime = proto3;
_ReadItemRequest.typeName = "connectrpc.eliza.v1.ReadItemRequest";
_ReadItemRequest.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "appId",
    kind: "scalar",
    T: 5
    /* ScalarType.INT32 */
  },
  {
    no: 2,
    name: "key",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  },
  {
    no: 3,
    name: "query",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  }
]);
var ReadItemRequest = _ReadItemRequest;
var _ReadItemResponse = class _ReadItemResponse extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: string response = 1;
     */
    this.response = "";
    /**
     * @generated from field: repeated connectrpc.eliza.v1.Item items = 2;
     */
    this.items = [];
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _ReadItemResponse().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _ReadItemResponse().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _ReadItemResponse().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_ReadItemResponse, a, b);
  }
};
_ReadItemResponse.runtime = proto3;
_ReadItemResponse.typeName = "connectrpc.eliza.v1.ReadItemResponse";
_ReadItemResponse.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "response",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  },
  { no: 2, name: "items", kind: "message", T: Item, repeated: true }
]);
var ReadItemResponse = _ReadItemResponse;
var _ReadInstanceRequest = class _ReadInstanceRequest extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: int32 appId = 1;
     */
    this.appId = 0;
    /**
     * @generated from field: string key = 2;
     */
    this.key = "";
    /**
     * @generated from field: int32 instanceId = 3;
     */
    this.instanceId = 0;
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _ReadInstanceRequest().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _ReadInstanceRequest().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _ReadInstanceRequest().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_ReadInstanceRequest, a, b);
  }
};
_ReadInstanceRequest.runtime = proto3;
_ReadInstanceRequest.typeName = "connectrpc.eliza.v1.ReadInstanceRequest";
_ReadInstanceRequest.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "appId",
    kind: "scalar",
    T: 5
    /* ScalarType.INT32 */
  },
  {
    no: 2,
    name: "key",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  },
  {
    no: 3,
    name: "instanceId",
    kind: "scalar",
    T: 5
    /* ScalarType.INT32 */
  }
]);
var ReadInstanceRequest = _ReadInstanceRequest;
var _ReadInstanceResponse = class _ReadInstanceResponse extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: string response = 1;
     */
    this.response = "";
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _ReadInstanceResponse().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _ReadInstanceResponse().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _ReadInstanceResponse().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_ReadInstanceResponse, a, b);
  }
};
_ReadInstanceResponse.runtime = proto3;
_ReadInstanceResponse.typeName = "connectrpc.eliza.v1.ReadInstanceResponse";
_ReadInstanceResponse.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "response",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  },
  { no: 2, name: "instance", kind: "message", T: Instance }
]);
var ReadInstanceResponse = _ReadInstanceResponse;
var _ReadAppRequest = class _ReadAppRequest extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: int32 appId = 1;
     */
    this.appId = 0;
    /**
     * @generated from field: string key = 2;
     */
    this.key = "";
    /**
     * @generated from field: int32 optAppId = 3;
     */
    this.optAppId = 0;
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _ReadAppRequest().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _ReadAppRequest().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _ReadAppRequest().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_ReadAppRequest, a, b);
  }
};
_ReadAppRequest.runtime = proto3;
_ReadAppRequest.typeName = "connectrpc.eliza.v1.ReadAppRequest";
_ReadAppRequest.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "appId",
    kind: "scalar",
    T: 5
    /* ScalarType.INT32 */
  },
  {
    no: 2,
    name: "key",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  },
  {
    no: 3,
    name: "optAppId",
    kind: "scalar",
    T: 5
    /* ScalarType.INT32 */
  }
]);
var ReadAppRequest = _ReadAppRequest;
var _ReadAppResponse = class _ReadAppResponse extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: string response = 1;
     */
    this.response = "";
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _ReadAppResponse().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _ReadAppResponse().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _ReadAppResponse().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_ReadAppResponse, a, b);
  }
};
_ReadAppResponse.runtime = proto3;
_ReadAppResponse.typeName = "connectrpc.eliza.v1.ReadAppResponse";
_ReadAppResponse.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "response",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  },
  { no: 2, name: "app", kind: "message", T: App }
]);
var ReadAppResponse = _ReadAppResponse;
var _ReadTradeRequest = class _ReadTradeRequest extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: int32 appId = 1;
     */
    this.appId = 0;
    /**
     * @generated from field: string key = 2;
     */
    this.key = "";
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _ReadTradeRequest().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _ReadTradeRequest().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _ReadTradeRequest().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_ReadTradeRequest, a, b);
  }
};
_ReadTradeRequest.runtime = proto3;
_ReadTradeRequest.typeName = "connectrpc.eliza.v1.ReadTradeRequest";
_ReadTradeRequest.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "appId",
    kind: "scalar",
    T: 5
    /* ScalarType.INT32 */
  },
  {
    no: 2,
    name: "key",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  }
]);
var ReadTradeRequest = _ReadTradeRequest;
var _ReadTradeResponse = class _ReadTradeResponse extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: string response = 1;
     */
    this.response = "";
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _ReadTradeResponse().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _ReadTradeResponse().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _ReadTradeResponse().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_ReadTradeResponse, a, b);
  }
};
_ReadTradeResponse.runtime = proto3;
_ReadTradeResponse.typeName = "connectrpc.eliza.v1.ReadTradeResponse";
_ReadTradeResponse.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "response",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  }
]);
var ReadTradeResponse = _ReadTradeResponse;
var _ReadRecipeRequest = class _ReadRecipeRequest extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: int32 appId = 1;
     */
    this.appId = 0;
    /**
     * @generated from field: string key = 2;
     */
    this.key = "";
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _ReadRecipeRequest().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _ReadRecipeRequest().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _ReadRecipeRequest().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_ReadRecipeRequest, a, b);
  }
};
_ReadRecipeRequest.runtime = proto3;
_ReadRecipeRequest.typeName = "connectrpc.eliza.v1.ReadRecipeRequest";
_ReadRecipeRequest.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "appId",
    kind: "scalar",
    T: 5
    /* ScalarType.INT32 */
  },
  {
    no: 2,
    name: "key",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  }
]);
var ReadRecipeRequest = _ReadRecipeRequest;
var _ReadRecipeResponse = class _ReadRecipeResponse extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: string response = 1;
     */
    this.response = "";
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _ReadRecipeResponse().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _ReadRecipeResponse().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _ReadRecipeResponse().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_ReadRecipeResponse, a, b);
  }
};
_ReadRecipeResponse.runtime = proto3;
_ReadRecipeResponse.typeName = "connectrpc.eliza.v1.ReadRecipeResponse";
_ReadRecipeResponse.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "response",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  }
]);
var ReadRecipeResponse = _ReadRecipeResponse;
var _UpdateIdentityMetadataRequest = class _UpdateIdentityMetadataRequest extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: int32 appId = 1;
     */
    this.appId = 0;
    /**
     * @generated from field: string key = 2;
     */
    this.key = "";
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _UpdateIdentityMetadataRequest().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _UpdateIdentityMetadataRequest().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _UpdateIdentityMetadataRequest().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_UpdateIdentityMetadataRequest, a, b);
  }
};
_UpdateIdentityMetadataRequest.runtime = proto3;
_UpdateIdentityMetadataRequest.typeName = "connectrpc.eliza.v1.UpdateIdentityMetadataRequest";
_UpdateIdentityMetadataRequest.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "appId",
    kind: "scalar",
    T: 5
    /* ScalarType.INT32 */
  },
  {
    no: 2,
    name: "key",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  }
]);
var UpdateIdentityMetadataRequest = _UpdateIdentityMetadataRequest;
var _UpdateIdentityMetadataResponse = class _UpdateIdentityMetadataResponse extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: string response = 1;
     */
    this.response = "";
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _UpdateIdentityMetadataResponse().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _UpdateIdentityMetadataResponse().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _UpdateIdentityMetadataResponse().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_UpdateIdentityMetadataResponse, a, b);
  }
};
_UpdateIdentityMetadataResponse.runtime = proto3;
_UpdateIdentityMetadataResponse.typeName = "connectrpc.eliza.v1.UpdateIdentityMetadataResponse";
_UpdateIdentityMetadataResponse.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "response",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  }
]);
var UpdateIdentityMetadataResponse = _UpdateIdentityMetadataResponse;
var _UpdateInstanceRequest = class _UpdateInstanceRequest extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: int32 appId = 1;
     */
    this.appId = 0;
    /**
     * @generated from field: string key = 2;
     */
    this.key = "";
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _UpdateInstanceRequest().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _UpdateInstanceRequest().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _UpdateInstanceRequest().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_UpdateInstanceRequest, a, b);
  }
};
_UpdateInstanceRequest.runtime = proto3;
_UpdateInstanceRequest.typeName = "connectrpc.eliza.v1.UpdateInstanceRequest";
_UpdateInstanceRequest.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "appId",
    kind: "scalar",
    T: 5
    /* ScalarType.INT32 */
  },
  {
    no: 2,
    name: "key",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  }
]);
var UpdateInstanceRequest = _UpdateInstanceRequest;
var _UpdateInstanceResponse = class _UpdateInstanceResponse extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: string response = 1;
     */
    this.response = "";
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _UpdateInstanceResponse().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _UpdateInstanceResponse().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _UpdateInstanceResponse().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_UpdateInstanceResponse, a, b);
  }
};
_UpdateInstanceResponse.runtime = proto3;
_UpdateInstanceResponse.typeName = "connectrpc.eliza.v1.UpdateInstanceResponse";
_UpdateInstanceResponse.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "response",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  }
]);
var UpdateInstanceResponse = _UpdateInstanceResponse;
var _UpdateItemRequest = class _UpdateItemRequest extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: int32 appId = 1;
     */
    this.appId = 0;
    /**
     * @generated from field: string key = 2;
     */
    this.key = "";
    /**
     * @generated from field: string itemId = 3;
     */
    this.itemId = "";
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _UpdateItemRequest().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _UpdateItemRequest().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _UpdateItemRequest().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_UpdateItemRequest, a, b);
  }
};
_UpdateItemRequest.runtime = proto3;
_UpdateItemRequest.typeName = "connectrpc.eliza.v1.UpdateItemRequest";
_UpdateItemRequest.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "appId",
    kind: "scalar",
    T: 5
    /* ScalarType.INT32 */
  },
  {
    no: 2,
    name: "key",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  },
  {
    no: 3,
    name: "itemId",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  },
  { no: 4, name: "new", kind: "message", T: Item }
]);
var UpdateItemRequest = _UpdateItemRequest;
var _UpdateItemResponse = class _UpdateItemResponse extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: string response = 1;
     */
    this.response = "";
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _UpdateItemResponse().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _UpdateItemResponse().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _UpdateItemResponse().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_UpdateItemResponse, a, b);
  }
};
_UpdateItemResponse.runtime = proto3;
_UpdateItemResponse.typeName = "connectrpc.eliza.v1.UpdateItemResponse";
_UpdateItemResponse.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "response",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  },
  { no: 2, name: "item", kind: "message", T: Item }
]);
var UpdateItemResponse = _UpdateItemResponse;
var _UpdateAppRequest = class _UpdateAppRequest extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: int32 appId = 1;
     */
    this.appId = 0;
    /**
     * @generated from field: string key = 2;
     */
    this.key = "";
    /**
     * @generated from field: int32 optAppId = 3;
     */
    this.optAppId = 0;
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _UpdateAppRequest().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _UpdateAppRequest().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _UpdateAppRequest().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_UpdateAppRequest, a, b);
  }
};
_UpdateAppRequest.runtime = proto3;
_UpdateAppRequest.typeName = "connectrpc.eliza.v1.UpdateAppRequest";
_UpdateAppRequest.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "appId",
    kind: "scalar",
    T: 5
    /* ScalarType.INT32 */
  },
  {
    no: 2,
    name: "key",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  },
  {
    no: 3,
    name: "optAppId",
    kind: "scalar",
    T: 5
    /* ScalarType.INT32 */
  },
  { no: 4, name: "new", kind: "message", T: App }
]);
var UpdateAppRequest = _UpdateAppRequest;
var _UpdateAppResponse = class _UpdateAppResponse extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: string response = 1;
     */
    this.response = "";
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _UpdateAppResponse().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _UpdateAppResponse().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _UpdateAppResponse().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_UpdateAppResponse, a, b);
  }
};
_UpdateAppResponse.runtime = proto3;
_UpdateAppResponse.typeName = "connectrpc.eliza.v1.UpdateAppResponse";
_UpdateAppResponse.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "response",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  },
  { no: 2, name: "app", kind: "message", T: App }
]);
var UpdateAppResponse = _UpdateAppResponse;
var _UpdateTradeRequest = class _UpdateTradeRequest extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: int32 appId = 1;
     */
    this.appId = 0;
    /**
     * @generated from field: string key = 2;
     */
    this.key = "";
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _UpdateTradeRequest().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _UpdateTradeRequest().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _UpdateTradeRequest().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_UpdateTradeRequest, a, b);
  }
};
_UpdateTradeRequest.runtime = proto3;
_UpdateTradeRequest.typeName = "connectrpc.eliza.v1.UpdateTradeRequest";
_UpdateTradeRequest.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "appId",
    kind: "scalar",
    T: 5
    /* ScalarType.INT32 */
  },
  {
    no: 2,
    name: "key",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  }
]);
var UpdateTradeRequest = _UpdateTradeRequest;
var _UpdateTradeResponse = class _UpdateTradeResponse extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: string response = 1;
     */
    this.response = "";
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _UpdateTradeResponse().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _UpdateTradeResponse().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _UpdateTradeResponse().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_UpdateTradeResponse, a, b);
  }
};
_UpdateTradeResponse.runtime = proto3;
_UpdateTradeResponse.typeName = "connectrpc.eliza.v1.UpdateTradeResponse";
_UpdateTradeResponse.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "response",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  }
]);
var UpdateTradeResponse = _UpdateTradeResponse;
var _UpdateRecipeRequest = class _UpdateRecipeRequest extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: int32 appId = 1;
     */
    this.appId = 0;
    /**
     * @generated from field: string key = 2;
     */
    this.key = "";
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _UpdateRecipeRequest().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _UpdateRecipeRequest().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _UpdateRecipeRequest().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_UpdateRecipeRequest, a, b);
  }
};
_UpdateRecipeRequest.runtime = proto3;
_UpdateRecipeRequest.typeName = "connectrpc.eliza.v1.UpdateRecipeRequest";
_UpdateRecipeRequest.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "appId",
    kind: "scalar",
    T: 5
    /* ScalarType.INT32 */
  },
  {
    no: 2,
    name: "key",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  }
]);
var UpdateRecipeRequest = _UpdateRecipeRequest;
var _UpdateRecipeResponse = class _UpdateRecipeResponse extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: string response = 1;
     */
    this.response = "";
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _UpdateRecipeResponse().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _UpdateRecipeResponse().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _UpdateRecipeResponse().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_UpdateRecipeResponse, a, b);
  }
};
_UpdateRecipeResponse.runtime = proto3;
_UpdateRecipeResponse.typeName = "connectrpc.eliza.v1.UpdateRecipeResponse";
_UpdateRecipeResponse.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "response",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  }
]);
var UpdateRecipeResponse = _UpdateRecipeResponse;
var _DeleteAppRequest = class _DeleteAppRequest extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: int32 appId = 1;
     */
    this.appId = 0;
    /**
     * @generated from field: string key = 2;
     */
    this.key = "";
    /**
     * @generated from field: int32 deleteAppId = 3;
     */
    this.deleteAppId = 0;
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _DeleteAppRequest().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _DeleteAppRequest().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _DeleteAppRequest().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_DeleteAppRequest, a, b);
  }
};
_DeleteAppRequest.runtime = proto3;
_DeleteAppRequest.typeName = "connectrpc.eliza.v1.DeleteAppRequest";
_DeleteAppRequest.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "appId",
    kind: "scalar",
    T: 5
    /* ScalarType.INT32 */
  },
  {
    no: 2,
    name: "key",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  },
  {
    no: 3,
    name: "deleteAppId",
    kind: "scalar",
    T: 5
    /* ScalarType.INT32 */
  }
]);
var DeleteAppRequest = _DeleteAppRequest;
var _DeleteAppResponse = class _DeleteAppResponse extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: string response = 1;
     */
    this.response = "";
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _DeleteAppResponse().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _DeleteAppResponse().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _DeleteAppResponse().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_DeleteAppResponse, a, b);
  }
};
_DeleteAppResponse.runtime = proto3;
_DeleteAppResponse.typeName = "connectrpc.eliza.v1.DeleteAppResponse";
_DeleteAppResponse.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "response",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  }
]);
var DeleteAppResponse = _DeleteAppResponse;
var _DeleteInstanceRequest = class _DeleteInstanceRequest extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: int32 appId = 1;
     */
    this.appId = 0;
    /**
     * @generated from field: string key = 2;
     */
    this.key = "";
    /**
     * @generated from field: int32 instanceId = 3;
     */
    this.instanceId = 0;
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _DeleteInstanceRequest().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _DeleteInstanceRequest().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _DeleteInstanceRequest().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_DeleteInstanceRequest, a, b);
  }
};
_DeleteInstanceRequest.runtime = proto3;
_DeleteInstanceRequest.typeName = "connectrpc.eliza.v1.DeleteInstanceRequest";
_DeleteInstanceRequest.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "appId",
    kind: "scalar",
    T: 5
    /* ScalarType.INT32 */
  },
  {
    no: 2,
    name: "key",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  },
  {
    no: 3,
    name: "instanceId",
    kind: "scalar",
    T: 5
    /* ScalarType.INT32 */
  }
]);
var DeleteInstanceRequest = _DeleteInstanceRequest;
var _DeleteInstanceResponse = class _DeleteInstanceResponse extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: string response = 1;
     */
    this.response = "";
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _DeleteInstanceResponse().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _DeleteInstanceResponse().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _DeleteInstanceResponse().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_DeleteInstanceResponse, a, b);
  }
};
_DeleteInstanceResponse.runtime = proto3;
_DeleteInstanceResponse.typeName = "connectrpc.eliza.v1.DeleteInstanceResponse";
_DeleteInstanceResponse.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "response",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  },
  { no: 2, name: "deletedInstance", kind: "message", T: Instance }
]);
var DeleteInstanceResponse = _DeleteInstanceResponse;
var _CloseTradeRequest = class _CloseTradeRequest extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: int32 appId = 1;
     */
    this.appId = 0;
    /**
     * @generated from field: string key = 2;
     */
    this.key = "";
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _CloseTradeRequest().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _CloseTradeRequest().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _CloseTradeRequest().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_CloseTradeRequest, a, b);
  }
};
_CloseTradeRequest.runtime = proto3;
_CloseTradeRequest.typeName = "connectrpc.eliza.v1.CloseTradeRequest";
_CloseTradeRequest.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "appId",
    kind: "scalar",
    T: 5
    /* ScalarType.INT32 */
  },
  {
    no: 2,
    name: "key",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  }
]);
var CloseTradeRequest = _CloseTradeRequest;
var _CloseTradeResponse = class _CloseTradeResponse extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: string response = 1;
     */
    this.response = "";
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _CloseTradeResponse().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _CloseTradeResponse().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _CloseTradeResponse().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_CloseTradeResponse, a, b);
  }
};
_CloseTradeResponse.runtime = proto3;
_CloseTradeResponse.typeName = "connectrpc.eliza.v1.CloseTradeResponse";
_CloseTradeResponse.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "response",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  }
]);
var CloseTradeResponse = _CloseTradeResponse;
var _VerifyKeyRequest = class _VerifyKeyRequest extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: int32 appId = 1;
     */
    this.appId = 0;
    /**
     * @generated from field: string key = 2;
     */
    this.key = "";
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _VerifyKeyRequest().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _VerifyKeyRequest().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _VerifyKeyRequest().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_VerifyKeyRequest, a, b);
  }
};
_VerifyKeyRequest.runtime = proto3;
_VerifyKeyRequest.typeName = "connectrpc.eliza.v1.VerifyKeyRequest";
_VerifyKeyRequest.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "appId",
    kind: "scalar",
    T: 5
    /* ScalarType.INT32 */
  },
  {
    no: 2,
    name: "key",
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  }
]);
var VerifyKeyRequest = _VerifyKeyRequest;
var _VerifyKeyResponse = class _VerifyKeyResponse extends Message {
  constructor(data) {
    super();
    /**
     * @generated from field: bool valid = 1;
     */
    this.valid = false;
    proto3.util.initPartial(data, this);
  }
  static fromBinary(bytes, options) {
    return new _VerifyKeyResponse().fromBinary(bytes, options);
  }
  static fromJson(jsonValue, options) {
    return new _VerifyKeyResponse().fromJson(jsonValue, options);
  }
  static fromJsonString(jsonString, options) {
    return new _VerifyKeyResponse().fromJsonString(jsonString, options);
  }
  static equals(a, b) {
    return proto3.util.equals(_VerifyKeyResponse, a, b);
  }
};
_VerifyKeyResponse.runtime = proto3;
_VerifyKeyResponse.typeName = "connectrpc.eliza.v1.VerifyKeyResponse";
_VerifyKeyResponse.fields = proto3.util.newFieldList(() => [
  {
    no: 1,
    name: "valid",
    kind: "scalar",
    T: 8
    /* ScalarType.BOOL */
  }
]);
var VerifyKeyResponse = _VerifyKeyResponse;

// gen/eliza_connect.ts
var ElizaService = {
  typeName: "connectrpc.eliza.v1.ElizaService",
  methods: {
    /**
     * Response to request
     *
     * @generated from rpc connectrpc.eliza.v1.ElizaService.CreateApp
     */
    createApp: {
      name: "CreateApp",
      I: CreateAppRequest,
      O: CreateAppResponse,
      kind: MethodKind.Unary
    },
    /**
     * @generated from rpc connectrpc.eliza.v1.ElizaService.CreateInstance
     */
    createInstance: {
      name: "CreateInstance",
      I: CreateInstanceRequest,
      O: CreateInstanceResponse,
      kind: MethodKind.Unary
    },
    /**
     * @generated from rpc connectrpc.eliza.v1.ElizaService.CreateItem
     */
    createItem: {
      name: "CreateItem",
      I: CreateItemRequest,
      O: CreateItemResponse,
      kind: MethodKind.Unary
    },
    /**
     * @generated from rpc connectrpc.eliza.v1.ElizaService.CreateRecipe
     */
    createRecipe: {
      name: "CreateRecipe",
      I: CreateRecipeRequest,
      O: CreateRecipeResponse,
      kind: MethodKind.Unary
    },
    /**
     * @generated from rpc connectrpc.eliza.v1.ElizaService.CreateTrade
     */
    createTrade: {
      name: "CreateTrade",
      I: CreateTradeRequest,
      O: CreateTradeResponse,
      kind: MethodKind.Unary
    },
    /**
     * @generated from rpc connectrpc.eliza.v1.ElizaService.ReadIdentity
     */
    readIdentity: {
      name: "ReadIdentity",
      I: ReadIdentityRequest,
      O: ReadIdentityResponse,
      kind: MethodKind.Unary
    },
    /**
     * @generated from rpc connectrpc.eliza.v1.ElizaService.ReadInventory
     */
    readInventory: {
      name: "ReadInventory",
      I: ReadInventoryRequest,
      O: ReadInventoryResponse,
      kind: MethodKind.Unary
    },
    /**
     * @generated from rpc connectrpc.eliza.v1.ElizaService.ReadItem
     */
    readItem: {
      name: "ReadItem",
      I: ReadItemRequest,
      O: ReadItemResponse,
      kind: MethodKind.Unary
    },
    /**
     * @generated from rpc connectrpc.eliza.v1.ElizaService.ReadInstance
     */
    readInstance: {
      name: "ReadInstance",
      I: ReadInstanceRequest,
      O: ReadInstanceResponse,
      kind: MethodKind.Unary
    },
    /**
     * @generated from rpc connectrpc.eliza.v1.ElizaService.ReadApp
     */
    readApp: {
      name: "ReadApp",
      I: ReadAppRequest,
      O: ReadAppResponse,
      kind: MethodKind.Unary
    },
    /**
     * @generated from rpc connectrpc.eliza.v1.ElizaService.ReadTrade
     */
    readTrade: {
      name: "ReadTrade",
      I: ReadTradeRequest,
      O: ReadTradeResponse,
      kind: MethodKind.Unary
    },
    /**
     * @generated from rpc connectrpc.eliza.v1.ElizaService.ReadRecipe
     */
    readRecipe: {
      name: "ReadRecipe",
      I: ReadRecipeRequest,
      O: ReadRecipeResponse,
      kind: MethodKind.Unary
    },
    /**
     * @generated from rpc connectrpc.eliza.v1.ElizaService.UpdateIdentityMetadata
     */
    updateIdentityMetadata: {
      name: "UpdateIdentityMetadata",
      I: UpdateIdentityMetadataRequest,
      O: UpdateIdentityMetadataResponse,
      kind: MethodKind.Unary
    },
    /**
     * @generated from rpc connectrpc.eliza.v1.ElizaService.UpdateInstance
     */
    updateInstance: {
      name: "UpdateInstance",
      I: UpdateInstanceRequest,
      O: UpdateInstanceResponse,
      kind: MethodKind.Unary
    },
    /**
     * @generated from rpc connectrpc.eliza.v1.ElizaService.UpdateItem
     */
    updateItem: {
      name: "UpdateItem",
      I: UpdateItemRequest,
      O: UpdateItemResponse,
      kind: MethodKind.Unary
    },
    /**
     * @generated from rpc connectrpc.eliza.v1.ElizaService.UpdateApp
     */
    updateApp: {
      name: "UpdateApp",
      I: UpdateAppRequest,
      O: UpdateAppResponse,
      kind: MethodKind.Unary
    },
    /**
     * @generated from rpc connectrpc.eliza.v1.ElizaService.UpdateTrade
     */
    updateTrade: {
      name: "UpdateTrade",
      I: UpdateTradeRequest,
      O: UpdateTradeResponse,
      kind: MethodKind.Unary
    },
    /**
     * @generated from rpc connectrpc.eliza.v1.ElizaService.UpdateRecipe
     */
    updateRecipe: {
      name: "UpdateRecipe",
      I: UpdateRecipeRequest,
      O: UpdateRecipeResponse,
      kind: MethodKind.Unary
    },
    /**
     * @generated from rpc connectrpc.eliza.v1.ElizaService.DeleteApp
     */
    deleteApp: {
      name: "DeleteApp",
      I: DeleteAppRequest,
      O: DeleteAppResponse,
      kind: MethodKind.Unary
    },
    /**
     * @generated from rpc connectrpc.eliza.v1.ElizaService.DeleteInstance
     */
    deleteInstance: {
      name: "DeleteInstance",
      I: DeleteInstanceRequest,
      O: DeleteInstanceResponse,
      kind: MethodKind.Unary
    },
    /**
     * @generated from rpc connectrpc.eliza.v1.ElizaService.CloseTrade
     */
    closeTrade: {
      name: "CloseTrade",
      I: CloseTradeRequest,
      O: CloseTradeResponse,
      kind: MethodKind.Unary
    },
    /**
     * @generated from rpc connectrpc.eliza.v1.ElizaService.VerifyKey
     */
    verifyKey: {
      name: "VerifyKey",
      I: VerifyKeyRequest,
      O: VerifyKeyResponse,
      kind: MethodKind.Unary
    }
  }
};

// ../node_modules/dotenv/config.js
(function() {
  require_main().config(
    Object.assign(
      {},
      require_env_options(),
      require_cli_options()(process.argv)
    )
  );
})();

// src/index.ts
var App2 = class _App2 {
  constructor(client, appId, key) {
    this.client = client;
    this.request = { appId, key };
  }
  static connect(options) {
    return __async(this, null, function* () {
      const transport = createConnectTransport({
        baseUrl: options.baseUrl || "https://inventory.hackclub.com",
        httpVersion: "1.1"
      });
      const client = createPromiseClient(ElizaService, transport);
      if (!(yield client.verifyKey(options)))
        throw new Error("App not found or invalid key");
      return new _App2(client, options.appId, options.key);
    });
  }
  // I would do this with a cleaner for-loop, but I can't get it to be typed in TypeScript
  createApp(request) {
    return __async(this, null, function* () {
      return yield this.client.createApp(__spreadValues(__spreadValues({}, this.request), request));
    });
  }
  createInstance(request) {
    return __async(this, null, function* () {
      return yield this.client.createInstance(__spreadValues(__spreadValues({}, this.request), request));
    });
  }
  createItem(request) {
    return __async(this, null, function* () {
      return yield this.client.createItem(__spreadValues(__spreadValues({}, this.request), request));
    });
  }
  createRecipe(request) {
    return __async(this, null, function* () {
      return yield this.client.createRecipe(__spreadValues(__spreadValues({}, this.request), request));
    });
  }
  createTrade(request) {
    return __async(this, null, function* () {
      return yield this.client.createTrade(__spreadValues(__spreadValues({}, this.request), request));
    });
  }
  readIdentity(request) {
    return __async(this, null, function* () {
      return yield this.client.readIdentity(__spreadValues(__spreadValues({}, this.request), request));
    });
  }
  readItem(request) {
    return __async(this, null, function* () {
      return yield this.client.readItem(__spreadValues(__spreadValues({}, this.request), request));
    });
  }
  readInstance(request) {
    return __async(this, null, function* () {
      return yield this.client.readInstance(__spreadValues(__spreadValues({}, this.request), request));
    });
  }
  readApp() {
    return __async(this, arguments, function* (request = {}) {
      return yield this.client.readApp(__spreadValues(__spreadValues({}, this.request), request));
    });
  }
  readTrade(request) {
    return __async(this, null, function* () {
      return yield this.client.readTrade(__spreadValues(__spreadValues({}, this.request), request));
    });
  }
  readRecipe(request) {
    return __async(this, null, function* () {
      return yield this.client.readRecipe(__spreadValues(__spreadValues({}, this.request), request));
    });
  }
  updateIdentityMetadata(request) {
    return __async(this, null, function* () {
      return yield this.client.updateIdentityMetadata(__spreadValues(__spreadValues({}, this.request), request));
    });
  }
  updateInstance(request) {
    return __async(this, null, function* () {
      return yield this.client.updateInstance(__spreadValues(__spreadValues({}, this.request), request));
    });
  }
  updateItem(request) {
    return __async(this, null, function* () {
      return yield this.client.updateItem(__spreadValues(__spreadValues({}, this.request), request));
    });
  }
  updateApp(request) {
    return __async(this, null, function* () {
      const response = yield this.client.updateApp(__spreadValues(__spreadValues({}, this.request), request));
      return response;
    });
  }
  updateTrade(request) {
    return __async(this, null, function* () {
      return yield this.client.updateTrade(__spreadValues(__spreadValues({}, this.request), request));
    });
  }
  updateRecipe(request) {
    return __async(this, null, function* () {
      return yield this.client.updateRecipe(__spreadValues(__spreadValues({}, this.request), request));
    });
  }
  deleteApp(request) {
    return __async(this, null, function* () {
      return yield this.client.deleteApp(__spreadValues(__spreadValues({}, this.request), request));
    });
  }
  deleteInstance(request) {
    return __async(this, null, function* () {
      return yield this.client.deleteInstance(__spreadValues(__spreadValues({}, this.request), request));
    });
  }
  closeTrade(request) {
    return __async(this, null, function* () {
      return yield this.client.closeTrade(__spreadValues(__spreadValues({}, this.request), request));
    });
  }
};
export {
  App2 as App
};
//# sourceMappingURL=index.mjs.map