// node_modules/tldts-core/dist/es6/src/domain.js
function shareSameDomainSuffix(hostname, vhost) {
  if (hostname.endsWith(vhost)) {
    return hostname.length === vhost.length || hostname[hostname.length - vhost.length - 1] === ".";
  }
  return false;
}
function extractDomainWithSuffix(hostname, publicSuffix) {
  const publicSuffixIndex = hostname.length - publicSuffix.length - 2;
  const lastDotBeforeSuffixIndex = hostname.lastIndexOf(".", publicSuffixIndex);
  if (lastDotBeforeSuffixIndex === -1) {
    return hostname;
  }
  return hostname.slice(lastDotBeforeSuffixIndex + 1);
}
function getDomain(suffix, hostname, options) {
  if (options.validHosts !== null) {
    const validHosts = options.validHosts;
    for (const vhost of validHosts) {
      if (
        /*@__INLINE__*/
        shareSameDomainSuffix(hostname, vhost)
      ) {
        return vhost;
      }
    }
  }
  let numberOfLeadingDots = 0;
  if (hostname.startsWith(".")) {
    while (numberOfLeadingDots < hostname.length && hostname[numberOfLeadingDots] === ".") {
      numberOfLeadingDots += 1;
    }
  }
  if (suffix.length === hostname.length - numberOfLeadingDots) {
    return null;
  }
  return (
    /*@__INLINE__*/
    extractDomainWithSuffix(hostname, suffix)
  );
}

// node_modules/tldts-core/dist/es6/src/domain-without-suffix.js
function getDomainWithoutSuffix(domain, suffix) {
  return domain.slice(0, -suffix.length - 1);
}

// node_modules/tldts-core/dist/es6/src/extract-hostname.js
function extractHostname(url, urlIsValidHostname) {
  let start = 0;
  let end = url.length;
  let hasUpper = false;
  if (!urlIsValidHostname) {
    if (url.startsWith("data:")) {
      return null;
    }
    while (start < url.length && url.charCodeAt(start) <= 32) {
      start += 1;
    }
    while (end > start + 1 && url.charCodeAt(end - 1) <= 32) {
      end -= 1;
    }
    if (url.charCodeAt(start) === 47 && url.charCodeAt(start + 1) === 47) {
      start += 2;
    } else {
      const indexOfProtocol = url.indexOf(":/", start);
      if (indexOfProtocol !== -1) {
        const protocolSize = indexOfProtocol - start;
        const c0 = url.charCodeAt(start);
        const c1 = url.charCodeAt(start + 1);
        const c2 = url.charCodeAt(start + 2);
        const c3 = url.charCodeAt(start + 3);
        const c4 = url.charCodeAt(start + 4);
        if (protocolSize === 5 && c0 === 104 && c1 === 116 && c2 === 116 && c3 === 112 && c4 === 115) {
        } else if (protocolSize === 4 && c0 === 104 && c1 === 116 && c2 === 116 && c3 === 112) {
        } else if (protocolSize === 3 && c0 === 119 && c1 === 115 && c2 === 115) {
        } else if (protocolSize === 2 && c0 === 119 && c1 === 115) {
        } else {
          for (let i = start; i < indexOfProtocol; i += 1) {
            const lowerCaseCode = url.charCodeAt(i) | 32;
            if (!(lowerCaseCode >= 97 && lowerCaseCode <= 122 || // [a, z]
            lowerCaseCode >= 48 && lowerCaseCode <= 57 || // [0, 9]
            lowerCaseCode === 46 || // '.'
            lowerCaseCode === 45 || // '-'
            lowerCaseCode === 43)) {
              return null;
            }
          }
        }
        start = indexOfProtocol + 2;
        while (url.charCodeAt(start) === 47) {
          start += 1;
        }
      }
    }
    let indexOfIdentifier = -1;
    let indexOfClosingBracket = -1;
    let indexOfPort = -1;
    for (let i = start; i < end; i += 1) {
      const code = url.charCodeAt(i);
      if (code === 35 || // '#'
      code === 47 || // '/'
      code === 63) {
        end = i;
        break;
      } else if (code === 64) {
        indexOfIdentifier = i;
      } else if (code === 93) {
        indexOfClosingBracket = i;
      } else if (code === 58) {
        indexOfPort = i;
      } else if (code >= 65 && code <= 90) {
        hasUpper = true;
      }
    }
    if (indexOfIdentifier !== -1 && indexOfIdentifier > start && indexOfIdentifier < end) {
      start = indexOfIdentifier + 1;
    }
    if (url.charCodeAt(start) === 91) {
      if (indexOfClosingBracket !== -1) {
        return url.slice(start + 1, indexOfClosingBracket).toLowerCase();
      }
      return null;
    } else if (indexOfPort !== -1 && indexOfPort > start && indexOfPort < end) {
      end = indexOfPort;
    }
  }
  while (end > start + 1 && url.charCodeAt(end - 1) === 46) {
    end -= 1;
  }
  const hostname = start !== 0 || end !== url.length ? url.slice(start, end) : url;
  if (hasUpper) {
    return hostname.toLowerCase();
  }
  return hostname;
}

// node_modules/tldts-core/dist/es6/src/is-ip.js
function isProbablyIpv4(hostname) {
  if (hostname.length < 7) {
    return false;
  }
  if (hostname.length > 15) {
    return false;
  }
  let numberOfDots = 0;
  for (let i = 0; i < hostname.length; i += 1) {
    const code = hostname.charCodeAt(i);
    if (code === 46) {
      numberOfDots += 1;
    } else if (code < 48 || code > 57) {
      return false;
    }
  }
  return numberOfDots === 3 && hostname.charCodeAt(0) !== 46 && hostname.charCodeAt(hostname.length - 1) !== 46;
}
function isProbablyIpv6(hostname) {
  if (hostname.length < 3) {
    return false;
  }
  let start = hostname.startsWith("[") ? 1 : 0;
  let end = hostname.length;
  if (hostname[end - 1] === "]") {
    end -= 1;
  }
  if (end - start > 39) {
    return false;
  }
  let hasColon = false;
  for (; start < end; start += 1) {
    const code = hostname.charCodeAt(start);
    if (code === 58) {
      hasColon = true;
    } else if (!(code >= 48 && code <= 57 || // 0-9
    code >= 97 && code <= 102 || // a-f
    code >= 65 && code <= 90)) {
      return false;
    }
  }
  return hasColon;
}
function isIp(hostname) {
  return isProbablyIpv6(hostname) || isProbablyIpv4(hostname);
}

// node_modules/tldts-core/dist/es6/src/is-valid.js
function isValidAscii(code) {
  return code >= 97 && code <= 122 || code >= 48 && code <= 57 || code > 127;
}
function is_valid_default(hostname) {
  if (hostname.length > 255) {
    return false;
  }
  if (hostname.length === 0) {
    return false;
  }
  if (
    /*@__INLINE__*/
    !isValidAscii(hostname.charCodeAt(0)) && hostname.charCodeAt(0) !== 46 && // '.' (dot)
    hostname.charCodeAt(0) !== 95
  ) {
    return false;
  }
  let lastDotIndex = -1;
  let lastCharCode = -1;
  const len = hostname.length;
  for (let i = 0; i < len; i += 1) {
    const code = hostname.charCodeAt(i);
    if (code === 46) {
      if (
        // Check that previous label is < 63 bytes long (64 = 63 + '.')
        i - lastDotIndex > 64 || // Check that previous character was not already a '.'
        lastCharCode === 46 || // Check that the previous label does not end with a '-' (dash)
        lastCharCode === 45 || // Check that the previous label does not end with a '_' (underscore)
        lastCharCode === 95
      ) {
        return false;
      }
      lastDotIndex = i;
    } else if (!/*@__INLINE__*/
    (isValidAscii(code) || code === 45 || code === 95)) {
      return false;
    }
    lastCharCode = code;
  }
  return (
    // Check that last label is shorter than 63 chars
    len - lastDotIndex - 1 <= 63 && // Check that the last character is an allowed trailing label character.
    // Since we already checked that the char is a valid hostname character,
    // we only need to check that it's different from '-'.
    lastCharCode !== 45
  );
}

// node_modules/tldts-core/dist/es6/src/options.js
function setDefaultsImpl({ allowIcannDomains = true, allowPrivateDomains = false, detectIp = true, extractHostname: extractHostname2 = true, mixedInputs = true, validHosts = null, validateHostname = true }) {
  return {
    allowIcannDomains,
    allowPrivateDomains,
    detectIp,
    extractHostname: extractHostname2,
    mixedInputs,
    validHosts,
    validateHostname
  };
}
var DEFAULT_OPTIONS = (
  /*@__INLINE__*/
  setDefaultsImpl({})
);
function setDefaults(options) {
  if (options === void 0) {
    return DEFAULT_OPTIONS;
  }
  return (
    /*@__INLINE__*/
    setDefaultsImpl(options)
  );
}

// node_modules/tldts-core/dist/es6/src/subdomain.js
function getSubdomain(hostname, domain) {
  if (domain.length === hostname.length) {
    return "";
  }
  return hostname.slice(0, -domain.length - 1);
}

// node_modules/tldts-core/dist/es6/src/factory.js
function getEmptyResult() {
  return {
    domain: null,
    domainWithoutSuffix: null,
    hostname: null,
    isIcann: null,
    isIp: null,
    isPrivate: null,
    publicSuffix: null,
    subdomain: null
  };
}
function parseImpl(url, step, suffixLookup2, partialOptions, result) {
  const options = (
    /*@__INLINE__*/
    setDefaults(partialOptions)
  );
  if (typeof url !== "string") {
    return result;
  }
  if (!options.extractHostname) {
    result.hostname = url;
  } else if (options.mixedInputs) {
    result.hostname = extractHostname(url, is_valid_default(url));
  } else {
    result.hostname = extractHostname(url, false);
  }
  if (options.detectIp && result.hostname !== null) {
    result.isIp = isIp(result.hostname);
    if (result.isIp) {
      return result;
    }
  }
  if (options.validateHostname && options.extractHostname && result.hostname !== null && !is_valid_default(result.hostname)) {
    result.hostname = null;
    return result;
  }
  if (step === 0 || result.hostname === null) {
    return result;
  }
  suffixLookup2(result.hostname, options, result);
  if (step === 2 || result.publicSuffix === null) {
    return result;
  }
  result.domain = getDomain(result.publicSuffix, result.hostname, options);
  if (step === 3 || result.domain === null) {
    return result;
  }
  result.subdomain = getSubdomain(result.hostname, result.domain);
  if (step === 4) {
    return result;
  }
  result.domainWithoutSuffix = getDomainWithoutSuffix(result.domain, result.publicSuffix);
  return result;
}

// node_modules/tldts-core/dist/es6/src/lookup/fast-path.js
function fast_path_default(hostname, options, out) {
  if (!options.allowPrivateDomains && hostname.length > 3) {
    const last = hostname.length - 1;
    const c3 = hostname.charCodeAt(last);
    const c2 = hostname.charCodeAt(last - 1);
    const c1 = hostname.charCodeAt(last - 2);
    const c0 = hostname.charCodeAt(last - 3);
    if (c3 === 109 && c2 === 111 && c1 === 99 && c0 === 46) {
      out.isIcann = true;
      out.isPrivate = false;
      out.publicSuffix = "com";
      return true;
    } else if (c3 === 103 && c2 === 114 && c1 === 111 && c0 === 46) {
      out.isIcann = true;
      out.isPrivate = false;
      out.publicSuffix = "org";
      return true;
    } else if (c3 === 117 && c2 === 100 && c1 === 101 && c0 === 46) {
      out.isIcann = true;
      out.isPrivate = false;
      out.publicSuffix = "edu";
      return true;
    } else if (c3 === 118 && c2 === 111 && c1 === 103 && c0 === 46) {
      out.isIcann = true;
      out.isPrivate = false;
      out.publicSuffix = "gov";
      return true;
    } else if (c3 === 116 && c2 === 101 && c1 === 110 && c0 === 46) {
      out.isIcann = true;
      out.isPrivate = false;
      out.publicSuffix = "net";
      return true;
    } else if (c3 === 101 && c2 === 100 && c1 === 46) {
      out.isIcann = true;
      out.isPrivate = false;
      out.publicSuffix = "de";
      return true;
    }
  }
  return false;
}

// node_modules/tldts/dist/es6/src/data/trie.js
var exceptions = /* @__PURE__ */ function() {
  const _0 = [1, {}], _1 = [0, { "city": _0 }];
  const exceptions2 = [0, { "ck": [0, { "www": _0 }], "jp": [0, { "kawasaki": _1, "kitakyushu": _1, "kobe": _1, "nagoya": _1, "sapporo": _1, "sendai": _1, "yokohama": _1 }] }];
  return exceptions2;
}();
var rules = /* @__PURE__ */ function() {
  const _2 = [1, {}], _3 = [2, {}], _4 = [1, { "com": _2, "edu": _2, "gov": _2, "net": _2, "org": _2 }], _5 = [1, { "com": _2, "edu": _2, "gov": _2, "mil": _2, "net": _2, "org": _2 }], _6 = [0, { "*": _3 }], _7 = [2, { "s": _6 }], _8 = [0, { "relay": _3 }], _9 = [2, { "id": _3 }], _10 = [1, { "gov": _2 }], _11 = [0, { "transfer-webapp": _3 }], _12 = [0, { "notebook": _3, "studio": _3 }], _13 = [0, { "labeling": _3, "notebook": _3, "studio": _3 }], _14 = [0, { "notebook": _3 }], _15 = [0, { "labeling": _3, "notebook": _3, "notebook-fips": _3, "studio": _3 }], _16 = [0, { "notebook": _3, "notebook-fips": _3, "studio": _3, "studio-fips": _3 }], _17 = [0, { "*": _2 }], _18 = [1, { "co": _3 }], _19 = [0, { "objects": _3 }], _20 = [2, { "nodes": _3 }], _21 = [0, { "my": _6 }], _22 = [0, { "s3": _3, "s3-accesspoint": _3, "s3-website": _3 }], _23 = [0, { "s3": _3, "s3-accesspoint": _3 }], _24 = [0, { "direct": _3 }], _25 = [0, { "webview-assets": _3 }], _26 = [0, { "vfs": _3, "webview-assets": _3 }], _27 = [0, { "execute-api": _3, "emrappui-prod": _3, "emrnotebooks-prod": _3, "emrstudio-prod": _3, "dualstack": _22, "s3": _3, "s3-accesspoint": _3, "s3-object-lambda": _3, "s3-website": _3, "aws-cloud9": _25, "cloud9": _26 }], _28 = [0, { "execute-api": _3, "emrappui-prod": _3, "emrnotebooks-prod": _3, "emrstudio-prod": _3, "dualstack": _23, "s3": _3, "s3-accesspoint": _3, "s3-object-lambda": _3, "s3-website": _3, "aws-cloud9": _25, "cloud9": _26 }], _29 = [0, { "execute-api": _3, "emrappui-prod": _3, "emrnotebooks-prod": _3, "emrstudio-prod": _3, "dualstack": _22, "s3": _3, "s3-accesspoint": _3, "s3-object-lambda": _3, "s3-website": _3, "analytics-gateway": _3, "aws-cloud9": _25, "cloud9": _26 }], _30 = [0, { "execute-api": _3, "emrappui-prod": _3, "emrnotebooks-prod": _3, "emrstudio-prod": _3, "dualstack": _22, "s3": _3, "s3-accesspoint": _3, "s3-object-lambda": _3, "s3-website": _3 }], _31 = [0, { "s3": _3, "s3-accesspoint": _3, "s3-accesspoint-fips": _3, "s3-fips": _3, "s3-website": _3 }], _32 = [0, { "execute-api": _3, "emrappui-prod": _3, "emrnotebooks-prod": _3, "emrstudio-prod": _3, "dualstack": _31, "s3": _3, "s3-accesspoint": _3, "s3-accesspoint-fips": _3, "s3-fips": _3, "s3-object-lambda": _3, "s3-website": _3, "aws-cloud9": _25, "cloud9": _26 }], _33 = [0, { "execute-api": _3, "emrappui-prod": _3, "emrnotebooks-prod": _3, "emrstudio-prod": _3, "dualstack": _31, "s3": _3, "s3-accesspoint": _3, "s3-accesspoint-fips": _3, "s3-deprecated": _3, "s3-fips": _3, "s3-object-lambda": _3, "s3-website": _3, "analytics-gateway": _3, "aws-cloud9": _25, "cloud9": _26 }], _34 = [0, { "s3": _3, "s3-accesspoint": _3, "s3-accesspoint-fips": _3, "s3-fips": _3 }], _35 = [0, { "execute-api": _3, "emrappui-prod": _3, "emrnotebooks-prod": _3, "emrstudio-prod": _3, "dualstack": _34, "s3": _3, "s3-accesspoint": _3, "s3-accesspoint-fips": _3, "s3-fips": _3, "s3-object-lambda": _3, "s3-website": _3 }], _36 = [0, { "auth": _3 }], _37 = [0, { "auth": _3, "auth-fips": _3 }], _38 = [0, { "auth-fips": _3 }], _39 = [0, { "apps": _3 }], _40 = [0, { "paas": _3 }], _41 = [2, { "eu": _3 }], _42 = [0, { "app": _3 }], _43 = [0, { "site": _3 }], _44 = [1, { "com": _2, "edu": _2, "net": _2, "org": _2 }], _45 = [0, { "j": _3 }], _46 = [0, { "dyn": _3 }], _47 = [1, { "co": _2, "com": _2, "edu": _2, "gov": _2, "net": _2, "org": _2 }], _48 = [0, { "p": _3 }], _49 = [0, { "user": _3 }], _50 = [0, { "shop": _3 }], _51 = [0, { "cdn": _3 }], _52 = [0, { "cust": _3, "reservd": _3 }], _53 = [0, { "cust": _3 }], _54 = [0, { "s3": _3 }], _55 = [1, { "biz": _2, "com": _2, "edu": _2, "gov": _2, "info": _2, "net": _2, "org": _2 }], _56 = [0, { "ipfs": _3 }], _57 = [1, { "framer": _3 }], _58 = [0, { "forgot": _3 }], _59 = [1, { "gs": _2 }], _60 = [0, { "nes": _2 }], _61 = [1, { "k12": _2, "cc": _2, "lib": _2 }], _62 = [1, { "cc": _2, "lib": _2 }];
  const rules2 = [0, { "ac": [1, { "com": _2, "edu": _2, "gov": _2, "mil": _2, "net": _2, "org": _2, "drr": _3, "feedback": _3, "forms": _3 }], "ad": _2, "ae": [1, { "ac": _2, "co": _2, "gov": _2, "mil": _2, "net": _2, "org": _2, "sch": _2 }], "aero": [1, { "airline": _2, "airport": _2, "accident-investigation": _2, "accident-prevention": _2, "aerobatic": _2, "aeroclub": _2, "aerodrome": _2, "agents": _2, "air-surveillance": _2, "air-traffic-control": _2, "aircraft": _2, "airtraffic": _2, "ambulance": _2, "association": _2, "author": _2, "ballooning": _2, "broker": _2, "caa": _2, "cargo": _2, "catering": _2, "certification": _2, "championship": _2, "charter": _2, "civilaviation": _2, "club": _2, "conference": _2, "consultant": _2, "consulting": _2, "control": _2, "council": _2, "crew": _2, "design": _2, "dgca": _2, "educator": _2, "emergency": _2, "engine": _2, "engineer": _2, "entertainment": _2, "equipment": _2, "exchange": _2, "express": _2, "federation": _2, "flight": _2, "freight": _2, "fuel": _2, "gliding": _2, "government": _2, "groundhandling": _2, "group": _2, "hanggliding": _2, "homebuilt": _2, "insurance": _2, "journal": _2, "journalist": _2, "leasing": _2, "logistics": _2, "magazine": _2, "maintenance": _2, "marketplace": _2, "media": _2, "microlight": _2, "modelling": _2, "navigation": _2, "parachuting": _2, "paragliding": _2, "passenger-association": _2, "pilot": _2, "press": _2, "production": _2, "recreation": _2, "repbody": _2, "res": _2, "research": _2, "rotorcraft": _2, "safety": _2, "scientist": _2, "services": _2, "show": _2, "skydiving": _2, "software": _2, "student": _2, "taxi": _2, "trader": _2, "trading": _2, "trainer": _2, "union": _2, "workinggroup": _2, "works": _2 }], "af": _4, "ag": [1, { "co": _2, "com": _2, "net": _2, "nom": _2, "org": _2, "obj": _3 }], "ai": [1, { "com": _2, "net": _2, "off": _2, "org": _2, "uwu": _3, "framer": _3 }], "al": _5, "am": [1, { "co": _2, "com": _2, "commune": _2, "net": _2, "org": _2, "radio": _3 }], "ao": [1, { "co": _2, "ed": _2, "edu": _2, "gov": _2, "gv": _2, "it": _2, "og": _2, "org": _2, "pb": _2 }], "aq": _2, "ar": [1, { "bet": _2, "com": _2, "coop": _2, "edu": _2, "gob": _2, "gov": _2, "int": _2, "mil": _2, "musica": _2, "mutual": _2, "net": _2, "org": _2, "seg": _2, "senasa": _2, "tur": _2 }], "arpa": [1, { "e164": _2, "home": _2, "in-addr": _2, "ip6": _2, "iris": _2, "uri": _2, "urn": _2 }], "as": _10, "asia": [1, { "cloudns": _3, "daemon": _3, "dix": _3 }], "at": [1, { "ac": [1, { "sth": _2 }], "co": _2, "gv": _2, "or": _2, "funkfeuer": [0, { "wien": _3 }], "futurecms": [0, { "*": _3, "ex": _6, "in": _6 }], "futurehosting": _3, "futuremailing": _3, "ortsinfo": [0, { "ex": _6, "kunden": _6 }], "biz": _3, "info": _3, "123webseite": _3, "priv": _3, "myspreadshop": _3, "12hp": _3, "2ix": _3, "4lima": _3, "lima-city": _3 }], "au": [1, { "asn": _2, "com": [1, { "cloudlets": [0, { "mel": _3 }], "myspreadshop": _3 }], "edu": [1, { "act": _2, "catholic": _2, "nsw": [1, { "schools": _2 }], "nt": _2, "qld": _2, "sa": _2, "tas": _2, "vic": _2, "wa": _2 }], "gov": [1, { "qld": _2, "sa": _2, "tas": _2, "vic": _2, "wa": _2 }], "id": _2, "net": _2, "org": _2, "conf": _2, "oz": _2, "act": _2, "nsw": _2, "nt": _2, "qld": _2, "sa": _2, "tas": _2, "vic": _2, "wa": _2 }], "aw": [1, { "com": _2 }], "ax": _2, "az": [1, { "biz": _2, "co": _2, "com": _2, "edu": _2, "gov": _2, "info": _2, "int": _2, "mil": _2, "name": _2, "net": _2, "org": _2, "pp": _2, "pro": _2 }], "ba": [1, { "com": _2, "edu": _2, "gov": _2, "mil": _2, "net": _2, "org": _2, "rs": _3 }], "bb": [1, { "biz": _2, "co": _2, "com": _2, "edu": _2, "gov": _2, "info": _2, "net": _2, "org": _2, "store": _2, "tv": _2 }], "bd": _17, "be": [1, { "ac": _2, "cloudns": _3, "webhosting": _3, "interhostsolutions": [0, { "cloud": _3 }], "kuleuven": [0, { "ezproxy": _3 }], "123website": _3, "myspreadshop": _3, "transurl": _6 }], "bf": _10, "bg": [1, { "0": _2, "1": _2, "2": _2, "3": _2, "4": _2, "5": _2, "6": _2, "7": _2, "8": _2, "9": _2, "a": _2, "b": _2, "c": _2, "d": _2, "e": _2, "f": _2, "g": _2, "h": _2, "i": _2, "j": _2, "k": _2, "l": _2, "m": _2, "n": _2, "o": _2, "p": _2, "q": _2, "r": _2, "s": _2, "t": _2, "u": _2, "v": _2, "w": _2, "x": _2, "y": _2, "z": _2, "barsy": _3 }], "bh": _4, "bi": [1, { "co": _2, "com": _2, "edu": _2, "or": _2, "org": _2 }], "biz": [1, { "activetrail": _3, "cloud-ip": _3, "cloudns": _3, "jozi": _3, "dyndns": _3, "for-better": _3, "for-more": _3, "for-some": _3, "for-the": _3, "selfip": _3, "webhop": _3, "orx": _3, "mmafan": _3, "myftp": _3, "no-ip": _3, "dscloud": _3 }], "bj": [1, { "africa": _2, "agro": _2, "architectes": _2, "assur": _2, "avocats": _2, "co": _2, "com": _2, "eco": _2, "econo": _2, "edu": _2, "info": _2, "loisirs": _2, "money": _2, "net": _2, "org": _2, "ote": _2, "restaurant": _2, "resto": _2, "tourism": _2, "univ": _2 }], "bm": _4, "bn": [1, { "com": _2, "edu": _2, "gov": _2, "net": _2, "org": _2, "co": _3 }], "bo": [1, { "com": _2, "edu": _2, "gob": _2, "int": _2, "mil": _2, "net": _2, "org": _2, "tv": _2, "web": _2, "academia": _2, "agro": _2, "arte": _2, "blog": _2, "bolivia": _2, "ciencia": _2, "cooperativa": _2, "democracia": _2, "deporte": _2, "ecologia": _2, "economia": _2, "empresa": _2, "indigena": _2, "industria": _2, "info": _2, "medicina": _2, "movimiento": _2, "musica": _2, "natural": _2, "nombre": _2, "noticias": _2, "patria": _2, "plurinacional": _2, "politica": _2, "profesional": _2, "pueblo": _2, "revista": _2, "salud": _2, "tecnologia": _2, "tksat": _2, "transporte": _2, "wiki": _2 }], "br": [1, { "9guacu": _2, "abc": _2, "adm": _2, "adv": _2, "agr": _2, "aju": _2, "am": _2, "anani": _2, "aparecida": _2, "app": _2, "arq": _2, "art": _2, "ato": _2, "b": _2, "barueri": _2, "belem": _2, "bet": _2, "bhz": _2, "bib": _2, "bio": _2, "blog": _2, "bmd": _2, "boavista": _2, "bsb": _2, "campinagrande": _2, "campinas": _2, "caxias": _2, "cim": _2, "cng": _2, "cnt": _2, "com": [1, { "simplesite": _3 }], "contagem": _2, "coop": _2, "coz": _2, "cri": _2, "cuiaba": _2, "curitiba": _2, "def": _2, "des": _2, "det": _2, "dev": _2, "ecn": _2, "eco": _2, "edu": _2, "emp": _2, "enf": _2, "eng": _2, "esp": _2, "etc": _2, "eti": _2, "far": _2, "feira": _2, "flog": _2, "floripa": _2, "fm": _2, "fnd": _2, "fortal": _2, "fot": _2, "foz": _2, "fst": _2, "g12": _2, "geo": _2, "ggf": _2, "goiania": _2, "gov": [1, { "ac": _2, "al": _2, "am": _2, "ap": _2, "ba": _2, "ce": _2, "df": _2, "es": _2, "go": _2, "ma": _2, "mg": _2, "ms": _2, "mt": _2, "pa": _2, "pb": _2, "pe": _2, "pi": _2, "pr": _2, "rj": _2, "rn": _2, "ro": _2, "rr": _2, "rs": _2, "sc": _2, "se": _2, "sp": _2, "to": _2 }], "gru": _2, "imb": _2, "ind": _2, "inf": _2, "jab": _2, "jampa": _2, "jdf": _2, "joinville": _2, "jor": _2, "jus": _2, "leg": [1, { "ac": _3, "al": _3, "am": _3, "ap": _3, "ba": _3, "ce": _3, "df": _3, "es": _3, "go": _3, "ma": _3, "mg": _3, "ms": _3, "mt": _3, "pa": _3, "pb": _3, "pe": _3, "pi": _3, "pr": _3, "rj": _3, "rn": _3, "ro": _3, "rr": _3, "rs": _3, "sc": _3, "se": _3, "sp": _3, "to": _3 }], "leilao": _2, "lel": _2, "log": _2, "londrina": _2, "macapa": _2, "maceio": _2, "manaus": _2, "maringa": _2, "mat": _2, "med": _2, "mil": _2, "morena": _2, "mp": _2, "mus": _2, "natal": _2, "net": _2, "niteroi": _2, "nom": _17, "not": _2, "ntr": _2, "odo": _2, "ong": _2, "org": _2, "osasco": _2, "palmas": _2, "poa": _2, "ppg": _2, "pro": _2, "psc": _2, "psi": _2, "pvh": _2, "qsl": _2, "radio": _2, "rec": _2, "recife": _2, "rep": _2, "ribeirao": _2, "rio": _2, "riobranco": _2, "riopreto": _2, "salvador": _2, "sampa": _2, "santamaria": _2, "santoandre": _2, "saobernardo": _2, "saogonca": _2, "seg": _2, "sjc": _2, "slg": _2, "slz": _2, "sorocaba": _2, "srv": _2, "taxi": _2, "tc": _2, "tec": _2, "teo": _2, "the": _2, "tmp": _2, "trd": _2, "tur": _2, "tv": _2, "udi": _2, "vet": _2, "vix": _2, "vlog": _2, "wiki": _2, "zlg": _2 }], "bs": [1, { "com": _2, "edu": _2, "gov": _2, "net": _2, "org": _2, "we": _3 }], "bt": _4, "bv": _2, "bw": [1, { "ac": _2, "co": _2, "gov": _2, "net": _2, "org": _2 }], "by": [1, { "gov": _2, "mil": _2, "com": _2, "of": _2, "mediatech": _3 }], "bz": [1, { "co": _2, "com": _2, "edu": _2, "gov": _2, "net": _2, "org": _2, "za": _3, "mydns": _3, "gsj": _3 }], "ca": [1, { "ab": _2, "bc": _2, "mb": _2, "nb": _2, "nf": _2, "nl": _2, "ns": _2, "nt": _2, "nu": _2, "on": _2, "pe": _2, "qc": _2, "sk": _2, "yk": _2, "gc": _2, "barsy": _3, "awdev": _6, "co": _3, "no-ip": _3, "onid": _3, "myspreadshop": _3, "box": _3 }], "cat": _2, "cc": [1, { "cleverapps": _3, "cloudns": _3, "ftpaccess": _3, "game-server": _3, "myphotos": _3, "scrapping": _3, "twmail": _3, "csx": _3, "fantasyleague": _3, "spawn": [0, { "instances": _3 }] }], "cd": _10, "cf": _2, "cg": _2, "ch": [1, { "square7": _3, "cloudns": _3, "cloudscale": [0, { "cust": _3, "lpg": _19, "rma": _19 }], "objectstorage": [0, { "lpg": _3, "rma": _3 }], "flow": [0, { "ae": [0, { "alp1": _3 }], "appengine": _3 }], "linkyard-cloud": _3, "gotdns": _3, "dnsking": _3, "123website": _3, "myspreadshop": _3, "firenet": [0, { "*": _3, "svc": _6 }], "12hp": _3, "2ix": _3, "4lima": _3, "lima-city": _3 }], "ci": [1, { "ac": _2, "xn--aroport-bya": _2, "a\xE9roport": _2, "asso": _2, "co": _2, "com": _2, "ed": _2, "edu": _2, "go": _2, "gouv": _2, "int": _2, "net": _2, "or": _2, "org": _2 }], "ck": _17, "cl": [1, { "co": _2, "gob": _2, "gov": _2, "mil": _2, "cloudns": _3 }], "cm": [1, { "co": _2, "com": _2, "gov": _2, "net": _2 }], "cn": [1, { "ac": _2, "com": [1, { "amazonaws": [0, { "cn-north-1": [0, { "execute-api": _3, "emrappui-prod": _3, "emrnotebooks-prod": _3, "emrstudio-prod": _3, "dualstack": _22, "s3": _3, "s3-accesspoint": _3, "s3-deprecated": _3, "s3-object-lambda": _3, "s3-website": _3 }], "cn-northwest-1": [0, { "execute-api": _3, "emrappui-prod": _3, "emrnotebooks-prod": _3, "emrstudio-prod": _3, "dualstack": _23, "s3": _3, "s3-accesspoint": _3, "s3-object-lambda": _3, "s3-website": _3 }], "compute": _6, "airflow": [0, { "cn-north-1": _6, "cn-northwest-1": _6 }], "eb": [0, { "cn-north-1": _3, "cn-northwest-1": _3 }], "elb": _6 }], "sagemaker": [0, { "cn-north-1": _12, "cn-northwest-1": _12 }] }], "edu": _2, "gov": _2, "mil": _2, "net": _2, "org": _2, "xn--55qx5d": _2, "\u516C\u53F8": _2, "xn--od0alg": _2, "\u7DB2\u7D61": _2, "xn--io0a7i": _2, "\u7F51\u7EDC": _2, "ah": _2, "bj": _2, "cq": _2, "fj": _2, "gd": _2, "gs": _2, "gx": _2, "gz": _2, "ha": _2, "hb": _2, "he": _2, "hi": _2, "hk": _2, "hl": _2, "hn": _2, "jl": _2, "js": _2, "jx": _2, "ln": _2, "mo": _2, "nm": _2, "nx": _2, "qh": _2, "sc": _2, "sd": _2, "sh": [1, { "as": _3 }], "sn": _2, "sx": _2, "tj": _2, "tw": _2, "xj": _2, "xz": _2, "yn": _2, "zj": _2, "canva-apps": _3, "canvasite": _21, "myqnapcloud": _3, "quickconnect": _24 }], "co": [1, { "com": _2, "edu": _2, "gov": _2, "mil": _2, "net": _2, "nom": _2, "org": _2, "carrd": _3, "crd": _3, "otap": _6, "leadpages": _3, "lpages": _3, "mypi": _3, "xmit": _6, "firewalledreplit": _9, "repl": _9, "supabase": _3 }], "com": [1, { "a2hosted": _3, "cpserver": _3, "adobeaemcloud": [2, { "dev": _6 }], "africa": _3, "airkitapps": _3, "airkitapps-au": _3, "aivencloud": _3, "alibabacloudcs": _3, "kasserver": _3, "amazonaws": [0, { "af-south-1": _27, "ap-east-1": _28, "ap-northeast-1": _29, "ap-northeast-2": _29, "ap-northeast-3": _27, "ap-south-1": _29, "ap-south-2": _30, "ap-southeast-1": _29, "ap-southeast-2": _29, "ap-southeast-3": _30, "ap-southeast-4": _30, "ap-southeast-5": [0, { "execute-api": _3, "dualstack": _22, "s3": _3, "s3-accesspoint": _3, "s3-deprecated": _3, "s3-object-lambda": _3, "s3-website": _3 }], "ca-central-1": _32, "ca-west-1": [0, { "execute-api": _3, "emrappui-prod": _3, "emrnotebooks-prod": _3, "emrstudio-prod": _3, "dualstack": _31, "s3": _3, "s3-accesspoint": _3, "s3-accesspoint-fips": _3, "s3-fips": _3, "s3-object-lambda": _3, "s3-website": _3 }], "eu-central-1": _29, "eu-central-2": _30, "eu-north-1": _28, "eu-south-1": _27, "eu-south-2": _30, "eu-west-1": [0, { "execute-api": _3, "emrappui-prod": _3, "emrnotebooks-prod": _3, "emrstudio-prod": _3, "dualstack": _22, "s3": _3, "s3-accesspoint": _3, "s3-deprecated": _3, "s3-object-lambda": _3, "s3-website": _3, "analytics-gateway": _3, "aws-cloud9": _25, "cloud9": _26 }], "eu-west-2": _28, "eu-west-3": _27, "il-central-1": [0, { "execute-api": _3, "emrappui-prod": _3, "emrnotebooks-prod": _3, "emrstudio-prod": _3, "dualstack": _22, "s3": _3, "s3-accesspoint": _3, "s3-object-lambda": _3, "s3-website": _3, "aws-cloud9": _25, "cloud9": [0, { "vfs": _3 }] }], "me-central-1": _30, "me-south-1": _28, "sa-east-1": _27, "us-east-1": [2, { "execute-api": _3, "emrappui-prod": _3, "emrnotebooks-prod": _3, "emrstudio-prod": _3, "dualstack": _31, "s3": _3, "s3-accesspoint": _3, "s3-accesspoint-fips": _3, "s3-deprecated": _3, "s3-fips": _3, "s3-object-lambda": _3, "s3-website": _3, "analytics-gateway": _3, "aws-cloud9": _25, "cloud9": _26 }], "us-east-2": _33, "us-gov-east-1": _35, "us-gov-west-1": _35, "us-west-1": _32, "us-west-2": _33, "compute": _6, "compute-1": _6, "airflow": [0, { "af-south-1": _6, "ap-east-1": _6, "ap-northeast-1": _6, "ap-northeast-2": _6, "ap-northeast-3": _6, "ap-south-1": _6, "ap-south-2": _6, "ap-southeast-1": _6, "ap-southeast-2": _6, "ap-southeast-3": _6, "ap-southeast-4": _6, "ca-central-1": _6, "ca-west-1": _6, "eu-central-1": _6, "eu-central-2": _6, "eu-north-1": _6, "eu-south-1": _6, "eu-south-2": _6, "eu-west-1": _6, "eu-west-2": _6, "eu-west-3": _6, "il-central-1": _6, "me-central-1": _6, "me-south-1": _6, "sa-east-1": _6, "us-east-1": _6, "us-east-2": _6, "us-west-1": _6, "us-west-2": _6 }], "s3": _3, "s3-1": _3, "s3-ap-east-1": _3, "s3-ap-northeast-1": _3, "s3-ap-northeast-2": _3, "s3-ap-northeast-3": _3, "s3-ap-south-1": _3, "s3-ap-southeast-1": _3, "s3-ap-southeast-2": _3, "s3-ca-central-1": _3, "s3-eu-central-1": _3, "s3-eu-north-1": _3, "s3-eu-west-1": _3, "s3-eu-west-2": _3, "s3-eu-west-3": _3, "s3-external-1": _3, "s3-fips-us-gov-east-1": _3, "s3-fips-us-gov-west-1": _3, "s3-global": [0, { "accesspoint": [0, { "mrap": _3 }] }], "s3-me-south-1": _3, "s3-sa-east-1": _3, "s3-us-east-2": _3, "s3-us-gov-east-1": _3, "s3-us-gov-west-1": _3, "s3-us-west-1": _3, "s3-us-west-2": _3, "s3-website-ap-northeast-1": _3, "s3-website-ap-southeast-1": _3, "s3-website-ap-southeast-2": _3, "s3-website-eu-west-1": _3, "s3-website-sa-east-1": _3, "s3-website-us-east-1": _3, "s3-website-us-gov-west-1": _3, "s3-website-us-west-1": _3, "s3-website-us-west-2": _3, "elb": _6 }], "amazoncognito": [0, { "af-south-1": _36, "ap-east-1": _36, "ap-northeast-1": _36, "ap-northeast-2": _36, "ap-northeast-3": _36, "ap-south-1": _36, "ap-south-2": _36, "ap-southeast-1": _36, "ap-southeast-2": _36, "ap-southeast-3": _36, "ap-southeast-4": _36, "ap-southeast-5": _36, "ca-central-1": _36, "ca-west-1": _36, "eu-central-1": _36, "eu-central-2": _36, "eu-north-1": _36, "eu-south-1": _36, "eu-south-2": _36, "eu-west-1": _36, "eu-west-2": _36, "eu-west-3": _36, "il-central-1": _36, "me-central-1": _36, "me-south-1": _36, "sa-east-1": _36, "us-east-1": _37, "us-east-2": _37, "us-gov-east-1": _38, "us-gov-west-1": _38, "us-west-1": _37, "us-west-2": _37 }], "amplifyapp": _3, "awsapprunner": _6, "awsapps": _3, "elasticbeanstalk": [2, { "af-south-1": _3, "ap-east-1": _3, "ap-northeast-1": _3, "ap-northeast-2": _3, "ap-northeast-3": _3, "ap-south-1": _3, "ap-southeast-1": _3, "ap-southeast-2": _3, "ap-southeast-3": _3, "ca-central-1": _3, "eu-central-1": _3, "eu-north-1": _3, "eu-south-1": _3, "eu-west-1": _3, "eu-west-2": _3, "eu-west-3": _3, "il-central-1": _3, "me-south-1": _3, "sa-east-1": _3, "us-east-1": _3, "us-east-2": _3, "us-gov-east-1": _3, "us-gov-west-1": _3, "us-west-1": _3, "us-west-2": _3 }], "awsglobalaccelerator": _3, "siiites": _3, "appspacehosted": _3, "appspaceusercontent": _3, "on-aptible": _3, "myasustor": _3, "balena-devices": _3, "boutir": _3, "bplaced": _3, "cafjs": _3, "canva-apps": _3, "cdn77-storage": _3, "br": _3, "cn": _3, "de": _3, "eu": _3, "jpn": _3, "mex": _3, "ru": _3, "sa": _3, "uk": _3, "us": _3, "za": _3, "clever-cloud": [0, { "services": _6 }], "dnsabr": _3, "ip-ddns": _3, "jdevcloud": _3, "wpdevcloud": _3, "cf-ipfs": _3, "cloudflare-ipfs": _3, "trycloudflare": _3, "co": _3, "devinapps": _6, "builtwithdark": _3, "datadetect": [0, { "demo": _3, "instance": _3 }], "dattolocal": _3, "dattorelay": _3, "dattoweb": _3, "mydatto": _3, "digitaloceanspaces": _6, "discordsays": _3, "discordsez": _3, "drayddns": _3, "dreamhosters": _3, "durumis": _3, "mydrobo": _3, "blogdns": _3, "cechire": _3, "dnsalias": _3, "dnsdojo": _3, "doesntexist": _3, "dontexist": _3, "doomdns": _3, "dyn-o-saur": _3, "dynalias": _3, "dyndns-at-home": _3, "dyndns-at-work": _3, "dyndns-blog": _3, "dyndns-free": _3, "dyndns-home": _3, "dyndns-ip": _3, "dyndns-mail": _3, "dyndns-office": _3, "dyndns-pics": _3, "dyndns-remote": _3, "dyndns-server": _3, "dyndns-web": _3, "dyndns-wiki": _3, "dyndns-work": _3, "est-a-la-maison": _3, "est-a-la-masion": _3, "est-le-patron": _3, "est-mon-blogueur": _3, "from-ak": _3, "from-al": _3, "from-ar": _3, "from-ca": _3, "from-ct": _3, "from-dc": _3, "from-de": _3, "from-fl": _3, "from-ga": _3, "from-hi": _3, "from-ia": _3, "from-id": _3, "from-il": _3, "from-in": _3, "from-ks": _3, "from-ky": _3, "from-ma": _3, "from-md": _3, "from-mi": _3, "from-mn": _3, "from-mo": _3, "from-ms": _3, "from-mt": _3, "from-nc": _3, "from-nd": _3, "from-ne": _3, "from-nh": _3, "from-nj": _3, "from-nm": _3, "from-nv": _3, "from-oh": _3, "from-ok": _3, "from-or": _3, "from-pa": _3, "from-pr": _3, "from-ri": _3, "from-sc": _3, "from-sd": _3, "from-tn": _3, "from-tx": _3, "from-ut": _3, "from-va": _3, "from-vt": _3, "from-wa": _3, "from-wi": _3, "from-wv": _3, "from-wy": _3, "getmyip": _3, "gotdns": _3, "hobby-site": _3, "homelinux": _3, "homeunix": _3, "iamallama": _3, "is-a-anarchist": _3, "is-a-blogger": _3, "is-a-bookkeeper": _3, "is-a-bulls-fan": _3, "is-a-caterer": _3, "is-a-chef": _3, "is-a-conservative": _3, "is-a-cpa": _3, "is-a-cubicle-slave": _3, "is-a-democrat": _3, "is-a-designer": _3, "is-a-doctor": _3, "is-a-financialadvisor": _3, "is-a-geek": _3, "is-a-green": _3, "is-a-guru": _3, "is-a-hard-worker": _3, "is-a-hunter": _3, "is-a-landscaper": _3, "is-a-lawyer": _3, "is-a-liberal": _3, "is-a-libertarian": _3, "is-a-llama": _3, "is-a-musician": _3, "is-a-nascarfan": _3, "is-a-nurse": _3, "is-a-painter": _3, "is-a-personaltrainer": _3, "is-a-photographer": _3, "is-a-player": _3, "is-a-republican": _3, "is-a-rockstar": _3, "is-a-socialist": _3, "is-a-student": _3, "is-a-teacher": _3, "is-a-techie": _3, "is-a-therapist": _3, "is-an-accountant": _3, "is-an-actor": _3, "is-an-actress": _3, "is-an-anarchist": _3, "is-an-artist": _3, "is-an-engineer": _3, "is-an-entertainer": _3, "is-certified": _3, "is-gone": _3, "is-into-anime": _3, "is-into-cars": _3, "is-into-cartoons": _3, "is-into-games": _3, "is-leet": _3, "is-not-certified": _3, "is-slick": _3, "is-uberleet": _3, "is-with-theband": _3, "isa-geek": _3, "isa-hockeynut": _3, "issmarterthanyou": _3, "likes-pie": _3, "likescandy": _3, "neat-url": _3, "saves-the-whales": _3, "selfip": _3, "sells-for-less": _3, "sells-for-u": _3, "servebbs": _3, "simple-url": _3, "space-to-rent": _3, "teaches-yoga": _3, "writesthisblog": _3, "ddnsfree": _3, "ddnsgeek": _3, "giize": _3, "gleeze": _3, "kozow": _3, "loseyourip": _3, "ooguy": _3, "theworkpc": _3, "mytuleap": _3, "tuleap-partners": _3, "encoreapi": _3, "evennode": [0, { "eu-1": _3, "eu-2": _3, "eu-3": _3, "eu-4": _3, "us-1": _3, "us-2": _3, "us-3": _3, "us-4": _3 }], "onfabrica": _3, "fastly-edge": _3, "fastly-terrarium": _3, "fastvps-server": _3, "mydobiss": _3, "firebaseapp": _3, "fldrv": _3, "forgeblocks": _3, "framercanvas": _3, "freebox-os": _3, "freeboxos": _3, "freemyip": _3, "aliases121": _3, "gentapps": _3, "gentlentapis": _3, "githubusercontent": _3, "0emm": _6, "appspot": [2, { "r": _6 }], "blogspot": _3, "codespot": _3, "googleapis": _3, "googlecode": _3, "pagespeedmobilizer": _3, "withgoogle": _3, "withyoutube": _3, "grayjayleagues": _3, "hatenablog": _3, "hatenadiary": _3, "herokuapp": _3, "gr": _3, "smushcdn": _3, "wphostedmail": _3, "wpmucdn": _3, "pixolino": _3, "apps-1and1": _3, "live-website": _3, "dopaas": _3, "hosted-by-previder": _40, "hosteur": [0, { "rag-cloud": _3, "rag-cloud-ch": _3 }], "ik-server": [0, { "jcloud": _3, "jcloud-ver-jpc": _3 }], "jelastic": [0, { "demo": _3 }], "massivegrid": _40, "wafaicloud": [0, { "jed": _3, "ryd": _3 }], "webadorsite": _3, "joyent": [0, { "cns": _6 }], "lpusercontent": _3, "linode": [0, { "members": _3, "nodebalancer": _6 }], "linodeobjects": _6, "linodeusercontent": [0, { "ip": _3 }], "localtonet": _3, "lovableproject": _3, "barsycenter": _3, "barsyonline": _3, "modelscape": _3, "mwcloudnonprod": _3, "polyspace": _3, "mazeplay": _3, "miniserver": _3, "atmeta": _3, "fbsbx": _39, "meteorapp": _41, "routingthecloud": _3, "mydbserver": _3, "hostedpi": _3, "mythic-beasts": [0, { "caracal": _3, "customer": _3, "fentiger": _3, "lynx": _3, "ocelot": _3, "oncilla": _3, "onza": _3, "sphinx": _3, "vs": _3, "x": _3, "yali": _3 }], "nospamproxy": [0, { "cloud": [2, { "o365": _3 }] }], "4u": _3, "nfshost": _3, "3utilities": _3, "blogsyte": _3, "ciscofreak": _3, "damnserver": _3, "ddnsking": _3, "ditchyourip": _3, "dnsiskinky": _3, "dynns": _3, "geekgalaxy": _3, "health-carereform": _3, "homesecuritymac": _3, "homesecuritypc": _3, "myactivedirectory": _3, "mysecuritycamera": _3, "myvnc": _3, "net-freaks": _3, "onthewifi": _3, "point2this": _3, "quicksytes": _3, "securitytactics": _3, "servebeer": _3, "servecounterstrike": _3, "serveexchange": _3, "serveftp": _3, "servegame": _3, "servehalflife": _3, "servehttp": _3, "servehumour": _3, "serveirc": _3, "servemp3": _3, "servep2p": _3, "servepics": _3, "servequake": _3, "servesarcasm": _3, "stufftoread": _3, "unusualperson": _3, "workisboring": _3, "myiphost": _3, "observableusercontent": [0, { "static": _3 }], "simplesite": _3, "orsites": _3, "operaunite": _3, "customer-oci": [0, { "*": _3, "oci": _6, "ocp": _6, "ocs": _6 }], "oraclecloudapps": _6, "oraclegovcloudapps": _6, "authgear-staging": _3, "authgearapps": _3, "skygearapp": _3, "outsystemscloud": _3, "ownprovider": _3, "pgfog": _3, "pagexl": _3, "gotpantheon": _3, "paywhirl": _6, "upsunapp": _3, "postman-echo": _3, "prgmr": [0, { "xen": _3 }], "project-study": [0, { "dev": _3 }], "pythonanywhere": _41, "qa2": _3, "alpha-myqnapcloud": _3, "dev-myqnapcloud": _3, "mycloudnas": _3, "mynascloud": _3, "myqnapcloud": _3, "qualifioapp": _3, "ladesk": _3, "qbuser": _3, "quipelements": _6, "rackmaze": _3, "readthedocs-hosted": _3, "rhcloud": _3, "onrender": _3, "render": _42, "subsc-pay": _3, "180r": _3, "dojin": _3, "sakuratan": _3, "sakuraweb": _3, "x0": _3, "code": [0, { "builder": _6, "dev-builder": _6, "stg-builder": _6 }], "salesforce": [0, { "platform": [0, { "code-builder-stg": [0, { "test": [0, { "001": _6 }] }] }] }], "logoip": _3, "scrysec": _3, "firewall-gateway": _3, "myshopblocks": _3, "myshopify": _3, "shopitsite": _3, "1kapp": _3, "appchizi": _3, "applinzi": _3, "sinaapp": _3, "vipsinaapp": _3, "streamlitapp": _3, "try-snowplow": _3, "playstation-cloud": _3, "myspreadshop": _3, "w-corp-staticblitz": _3, "w-credentialless-staticblitz": _3, "w-staticblitz": _3, "stackhero-network": _3, "stdlib": [0, { "api": _3 }], "strapiapp": [2, { "media": _3 }], "streak-link": _3, "streaklinks": _3, "streakusercontent": _3, "temp-dns": _3, "dsmynas": _3, "familyds": _3, "mytabit": _3, "taveusercontent": _3, "tb-hosting": _43, "reservd": _3, "thingdustdata": _3, "townnews-staging": _3, "typeform": [0, { "pro": _3 }], "hk": _3, "it": _3, "deus-canvas": _3, "vultrobjects": _6, "wafflecell": _3, "hotelwithflight": _3, "reserve-online": _3, "cprapid": _3, "pleskns": _3, "remotewd": _3, "wiardweb": [0, { "pages": _3 }], "wixsite": _3, "wixstudio": _3, "messwithdns": _3, "woltlab-demo": _3, "wpenginepowered": [2, { "js": _3 }], "xnbay": [2, { "u2": _3, "u2-local": _3 }], "yolasite": _3 }], "coop": _2, "cr": [1, { "ac": _2, "co": _2, "ed": _2, "fi": _2, "go": _2, "or": _2, "sa": _2 }], "cu": [1, { "com": _2, "edu": _2, "gob": _2, "inf": _2, "nat": _2, "net": _2, "org": _2 }], "cv": [1, { "com": _2, "edu": _2, "id": _2, "int": _2, "net": _2, "nome": _2, "org": _2, "publ": _2 }], "cw": _44, "cx": [1, { "gov": _2, "cloudns": _3, "ath": _3, "info": _3, "assessments": _3, "calculators": _3, "funnels": _3, "paynow": _3, "quizzes": _3, "researched": _3, "tests": _3 }], "cy": [1, { "ac": _2, "biz": _2, "com": [1, { "scaleforce": _45 }], "ekloges": _2, "gov": _2, "ltd": _2, "mil": _2, "net": _2, "org": _2, "press": _2, "pro": _2, "tm": _2 }], "cz": [1, { "contentproxy9": [0, { "rsc": _3 }], "realm": _3, "e4": _3, "co": _3, "metacentrum": [0, { "cloud": _6, "custom": _3 }], "muni": [0, { "cloud": [0, { "flt": _3, "usr": _3 }] }] }], "de": [1, { "bplaced": _3, "square7": _3, "com": _3, "cosidns": _46, "dnsupdater": _3, "dynamisches-dns": _3, "internet-dns": _3, "l-o-g-i-n": _3, "ddnss": [2, { "dyn": _3, "dyndns": _3 }], "dyn-ip24": _3, "dyndns1": _3, "home-webserver": [2, { "dyn": _3 }], "myhome-server": _3, "dnshome": _3, "fuettertdasnetz": _3, "isteingeek": _3, "istmein": _3, "lebtimnetz": _3, "leitungsen": _3, "traeumtgerade": _3, "frusky": _6, "goip": _3, "xn--gnstigbestellen-zvb": _3, "g\xFCnstigbestellen": _3, "xn--gnstigliefern-wob": _3, "g\xFCnstigliefern": _3, "hs-heilbronn": [0, { "it": [0, { "pages": _3, "pages-research": _3 }] }], "dyn-berlin": _3, "in-berlin": _3, "in-brb": _3, "in-butter": _3, "in-dsl": _3, "in-vpn": _3, "iservschule": _3, "mein-iserv": _3, "schulplattform": _3, "schulserver": _3, "test-iserv": _3, "keymachine": _3, "git-repos": _3, "lcube-server": _3, "svn-repos": _3, "barsy": _3, "webspaceconfig": _3, "123webseite": _3, "rub": _3, "ruhr-uni-bochum": [2, { "noc": [0, { "io": _3 }] }], "logoip": _3, "firewall-gateway": _3, "my-gateway": _3, "my-router": _3, "spdns": _3, "speedpartner": [0, { "customer": _3 }], "myspreadshop": _3, "taifun-dns": _3, "12hp": _3, "2ix": _3, "4lima": _3, "lima-city": _3, "dd-dns": _3, "dray-dns": _3, "draydns": _3, "dyn-vpn": _3, "dynvpn": _3, "mein-vigor": _3, "my-vigor": _3, "my-wan": _3, "syno-ds": _3, "synology-diskstation": _3, "synology-ds": _3, "uberspace": _6, "virtual-user": _3, "virtualuser": _3, "community-pro": _3, "diskussionsbereich": _3 }], "dj": _2, "dk": [1, { "biz": _3, "co": _3, "firm": _3, "reg": _3, "store": _3, "123hjemmeside": _3, "myspreadshop": _3 }], "dm": _47, "do": [1, { "art": _2, "com": _2, "edu": _2, "gob": _2, "gov": _2, "mil": _2, "net": _2, "org": _2, "sld": _2, "web": _2 }], "dz": [1, { "art": _2, "asso": _2, "com": _2, "edu": _2, "gov": _2, "net": _2, "org": _2, "pol": _2, "soc": _2, "tm": _2 }], "ec": [1, { "com": _2, "edu": _2, "fin": _2, "gob": _2, "gov": _2, "info": _2, "k12": _2, "med": _2, "mil": _2, "net": _2, "org": _2, "pro": _2, "base": _3, "official": _3 }], "edu": [1, { "rit": [0, { "git-pages": _3 }] }], "ee": [1, { "aip": _2, "com": _2, "edu": _2, "fie": _2, "gov": _2, "lib": _2, "med": _2, "org": _2, "pri": _2, "riik": _2 }], "eg": [1, { "ac": _2, "com": _2, "edu": _2, "eun": _2, "gov": _2, "info": _2, "me": _2, "mil": _2, "name": _2, "net": _2, "org": _2, "sci": _2, "sport": _2, "tv": _2 }], "er": _17, "es": [1, { "com": _2, "edu": _2, "gob": _2, "nom": _2, "org": _2, "123miweb": _3, "myspreadshop": _3 }], "et": [1, { "biz": _2, "com": _2, "edu": _2, "gov": _2, "info": _2, "name": _2, "net": _2, "org": _2 }], "eu": [1, { "airkitapps": _3, "cloudns": _3, "dogado": [0, { "jelastic": _3 }], "barsy": _3, "spdns": _3, "transurl": _6, "diskstation": _3 }], "fi": [1, { "aland": _2, "dy": _3, "xn--hkkinen-5wa": _3, "h\xE4kkinen": _3, "iki": _3, "cloudplatform": [0, { "fi": _3 }], "datacenter": [0, { "demo": _3, "paas": _3 }], "kapsi": _3, "123kotisivu": _3, "myspreadshop": _3 }], "fj": [1, { "ac": _2, "biz": _2, "com": _2, "gov": _2, "info": _2, "mil": _2, "name": _2, "net": _2, "org": _2, "pro": _2 }], "fk": _17, "fm": [1, { "com": _2, "edu": _2, "net": _2, "org": _2, "radio": _3, "user": _6 }], "fo": _2, "fr": [1, { "asso": _2, "com": _2, "gouv": _2, "nom": _2, "prd": _2, "tm": _2, "avoues": _2, "cci": _2, "greta": _2, "huissier-justice": _2, "en-root": _3, "fbx-os": _3, "fbxos": _3, "freebox-os": _3, "freeboxos": _3, "goupile": _3, "123siteweb": _3, "on-web": _3, "chirurgiens-dentistes-en-france": _3, "dedibox": _3, "aeroport": _3, "avocat": _3, "chambagri": _3, "chirurgiens-dentistes": _3, "experts-comptables": _3, "medecin": _3, "notaires": _3, "pharmacien": _3, "port": _3, "veterinaire": _3, "myspreadshop": _3, "ynh": _3 }], "ga": _2, "gb": _2, "gd": [1, { "edu": _2, "gov": _2 }], "ge": [1, { "com": _2, "edu": _2, "gov": _2, "net": _2, "org": _2, "pvt": _2, "school": _2 }], "gf": _2, "gg": [1, { "co": _2, "net": _2, "org": _2, "botdash": _3, "kaas": _3, "stackit": _3, "panel": [2, { "daemon": _3 }] }], "gh": [1, { "com": _2, "edu": _2, "gov": _2, "mil": _2, "org": _2 }], "gi": [1, { "com": _2, "edu": _2, "gov": _2, "ltd": _2, "mod": _2, "org": _2 }], "gl": [1, { "co": _2, "com": _2, "edu": _2, "net": _2, "org": _2, "biz": _3 }], "gm": _2, "gn": [1, { "ac": _2, "com": _2, "edu": _2, "gov": _2, "net": _2, "org": _2 }], "gov": _2, "gp": [1, { "asso": _2, "com": _2, "edu": _2, "mobi": _2, "net": _2, "org": _2 }], "gq": _2, "gr": [1, { "com": _2, "edu": _2, "gov": _2, "net": _2, "org": _2, "barsy": _3, "simplesite": _3 }], "gs": _2, "gt": [1, { "com": _2, "edu": _2, "gob": _2, "ind": _2, "mil": _2, "net": _2, "org": _2 }], "gu": [1, { "com": _2, "edu": _2, "gov": _2, "guam": _2, "info": _2, "net": _2, "org": _2, "web": _2 }], "gw": _2, "gy": _47, "hk": [1, { "com": _2, "edu": _2, "gov": _2, "idv": _2, "net": _2, "org": _2, "xn--ciqpn": _2, "\u4E2A\u4EBA": _2, "xn--gmqw5a": _2, "\u500B\u4EBA": _2, "xn--55qx5d": _2, "\u516C\u53F8": _2, "xn--mxtq1m": _2, "\u653F\u5E9C": _2, "xn--lcvr32d": _2, "\u654E\u80B2": _2, "xn--wcvs22d": _2, "\u6559\u80B2": _2, "xn--gmq050i": _2, "\u7B87\u4EBA": _2, "xn--uc0atv": _2, "\u7D44\u7E54": _2, "xn--uc0ay4a": _2, "\u7D44\u7EC7": _2, "xn--od0alg": _2, "\u7DB2\u7D61": _2, "xn--zf0avx": _2, "\u7DB2\u7EDC": _2, "xn--mk0axi": _2, "\u7EC4\u7E54": _2, "xn--tn0ag": _2, "\u7EC4\u7EC7": _2, "xn--od0aq3b": _2, "\u7F51\u7D61": _2, "xn--io0a7i": _2, "\u7F51\u7EDC": _2, "inc": _3, "ltd": _3 }], "hm": _2, "hn": [1, { "com": _2, "edu": _2, "gob": _2, "mil": _2, "net": _2, "org": _2 }], "hr": [1, { "com": _2, "from": _2, "iz": _2, "name": _2, "brendly": _50 }], "ht": [1, { "adult": _2, "art": _2, "asso": _2, "com": _2, "coop": _2, "edu": _2, "firm": _2, "gouv": _2, "info": _2, "med": _2, "net": _2, "org": _2, "perso": _2, "pol": _2, "pro": _2, "rel": _2, "shop": _2, "rt": _3 }], "hu": [1, { "2000": _2, "agrar": _2, "bolt": _2, "casino": _2, "city": _2, "co": _2, "erotica": _2, "erotika": _2, "film": _2, "forum": _2, "games": _2, "hotel": _2, "info": _2, "ingatlan": _2, "jogasz": _2, "konyvelo": _2, "lakas": _2, "media": _2, "news": _2, "org": _2, "priv": _2, "reklam": _2, "sex": _2, "shop": _2, "sport": _2, "suli": _2, "szex": _2, "tm": _2, "tozsde": _2, "utazas": _2, "video": _2 }], "id": [1, { "ac": _2, "biz": _2, "co": _2, "desa": _2, "go": _2, "mil": _2, "my": _2, "net": _2, "or": _2, "ponpes": _2, "sch": _2, "web": _2, "zone": _3 }], "ie": [1, { "gov": _2, "myspreadshop": _3 }], "il": [1, { "ac": _2, "co": [1, { "ravpage": _3, "mytabit": _3, "tabitorder": _3 }], "gov": _2, "idf": _2, "k12": _2, "muni": _2, "net": _2, "org": _2 }], "xn--4dbrk0ce": [1, { "xn--4dbgdty6c": _2, "xn--5dbhl8d": _2, "xn--8dbq2a": _2, "xn--hebda8b": _2 }], "\u05D9\u05E9\u05E8\u05D0\u05DC": [1, { "\u05D0\u05E7\u05D3\u05DE\u05D9\u05D4": _2, "\u05D9\u05E9\u05D5\u05D1": _2, "\u05E6\u05D4\u05DC": _2, "\u05DE\u05DE\u05E9\u05DC": _2 }], "im": [1, { "ac": _2, "co": [1, { "ltd": _2, "plc": _2 }], "com": _2, "net": _2, "org": _2, "tt": _2, "tv": _2 }], "in": [1, { "5g": _2, "6g": _2, "ac": _2, "ai": _2, "am": _2, "bihar": _2, "biz": _2, "business": _2, "ca": _2, "cn": _2, "co": _2, "com": _2, "coop": _2, "cs": _2, "delhi": _2, "dr": _2, "edu": _2, "er": _2, "firm": _2, "gen": _2, "gov": _2, "gujarat": _2, "ind": _2, "info": _2, "int": _2, "internet": _2, "io": _2, "me": _2, "mil": _2, "net": _2, "nic": _2, "org": _2, "pg": _2, "post": _2, "pro": _2, "res": _2, "travel": _2, "tv": _2, "uk": _2, "up": _2, "us": _2, "cloudns": _3, "barsy": _3, "web": _3, "supabase": _3 }], "info": [1, { "cloudns": _3, "dynamic-dns": _3, "barrel-of-knowledge": _3, "barrell-of-knowledge": _3, "dyndns": _3, "for-our": _3, "groks-the": _3, "groks-this": _3, "here-for-more": _3, "knowsitall": _3, "selfip": _3, "webhop": _3, "barsy": _3, "mayfirst": _3, "mittwald": _3, "mittwaldserver": _3, "typo3server": _3, "dvrcam": _3, "ilovecollege": _3, "no-ip": _3, "forumz": _3, "nsupdate": _3, "dnsupdate": _3, "v-info": _3 }], "int": [1, { "eu": _2 }], "io": [1, { "2038": _3, "co": _2, "com": _2, "edu": _2, "gov": _2, "mil": _2, "net": _2, "nom": _2, "org": _2, "on-acorn": _6, "myaddr": _3, "apigee": _3, "b-data": _3, "beagleboard": _3, "bitbucket": _3, "bluebite": _3, "boxfuse": _3, "brave": _7, "browsersafetymark": _3, "bubble": _51, "bubbleapps": _3, "bigv": [0, { "uk0": _3 }], "cleverapps": _3, "cloudbeesusercontent": _3, "dappnode": [0, { "dyndns": _3 }], "darklang": _3, "definima": _3, "dedyn": _3, "fh-muenster": _3, "shw": _3, "forgerock": [0, { "id": _3 }], "github": _3, "gitlab": _3, "lolipop": _3, "hasura-app": _3, "hostyhosting": _3, "hypernode": _3, "moonscale": _6, "beebyte": _40, "beebyteapp": [0, { "sekd1": _3 }], "jele": _3, "webthings": _3, "loginline": _3, "barsy": _3, "azurecontainer": _6, "ngrok": [2, { "ap": _3, "au": _3, "eu": _3, "in": _3, "jp": _3, "sa": _3, "us": _3 }], "nodeart": [0, { "stage": _3 }], "pantheonsite": _3, "pstmn": [2, { "mock": _3 }], "protonet": _3, "qcx": [2, { "sys": _6 }], "qoto": _3, "vaporcloud": _3, "myrdbx": _3, "rb-hosting": _43, "on-k3s": _6, "on-rio": _6, "readthedocs": _3, "resindevice": _3, "resinstaging": [0, { "devices": _3 }], "hzc": _3, "sandcats": _3, "scrypted": [0, { "client": _3 }], "mo-siemens": _3, "lair": _39, "stolos": _6, "musician": _3, "utwente": _3, "edugit": _3, "telebit": _3, "thingdust": [0, { "dev": _52, "disrec": _52, "prod": _53, "testing": _52 }], "tickets": _3, "webflow": _3, "webflowtest": _3, "editorx": _3, "wixstudio": _3, "basicserver": _3, "virtualserver": _3 }], "iq": _5, "ir": [1, { "ac": _2, "co": _2, "gov": _2, "id": _2, "net": _2, "org": _2, "sch": _2, "xn--mgba3a4f16a": _2, "\u0627\u06CC\u0631\u0627\u0646": _2, "xn--mgba3a4fra": _2, "\u0627\u064A\u0631\u0627\u0646": _2, "arvanedge": _3 }], "is": _2, "it": [1, { "edu": _2, "gov": _2, "abr": _2, "abruzzo": _2, "aosta-valley": _2, "aostavalley": _2, "bas": _2, "basilicata": _2, "cal": _2, "calabria": _2, "cam": _2, "campania": _2, "emilia-romagna": _2, "emiliaromagna": _2, "emr": _2, "friuli-v-giulia": _2, "friuli-ve-giulia": _2, "friuli-vegiulia": _2, "friuli-venezia-giulia": _2, "friuli-veneziagiulia": _2, "friuli-vgiulia": _2, "friuliv-giulia": _2, "friulive-giulia": _2, "friulivegiulia": _2, "friulivenezia-giulia": _2, "friuliveneziagiulia": _2, "friulivgiulia": _2, "fvg": _2, "laz": _2, "lazio": _2, "lig": _2, "liguria": _2, "lom": _2, "lombardia": _2, "lombardy": _2, "lucania": _2, "mar": _2, "marche": _2, "mol": _2, "molise": _2, "piedmont": _2, "piemonte": _2, "pmn": _2, "pug": _2, "puglia": _2, "sar": _2, "sardegna": _2, "sardinia": _2, "sic": _2, "sicilia": _2, "sicily": _2, "taa": _2, "tos": _2, "toscana": _2, "trentin-sud-tirol": _2, "xn--trentin-sd-tirol-rzb": _2, "trentin-s\xFCd-tirol": _2, "trentin-sudtirol": _2, "xn--trentin-sdtirol-7vb": _2, "trentin-s\xFCdtirol": _2, "trentin-sued-tirol": _2, "trentin-suedtirol": _2, "trentino": _2, "trentino-a-adige": _2, "trentino-aadige": _2, "trentino-alto-adige": _2, "trentino-altoadige": _2, "trentino-s-tirol": _2, "trentino-stirol": _2, "trentino-sud-tirol": _2, "xn--trentino-sd-tirol-c3b": _2, "trentino-s\xFCd-tirol": _2, "trentino-sudtirol": _2, "xn--trentino-sdtirol-szb": _2, "trentino-s\xFCdtirol": _2, "trentino-sued-tirol": _2, "trentino-suedtirol": _2, "trentinoa-adige": _2, "trentinoaadige": _2, "trentinoalto-adige": _2, "trentinoaltoadige": _2, "trentinos-tirol": _2, "trentinostirol": _2, "trentinosud-tirol": _2, "xn--trentinosd-tirol-rzb": _2, "trentinos\xFCd-tirol": _2, "trentinosudtirol": _2, "xn--trentinosdtirol-7vb": _2, "trentinos\xFCdtirol": _2, "trentinosued-tirol": _2, "trentinosuedtirol": _2, "trentinsud-tirol": _2, "xn--trentinsd-tirol-6vb": _2, "trentins\xFCd-tirol": _2, "trentinsudtirol": _2, "xn--trentinsdtirol-nsb": _2, "trentins\xFCdtirol": _2, "trentinsued-tirol": _2, "trentinsuedtirol": _2, "tuscany": _2, "umb": _2, "umbria": _2, "val-d-aosta": _2, "val-daosta": _2, "vald-aosta": _2, "valdaosta": _2, "valle-aosta": _2, "valle-d-aosta": _2, "valle-daosta": _2, "valleaosta": _2, "valled-aosta": _2, "valledaosta": _2, "vallee-aoste": _2, "xn--valle-aoste-ebb": _2, "vall\xE9e-aoste": _2, "vallee-d-aoste": _2, "xn--valle-d-aoste-ehb": _2, "vall\xE9e-d-aoste": _2, "valleeaoste": _2, "xn--valleaoste-e7a": _2, "vall\xE9eaoste": _2, "valleedaoste": _2, "xn--valledaoste-ebb": _2, "vall\xE9edaoste": _2, "vao": _2, "vda": _2, "ven": _2, "veneto": _2, "ag": _2, "agrigento": _2, "al": _2, "alessandria": _2, "alto-adige": _2, "altoadige": _2, "an": _2, "ancona": _2, "andria-barletta-trani": _2, "andria-trani-barletta": _2, "andriabarlettatrani": _2, "andriatranibarletta": _2, "ao": _2, "aosta": _2, "aoste": _2, "ap": _2, "aq": _2, "aquila": _2, "ar": _2, "arezzo": _2, "ascoli-piceno": _2, "ascolipiceno": _2, "asti": _2, "at": _2, "av": _2, "avellino": _2, "ba": _2, "balsan": _2, "balsan-sudtirol": _2, "xn--balsan-sdtirol-nsb": _2, "balsan-s\xFCdtirol": _2, "balsan-suedtirol": _2, "bari": _2, "barletta-trani-andria": _2, "barlettatraniandria": _2, "belluno": _2, "benevento": _2, "bergamo": _2, "bg": _2, "bi": _2, "biella": _2, "bl": _2, "bn": _2, "bo": _2, "bologna": _2, "bolzano": _2, "bolzano-altoadige": _2, "bozen": _2, "bozen-sudtirol": _2, "xn--bozen-sdtirol-2ob": _2, "bozen-s\xFCdtirol": _2, "bozen-suedtirol": _2, "br": _2, "brescia": _2, "brindisi": _2, "bs": _2, "bt": _2, "bulsan": _2, "bulsan-sudtirol": _2, "xn--bulsan-sdtirol-nsb": _2, "bulsan-s\xFCdtirol": _2, "bulsan-suedtirol": _2, "bz": _2, "ca": _2, "cagliari": _2, "caltanissetta": _2, "campidano-medio": _2, "campidanomedio": _2, "campobasso": _2, "carbonia-iglesias": _2, "carboniaiglesias": _2, "carrara-massa": _2, "carraramassa": _2, "caserta": _2, "catania": _2, "catanzaro": _2, "cb": _2, "ce": _2, "cesena-forli": _2, "xn--cesena-forl-mcb": _2, "cesena-forl\xEC": _2, "cesenaforli": _2, "xn--cesenaforl-i8a": _2, "cesenaforl\xEC": _2, "ch": _2, "chieti": _2, "ci": _2, "cl": _2, "cn": _2, "co": _2, "como": _2, "cosenza": _2, "cr": _2, "cremona": _2, "crotone": _2, "cs": _2, "ct": _2, "cuneo": _2, "cz": _2, "dell-ogliastra": _2, "dellogliastra": _2, "en": _2, "enna": _2, "fc": _2, "fe": _2, "fermo": _2, "ferrara": _2, "fg": _2, "fi": _2, "firenze": _2, "florence": _2, "fm": _2, "foggia": _2, "forli-cesena": _2, "xn--forl-cesena-fcb": _2, "forl\xEC-cesena": _2, "forlicesena": _2, "xn--forlcesena-c8a": _2, "forl\xECcesena": _2, "fr": _2, "frosinone": _2, "ge": _2, "genoa": _2, "genova": _2, "go": _2, "gorizia": _2, "gr": _2, "grosseto": _2, "iglesias-carbonia": _2, "iglesiascarbonia": _2, "im": _2, "imperia": _2, "is": _2, "isernia": _2, "kr": _2, "la-spezia": _2, "laquila": _2, "laspezia": _2, "latina": _2, "lc": _2, "le": _2, "lecce": _2, "lecco": _2, "li": _2, "livorno": _2, "lo": _2, "lodi": _2, "lt": _2, "lu": _2, "lucca": _2, "macerata": _2, "mantova": _2, "massa-carrara": _2, "massacarrara": _2, "matera": _2, "mb": _2, "mc": _2, "me": _2, "medio-campidano": _2, "mediocampidano": _2, "messina": _2, "mi": _2, "milan": _2, "milano": _2, "mn": _2, "mo": _2, "modena": _2, "monza": _2, "monza-brianza": _2, "monza-e-della-brianza": _2, "monzabrianza": _2, "monzaebrianza": _2, "monzaedellabrianza": _2, "ms": _2, "mt": _2, "na": _2, "naples": _2, "napoli": _2, "no": _2, "novara": _2, "nu": _2, "nuoro": _2, "og": _2, "ogliastra": _2, "olbia-tempio": _2, "olbiatempio": _2, "or": _2, "oristano": _2, "ot": _2, "pa": _2, "padova": _2, "padua": _2, "palermo": _2, "parma": _2, "pavia": _2, "pc": _2, "pd": _2, "pe": _2, "perugia": _2, "pesaro-urbino": _2, "pesarourbino": _2, "pescara": _2, "pg": _2, "pi": _2, "piacenza": _2, "pisa": _2, "pistoia": _2, "pn": _2, "po": _2, "pordenone": _2, "potenza": _2, "pr": _2, "prato": _2, "pt": _2, "pu": _2, "pv": _2, "pz": _2, "ra": _2, "ragusa": _2, "ravenna": _2, "rc": _2, "re": _2, "reggio-calabria": _2, "reggio-emilia": _2, "reggiocalabria": _2, "reggioemilia": _2, "rg": _2, "ri": _2, "rieti": _2, "rimini": _2, "rm": _2, "rn": _2, "ro": _2, "roma": _2, "rome": _2, "rovigo": _2, "sa": _2, "salerno": _2, "sassari": _2, "savona": _2, "si": _2, "siena": _2, "siracusa": _2, "so": _2, "sondrio": _2, "sp": _2, "sr": _2, "ss": _2, "xn--sdtirol-n2a": _2, "s\xFCdtirol": _2, "suedtirol": _2, "sv": _2, "ta": _2, "taranto": _2, "te": _2, "tempio-olbia": _2, "tempioolbia": _2, "teramo": _2, "terni": _2, "tn": _2, "to": _2, "torino": _2, "tp": _2, "tr": _2, "trani-andria-barletta": _2, "trani-barletta-andria": _2, "traniandriabarletta": _2, "tranibarlettaandria": _2, "trapani": _2, "trento": _2, "treviso": _2, "trieste": _2, "ts": _2, "turin": _2, "tv": _2, "ud": _2, "udine": _2, "urbino-pesaro": _2, "urbinopesaro": _2, "va": _2, "varese": _2, "vb": _2, "vc": _2, "ve": _2, "venezia": _2, "venice": _2, "verbania": _2, "vercelli": _2, "verona": _2, "vi": _2, "vibo-valentia": _2, "vibovalentia": _2, "vicenza": _2, "viterbo": _2, "vr": _2, "vs": _2, "vt": _2, "vv": _2, "12chars": _3, "ibxos": _3, "iliadboxos": _3, "neen": [0, { "jc": _3 }], "123homepage": _3, "16-b": _3, "32-b": _3, "64-b": _3, "myspreadshop": _3, "syncloud": _3 }], "je": [1, { "co": _2, "net": _2, "org": _2, "of": _3 }], "jm": _17, "jo": [1, { "agri": _2, "ai": _2, "com": _2, "edu": _2, "eng": _2, "fm": _2, "gov": _2, "mil": _2, "net": _2, "org": _2, "per": _2, "phd": _2, "sch": _2, "tv": _2 }], "jobs": _2, "jp": [1, { "ac": _2, "ad": _2, "co": _2, "ed": _2, "go": _2, "gr": _2, "lg": _2, "ne": [1, { "aseinet": _49, "gehirn": _3, "ivory": _3, "mail-box": _3, "mints": _3, "mokuren": _3, "opal": _3, "sakura": _3, "sumomo": _3, "topaz": _3 }], "or": _2, "aichi": [1, { "aisai": _2, "ama": _2, "anjo": _2, "asuke": _2, "chiryu": _2, "chita": _2, "fuso": _2, "gamagori": _2, "handa": _2, "hazu": _2, "hekinan": _2, "higashiura": _2, "ichinomiya": _2, "inazawa": _2, "inuyama": _2, "isshiki": _2, "iwakura": _2, "kanie": _2, "kariya": _2, "kasugai": _2, "kira": _2, "kiyosu": _2, "komaki": _2, "konan": _2, "kota": _2, "mihama": _2, "miyoshi": _2, "nishio": _2, "nisshin": _2, "obu": _2, "oguchi": _2, "oharu": _2, "okazaki": _2, "owariasahi": _2, "seto": _2, "shikatsu": _2, "shinshiro": _2, "shitara": _2, "tahara": _2, "takahama": _2, "tobishima": _2, "toei": _2, "togo": _2, "tokai": _2, "tokoname": _2, "toyoake": _2, "toyohashi": _2, "toyokawa": _2, "toyone": _2, "toyota": _2, "tsushima": _2, "yatomi": _2 }], "akita": [1, { "akita": _2, "daisen": _2, "fujisato": _2, "gojome": _2, "hachirogata": _2, "happou": _2, "higashinaruse": _2, "honjo": _2, "honjyo": _2, "ikawa": _2, "kamikoani": _2, "kamioka": _2, "katagami": _2, "kazuno": _2, "kitaakita": _2, "kosaka": _2, "kyowa": _2, "misato": _2, "mitane": _2, "moriyoshi": _2, "nikaho": _2, "noshiro": _2, "odate": _2, "oga": _2, "ogata": _2, "semboku": _2, "yokote": _2, "yurihonjo": _2 }], "aomori": [1, { "aomori": _2, "gonohe": _2, "hachinohe": _2, "hashikami": _2, "hiranai": _2, "hirosaki": _2, "itayanagi": _2, "kuroishi": _2, "misawa": _2, "mutsu": _2, "nakadomari": _2, "noheji": _2, "oirase": _2, "owani": _2, "rokunohe": _2, "sannohe": _2, "shichinohe": _2, "shingo": _2, "takko": _2, "towada": _2, "tsugaru": _2, "tsuruta": _2 }], "chiba": [1, { "abiko": _2, "asahi": _2, "chonan": _2, "chosei": _2, "choshi": _2, "chuo": _2, "funabashi": _2, "futtsu": _2, "hanamigawa": _2, "ichihara": _2, "ichikawa": _2, "ichinomiya": _2, "inzai": _2, "isumi": _2, "kamagaya": _2, "kamogawa": _2, "kashiwa": _2, "katori": _2, "katsuura": _2, "kimitsu": _2, "kisarazu": _2, "kozaki": _2, "kujukuri": _2, "kyonan": _2, "matsudo": _2, "midori": _2, "mihama": _2, "minamiboso": _2, "mobara": _2, "mutsuzawa": _2, "nagara": _2, "nagareyama": _2, "narashino": _2, "narita": _2, "noda": _2, "oamishirasato": _2, "omigawa": _2, "onjuku": _2, "otaki": _2, "sakae": _2, "sakura": _2, "shimofusa": _2, "shirako": _2, "shiroi": _2, "shisui": _2, "sodegaura": _2, "sosa": _2, "tako": _2, "tateyama": _2, "togane": _2, "tohnosho": _2, "tomisato": _2, "urayasu": _2, "yachimata": _2, "yachiyo": _2, "yokaichiba": _2, "yokoshibahikari": _2, "yotsukaido": _2 }], "ehime": [1, { "ainan": _2, "honai": _2, "ikata": _2, "imabari": _2, "iyo": _2, "kamijima": _2, "kihoku": _2, "kumakogen": _2, "masaki": _2, "matsuno": _2, "matsuyama": _2, "namikata": _2, "niihama": _2, "ozu": _2, "saijo": _2, "seiyo": _2, "shikokuchuo": _2, "tobe": _2, "toon": _2, "uchiko": _2, "uwajima": _2, "yawatahama": _2 }], "fukui": [1, { "echizen": _2, "eiheiji": _2, "fukui": _2, "ikeda": _2, "katsuyama": _2, "mihama": _2, "minamiechizen": _2, "obama": _2, "ohi": _2, "ono": _2, "sabae": _2, "sakai": _2, "takahama": _2, "tsuruga": _2, "wakasa": _2 }], "fukuoka": [1, { "ashiya": _2, "buzen": _2, "chikugo": _2, "chikuho": _2, "chikujo": _2, "chikushino": _2, "chikuzen": _2, "chuo": _2, "dazaifu": _2, "fukuchi": _2, "hakata": _2, "higashi": _2, "hirokawa": _2, "hisayama": _2, "iizuka": _2, "inatsuki": _2, "kaho": _2, "kasuga": _2, "kasuya": _2, "kawara": _2, "keisen": _2, "koga": _2, "kurate": _2, "kurogi": _2, "kurume": _2, "minami": _2, "miyako": _2, "miyama": _2, "miyawaka": _2, "mizumaki": _2, "munakata": _2, "nakagawa": _2, "nakama": _2, "nishi": _2, "nogata": _2, "ogori": _2, "okagaki": _2, "okawa": _2, "oki": _2, "omuta": _2, "onga": _2, "onojo": _2, "oto": _2, "saigawa": _2, "sasaguri": _2, "shingu": _2, "shinyoshitomi": _2, "shonai": _2, "soeda": _2, "sue": _2, "tachiarai": _2, "tagawa": _2, "takata": _2, "toho": _2, "toyotsu": _2, "tsuiki": _2, "ukiha": _2, "umi": _2, "usui": _2, "yamada": _2, "yame": _2, "yanagawa": _2, "yukuhashi": _2 }], "fukushima": [1, { "aizubange": _2, "aizumisato": _2, "aizuwakamatsu": _2, "asakawa": _2, "bandai": _2, "date": _2, "fukushima": _2, "furudono": _2, "futaba": _2, "hanawa": _2, "higashi": _2, "hirata": _2, "hirono": _2, "iitate": _2, "inawashiro": _2, "ishikawa": _2, "iwaki": _2, "izumizaki": _2, "kagamiishi": _2, "kaneyama": _2, "kawamata": _2, "kitakata": _2, "kitashiobara": _2, "koori": _2, "koriyama": _2, "kunimi": _2, "miharu": _2, "mishima": _2, "namie": _2, "nango": _2, "nishiaizu": _2, "nishigo": _2, "okuma": _2, "omotego": _2, "ono": _2, "otama": _2, "samegawa": _2, "shimogo": _2, "shirakawa": _2, "showa": _2, "soma": _2, "sukagawa": _2, "taishin": _2, "tamakawa": _2, "tanagura": _2, "tenei": _2, "yabuki": _2, "yamato": _2, "yamatsuri": _2, "yanaizu": _2, "yugawa": _2 }], "gifu": [1, { "anpachi": _2, "ena": _2, "gifu": _2, "ginan": _2, "godo": _2, "gujo": _2, "hashima": _2, "hichiso": _2, "hida": _2, "higashishirakawa": _2, "ibigawa": _2, "ikeda": _2, "kakamigahara": _2, "kani": _2, "kasahara": _2, "kasamatsu": _2, "kawaue": _2, "kitagata": _2, "mino": _2, "minokamo": _2, "mitake": _2, "mizunami": _2, "motosu": _2, "nakatsugawa": _2, "ogaki": _2, "sakahogi": _2, "seki": _2, "sekigahara": _2, "shirakawa": _2, "tajimi": _2, "takayama": _2, "tarui": _2, "toki": _2, "tomika": _2, "wanouchi": _2, "yamagata": _2, "yaotsu": _2, "yoro": _2 }], "gunma": [1, { "annaka": _2, "chiyoda": _2, "fujioka": _2, "higashiagatsuma": _2, "isesaki": _2, "itakura": _2, "kanna": _2, "kanra": _2, "katashina": _2, "kawaba": _2, "kiryu": _2, "kusatsu": _2, "maebashi": _2, "meiwa": _2, "midori": _2, "minakami": _2, "naganohara": _2, "nakanojo": _2, "nanmoku": _2, "numata": _2, "oizumi": _2, "ora": _2, "ota": _2, "shibukawa": _2, "shimonita": _2, "shinto": _2, "showa": _2, "takasaki": _2, "takayama": _2, "tamamura": _2, "tatebayashi": _2, "tomioka": _2, "tsukiyono": _2, "tsumagoi": _2, "ueno": _2, "yoshioka": _2 }], "hiroshima": [1, { "asaminami": _2, "daiwa": _2, "etajima": _2, "fuchu": _2, "fukuyama": _2, "hatsukaichi": _2, "higashihiroshima": _2, "hongo": _2, "jinsekikogen": _2, "kaita": _2, "kui": _2, "kumano": _2, "kure": _2, "mihara": _2, "miyoshi": _2, "naka": _2, "onomichi": _2, "osakikamijima": _2, "otake": _2, "saka": _2, "sera": _2, "seranishi": _2, "shinichi": _2, "shobara": _2, "takehara": _2 }], "hokkaido": [1, { "abashiri": _2, "abira": _2, "aibetsu": _2, "akabira": _2, "akkeshi": _2, "asahikawa": _2, "ashibetsu": _2, "ashoro": _2, "assabu": _2, "atsuma": _2, "bibai": _2, "biei": _2, "bifuka": _2, "bihoro": _2, "biratori": _2, "chippubetsu": _2, "chitose": _2, "date": _2, "ebetsu": _2, "embetsu": _2, "eniwa": _2, "erimo": _2, "esan": _2, "esashi": _2, "fukagawa": _2, "fukushima": _2, "furano": _2, "furubira": _2, "haboro": _2, "hakodate": _2, "hamatonbetsu": _2, "hidaka": _2, "higashikagura": _2, "higashikawa": _2, "hiroo": _2, "hokuryu": _2, "hokuto": _2, "honbetsu": _2, "horokanai": _2, "horonobe": _2, "ikeda": _2, "imakane": _2, "ishikari": _2, "iwamizawa": _2, "iwanai": _2, "kamifurano": _2, "kamikawa": _2, "kamishihoro": _2, "kamisunagawa": _2, "kamoenai": _2, "kayabe": _2, "kembuchi": _2, "kikonai": _2, "kimobetsu": _2, "kitahiroshima": _2, "kitami": _2, "kiyosato": _2, "koshimizu": _2, "kunneppu": _2, "kuriyama": _2, "kuromatsunai": _2, "kushiro": _2, "kutchan": _2, "kyowa": _2, "mashike": _2, "matsumae": _2, "mikasa": _2, "minamifurano": _2, "mombetsu": _2, "moseushi": _2, "mukawa": _2, "muroran": _2, "naie": _2, "nakagawa": _2, "nakasatsunai": _2, "nakatombetsu": _2, "nanae": _2, "nanporo": _2, "nayoro": _2, "nemuro": _2, "niikappu": _2, "niki": _2, "nishiokoppe": _2, "noboribetsu": _2, "numata": _2, "obihiro": _2, "obira": _2, "oketo": _2, "okoppe": _2, "otaru": _2, "otobe": _2, "otofuke": _2, "otoineppu": _2, "oumu": _2, "ozora": _2, "pippu": _2, "rankoshi": _2, "rebun": _2, "rikubetsu": _2, "rishiri": _2, "rishirifuji": _2, "saroma": _2, "sarufutsu": _2, "shakotan": _2, "shari": _2, "shibecha": _2, "shibetsu": _2, "shikabe": _2, "shikaoi": _2, "shimamaki": _2, "shimizu": _2, "shimokawa": _2, "shinshinotsu": _2, "shintoku": _2, "shiranuka": _2, "shiraoi": _2, "shiriuchi": _2, "sobetsu": _2, "sunagawa": _2, "taiki": _2, "takasu": _2, "takikawa": _2, "takinoue": _2, "teshikaga": _2, "tobetsu": _2, "tohma": _2, "tomakomai": _2, "tomari": _2, "toya": _2, "toyako": _2, "toyotomi": _2, "toyoura": _2, "tsubetsu": _2, "tsukigata": _2, "urakawa": _2, "urausu": _2, "uryu": _2, "utashinai": _2, "wakkanai": _2, "wassamu": _2, "yakumo": _2, "yoichi": _2 }], "hyogo": [1, { "aioi": _2, "akashi": _2, "ako": _2, "amagasaki": _2, "aogaki": _2, "asago": _2, "ashiya": _2, "awaji": _2, "fukusaki": _2, "goshiki": _2, "harima": _2, "himeji": _2, "ichikawa": _2, "inagawa": _2, "itami": _2, "kakogawa": _2, "kamigori": _2, "kamikawa": _2, "kasai": _2, "kasuga": _2, "kawanishi": _2, "miki": _2, "minamiawaji": _2, "nishinomiya": _2, "nishiwaki": _2, "ono": _2, "sanda": _2, "sannan": _2, "sasayama": _2, "sayo": _2, "shingu": _2, "shinonsen": _2, "shiso": _2, "sumoto": _2, "taishi": _2, "taka": _2, "takarazuka": _2, "takasago": _2, "takino": _2, "tamba": _2, "tatsuno": _2, "toyooka": _2, "yabu": _2, "yashiro": _2, "yoka": _2, "yokawa": _2 }], "ibaraki": [1, { "ami": _2, "asahi": _2, "bando": _2, "chikusei": _2, "daigo": _2, "fujishiro": _2, "hitachi": _2, "hitachinaka": _2, "hitachiomiya": _2, "hitachiota": _2, "ibaraki": _2, "ina": _2, "inashiki": _2, "itako": _2, "iwama": _2, "joso": _2, "kamisu": _2, "kasama": _2, "kashima": _2, "kasumigaura": _2, "koga": _2, "miho": _2, "mito": _2, "moriya": _2, "naka": _2, "namegata": _2, "oarai": _2, "ogawa": _2, "omitama": _2, "ryugasaki": _2, "sakai": _2, "sakuragawa": _2, "shimodate": _2, "shimotsuma": _2, "shirosato": _2, "sowa": _2, "suifu": _2, "takahagi": _2, "tamatsukuri": _2, "tokai": _2, "tomobe": _2, "tone": _2, "toride": _2, "tsuchiura": _2, "tsukuba": _2, "uchihara": _2, "ushiku": _2, "yachiyo": _2, "yamagata": _2, "yawara": _2, "yuki": _2 }], "ishikawa": [1, { "anamizu": _2, "hakui": _2, "hakusan": _2, "kaga": _2, "kahoku": _2, "kanazawa": _2, "kawakita": _2, "komatsu": _2, "nakanoto": _2, "nanao": _2, "nomi": _2, "nonoichi": _2, "noto": _2, "shika": _2, "suzu": _2, "tsubata": _2, "tsurugi": _2, "uchinada": _2, "wajima": _2 }], "iwate": [1, { "fudai": _2, "fujisawa": _2, "hanamaki": _2, "hiraizumi": _2, "hirono": _2, "ichinohe": _2, "ichinoseki": _2, "iwaizumi": _2, "iwate": _2, "joboji": _2, "kamaishi": _2, "kanegasaki": _2, "karumai": _2, "kawai": _2, "kitakami": _2, "kuji": _2, "kunohe": _2, "kuzumaki": _2, "miyako": _2, "mizusawa": _2, "morioka": _2, "ninohe": _2, "noda": _2, "ofunato": _2, "oshu": _2, "otsuchi": _2, "rikuzentakata": _2, "shiwa": _2, "shizukuishi": _2, "sumita": _2, "tanohata": _2, "tono": _2, "yahaba": _2, "yamada": _2 }], "kagawa": [1, { "ayagawa": _2, "higashikagawa": _2, "kanonji": _2, "kotohira": _2, "manno": _2, "marugame": _2, "mitoyo": _2, "naoshima": _2, "sanuki": _2, "tadotsu": _2, "takamatsu": _2, "tonosho": _2, "uchinomi": _2, "utazu": _2, "zentsuji": _2 }], "kagoshima": [1, { "akune": _2, "amami": _2, "hioki": _2, "isa": _2, "isen": _2, "izumi": _2, "kagoshima": _2, "kanoya": _2, "kawanabe": _2, "kinko": _2, "kouyama": _2, "makurazaki": _2, "matsumoto": _2, "minamitane": _2, "nakatane": _2, "nishinoomote": _2, "satsumasendai": _2, "soo": _2, "tarumizu": _2, "yusui": _2 }], "kanagawa": [1, { "aikawa": _2, "atsugi": _2, "ayase": _2, "chigasaki": _2, "ebina": _2, "fujisawa": _2, "hadano": _2, "hakone": _2, "hiratsuka": _2, "isehara": _2, "kaisei": _2, "kamakura": _2, "kiyokawa": _2, "matsuda": _2, "minamiashigara": _2, "miura": _2, "nakai": _2, "ninomiya": _2, "odawara": _2, "oi": _2, "oiso": _2, "sagamihara": _2, "samukawa": _2, "tsukui": _2, "yamakita": _2, "yamato": _2, "yokosuka": _2, "yugawara": _2, "zama": _2, "zushi": _2 }], "kochi": [1, { "aki": _2, "geisei": _2, "hidaka": _2, "higashitsuno": _2, "ino": _2, "kagami": _2, "kami": _2, "kitagawa": _2, "kochi": _2, "mihara": _2, "motoyama": _2, "muroto": _2, "nahari": _2, "nakamura": _2, "nankoku": _2, "nishitosa": _2, "niyodogawa": _2, "ochi": _2, "okawa": _2, "otoyo": _2, "otsuki": _2, "sakawa": _2, "sukumo": _2, "susaki": _2, "tosa": _2, "tosashimizu": _2, "toyo": _2, "tsuno": _2, "umaji": _2, "yasuda": _2, "yusuhara": _2 }], "kumamoto": [1, { "amakusa": _2, "arao": _2, "aso": _2, "choyo": _2, "gyokuto": _2, "kamiamakusa": _2, "kikuchi": _2, "kumamoto": _2, "mashiki": _2, "mifune": _2, "minamata": _2, "minamioguni": _2, "nagasu": _2, "nishihara": _2, "oguni": _2, "ozu": _2, "sumoto": _2, "takamori": _2, "uki": _2, "uto": _2, "yamaga": _2, "yamato": _2, "yatsushiro": _2 }], "kyoto": [1, { "ayabe": _2, "fukuchiyama": _2, "higashiyama": _2, "ide": _2, "ine": _2, "joyo": _2, "kameoka": _2, "kamo": _2, "kita": _2, "kizu": _2, "kumiyama": _2, "kyotamba": _2, "kyotanabe": _2, "kyotango": _2, "maizuru": _2, "minami": _2, "minamiyamashiro": _2, "miyazu": _2, "muko": _2, "nagaokakyo": _2, "nakagyo": _2, "nantan": _2, "oyamazaki": _2, "sakyo": _2, "seika": _2, "tanabe": _2, "uji": _2, "ujitawara": _2, "wazuka": _2, "yamashina": _2, "yawata": _2 }], "mie": [1, { "asahi": _2, "inabe": _2, "ise": _2, "kameyama": _2, "kawagoe": _2, "kiho": _2, "kisosaki": _2, "kiwa": _2, "komono": _2, "kumano": _2, "kuwana": _2, "matsusaka": _2, "meiwa": _2, "mihama": _2, "minamiise": _2, "misugi": _2, "miyama": _2, "nabari": _2, "shima": _2, "suzuka": _2, "tado": _2, "taiki": _2, "taki": _2, "tamaki": _2, "toba": _2, "tsu": _2, "udono": _2, "ureshino": _2, "watarai": _2, "yokkaichi": _2 }], "miyagi": [1, { "furukawa": _2, "higashimatsushima": _2, "ishinomaki": _2, "iwanuma": _2, "kakuda": _2, "kami": _2, "kawasaki": _2, "marumori": _2, "matsushima": _2, "minamisanriku": _2, "misato": _2, "murata": _2, "natori": _2, "ogawara": _2, "ohira": _2, "onagawa": _2, "osaki": _2, "rifu": _2, "semine": _2, "shibata": _2, "shichikashuku": _2, "shikama": _2, "shiogama": _2, "shiroishi": _2, "tagajo": _2, "taiwa": _2, "tome": _2, "tomiya": _2, "wakuya": _2, "watari": _2, "yamamoto": _2, "zao": _2 }], "miyazaki": [1, { "aya": _2, "ebino": _2, "gokase": _2, "hyuga": _2, "kadogawa": _2, "kawaminami": _2, "kijo": _2, "kitagawa": _2, "kitakata": _2, "kitaura": _2, "kobayashi": _2, "kunitomi": _2, "kushima": _2, "mimata": _2, "miyakonojo": _2, "miyazaki": _2, "morotsuka": _2, "nichinan": _2, "nishimera": _2, "nobeoka": _2, "saito": _2, "shiiba": _2, "shintomi": _2, "takaharu": _2, "takanabe": _2, "takazaki": _2, "tsuno": _2 }], "nagano": [1, { "achi": _2, "agematsu": _2, "anan": _2, "aoki": _2, "asahi": _2, "azumino": _2, "chikuhoku": _2, "chikuma": _2, "chino": _2, "fujimi": _2, "hakuba": _2, "hara": _2, "hiraya": _2, "iida": _2, "iijima": _2, "iiyama": _2, "iizuna": _2, "ikeda": _2, "ikusaka": _2, "ina": _2, "karuizawa": _2, "kawakami": _2, "kiso": _2, "kisofukushima": _2, "kitaaiki": _2, "komagane": _2, "komoro": _2, "matsukawa": _2, "matsumoto": _2, "miasa": _2, "minamiaiki": _2, "minamimaki": _2, "minamiminowa": _2, "minowa": _2, "miyada": _2, "miyota": _2, "mochizuki": _2, "nagano": _2, "nagawa": _2, "nagiso": _2, "nakagawa": _2, "nakano": _2, "nozawaonsen": _2, "obuse": _2, "ogawa": _2, "okaya": _2, "omachi": _2, "omi": _2, "ookuwa": _2, "ooshika": _2, "otaki": _2, "otari": _2, "sakae": _2, "sakaki": _2, "saku": _2, "sakuho": _2, "shimosuwa": _2, "shinanomachi": _2, "shiojiri": _2, "suwa": _2, "suzaka": _2, "takagi": _2, "takamori": _2, "takayama": _2, "tateshina": _2, "tatsuno": _2, "togakushi": _2, "togura": _2, "tomi": _2, "ueda": _2, "wada": _2, "yamagata": _2, "yamanouchi": _2, "yasaka": _2, "yasuoka": _2 }], "nagasaki": [1, { "chijiwa": _2, "futsu": _2, "goto": _2, "hasami": _2, "hirado": _2, "iki": _2, "isahaya": _2, "kawatana": _2, "kuchinotsu": _2, "matsuura": _2, "nagasaki": _2, "obama": _2, "omura": _2, "oseto": _2, "saikai": _2, "sasebo": _2, "seihi": _2, "shimabara": _2, "shinkamigoto": _2, "togitsu": _2, "tsushima": _2, "unzen": _2 }], "nara": [1, { "ando": _2, "gose": _2, "heguri": _2, "higashiyoshino": _2, "ikaruga": _2, "ikoma": _2, "kamikitayama": _2, "kanmaki": _2, "kashiba": _2, "kashihara": _2, "katsuragi": _2, "kawai": _2, "kawakami": _2, "kawanishi": _2, "koryo": _2, "kurotaki": _2, "mitsue": _2, "miyake": _2, "nara": _2, "nosegawa": _2, "oji": _2, "ouda": _2, "oyodo": _2, "sakurai": _2, "sango": _2, "shimoichi": _2, "shimokitayama": _2, "shinjo": _2, "soni": _2, "takatori": _2, "tawaramoto": _2, "tenkawa": _2, "tenri": _2, "uda": _2, "yamatokoriyama": _2, "yamatotakada": _2, "yamazoe": _2, "yoshino": _2 }], "niigata": [1, { "aga": _2, "agano": _2, "gosen": _2, "itoigawa": _2, "izumozaki": _2, "joetsu": _2, "kamo": _2, "kariwa": _2, "kashiwazaki": _2, "minamiuonuma": _2, "mitsuke": _2, "muika": _2, "murakami": _2, "myoko": _2, "nagaoka": _2, "niigata": _2, "ojiya": _2, "omi": _2, "sado": _2, "sanjo": _2, "seiro": _2, "seirou": _2, "sekikawa": _2, "shibata": _2, "tagami": _2, "tainai": _2, "tochio": _2, "tokamachi": _2, "tsubame": _2, "tsunan": _2, "uonuma": _2, "yahiko": _2, "yoita": _2, "yuzawa": _2 }], "oita": [1, { "beppu": _2, "bungoono": _2, "bungotakada": _2, "hasama": _2, "hiji": _2, "himeshima": _2, "hita": _2, "kamitsue": _2, "kokonoe": _2, "kuju": _2, "kunisaki": _2, "kusu": _2, "oita": _2, "saiki": _2, "taketa": _2, "tsukumi": _2, "usa": _2, "usuki": _2, "yufu": _2 }], "okayama": [1, { "akaiwa": _2, "asakuchi": _2, "bizen": _2, "hayashima": _2, "ibara": _2, "kagamino": _2, "kasaoka": _2, "kibichuo": _2, "kumenan": _2, "kurashiki": _2, "maniwa": _2, "misaki": _2, "nagi": _2, "niimi": _2, "nishiawakura": _2, "okayama": _2, "satosho": _2, "setouchi": _2, "shinjo": _2, "shoo": _2, "soja": _2, "takahashi": _2, "tamano": _2, "tsuyama": _2, "wake": _2, "yakage": _2 }], "okinawa": [1, { "aguni": _2, "ginowan": _2, "ginoza": _2, "gushikami": _2, "haebaru": _2, "higashi": _2, "hirara": _2, "iheya": _2, "ishigaki": _2, "ishikawa": _2, "itoman": _2, "izena": _2, "kadena": _2, "kin": _2, "kitadaito": _2, "kitanakagusuku": _2, "kumejima": _2, "kunigami": _2, "minamidaito": _2, "motobu": _2, "nago": _2, "naha": _2, "nakagusuku": _2, "nakijin": _2, "nanjo": _2, "nishihara": _2, "ogimi": _2, "okinawa": _2, "onna": _2, "shimoji": _2, "taketomi": _2, "tarama": _2, "tokashiki": _2, "tomigusuku": _2, "tonaki": _2, "urasoe": _2, "uruma": _2, "yaese": _2, "yomitan": _2, "yonabaru": _2, "yonaguni": _2, "zamami": _2 }], "osaka": [1, { "abeno": _2, "chihayaakasaka": _2, "chuo": _2, "daito": _2, "fujiidera": _2, "habikino": _2, "hannan": _2, "higashiosaka": _2, "higashisumiyoshi": _2, "higashiyodogawa": _2, "hirakata": _2, "ibaraki": _2, "ikeda": _2, "izumi": _2, "izumiotsu": _2, "izumisano": _2, "kadoma": _2, "kaizuka": _2, "kanan": _2, "kashiwara": _2, "katano": _2, "kawachinagano": _2, "kishiwada": _2, "kita": _2, "kumatori": _2, "matsubara": _2, "minato": _2, "minoh": _2, "misaki": _2, "moriguchi": _2, "neyagawa": _2, "nishi": _2, "nose": _2, "osakasayama": _2, "sakai": _2, "sayama": _2, "sennan": _2, "settsu": _2, "shijonawate": _2, "shimamoto": _2, "suita": _2, "tadaoka": _2, "taishi": _2, "tajiri": _2, "takaishi": _2, "takatsuki": _2, "tondabayashi": _2, "toyonaka": _2, "toyono": _2, "yao": _2 }], "saga": [1, { "ariake": _2, "arita": _2, "fukudomi": _2, "genkai": _2, "hamatama": _2, "hizen": _2, "imari": _2, "kamimine": _2, "kanzaki": _2, "karatsu": _2, "kashima": _2, "kitagata": _2, "kitahata": _2, "kiyama": _2, "kouhoku": _2, "kyuragi": _2, "nishiarita": _2, "ogi": _2, "omachi": _2, "ouchi": _2, "saga": _2, "shiroishi": _2, "taku": _2, "tara": _2, "tosu": _2, "yoshinogari": _2 }], "saitama": [1, { "arakawa": _2, "asaka": _2, "chichibu": _2, "fujimi": _2, "fujimino": _2, "fukaya": _2, "hanno": _2, "hanyu": _2, "hasuda": _2, "hatogaya": _2, "hatoyama": _2, "hidaka": _2, "higashichichibu": _2, "higashimatsuyama": _2, "honjo": _2, "ina": _2, "iruma": _2, "iwatsuki": _2, "kamiizumi": _2, "kamikawa": _2, "kamisato": _2, "kasukabe": _2, "kawagoe": _2, "kawaguchi": _2, "kawajima": _2, "kazo": _2, "kitamoto": _2, "koshigaya": _2, "kounosu": _2, "kuki": _2, "kumagaya": _2, "matsubushi": _2, "minano": _2, "misato": _2, "miyashiro": _2, "miyoshi": _2, "moroyama": _2, "nagatoro": _2, "namegawa": _2, "niiza": _2, "ogano": _2, "ogawa": _2, "ogose": _2, "okegawa": _2, "omiya": _2, "otaki": _2, "ranzan": _2, "ryokami": _2, "saitama": _2, "sakado": _2, "satte": _2, "sayama": _2, "shiki": _2, "shiraoka": _2, "soka": _2, "sugito": _2, "toda": _2, "tokigawa": _2, "tokorozawa": _2, "tsurugashima": _2, "urawa": _2, "warabi": _2, "yashio": _2, "yokoze": _2, "yono": _2, "yorii": _2, "yoshida": _2, "yoshikawa": _2, "yoshimi": _2 }], "shiga": [1, { "aisho": _2, "gamo": _2, "higashiomi": _2, "hikone": _2, "koka": _2, "konan": _2, "kosei": _2, "koto": _2, "kusatsu": _2, "maibara": _2, "moriyama": _2, "nagahama": _2, "nishiazai": _2, "notogawa": _2, "omihachiman": _2, "otsu": _2, "ritto": _2, "ryuoh": _2, "takashima": _2, "takatsuki": _2, "torahime": _2, "toyosato": _2, "yasu": _2 }], "shimane": [1, { "akagi": _2, "ama": _2, "gotsu": _2, "hamada": _2, "higashiizumo": _2, "hikawa": _2, "hikimi": _2, "izumo": _2, "kakinoki": _2, "masuda": _2, "matsue": _2, "misato": _2, "nishinoshima": _2, "ohda": _2, "okinoshima": _2, "okuizumo": _2, "shimane": _2, "tamayu": _2, "tsuwano": _2, "unnan": _2, "yakumo": _2, "yasugi": _2, "yatsuka": _2 }], "shizuoka": [1, { "arai": _2, "atami": _2, "fuji": _2, "fujieda": _2, "fujikawa": _2, "fujinomiya": _2, "fukuroi": _2, "gotemba": _2, "haibara": _2, "hamamatsu": _2, "higashiizu": _2, "ito": _2, "iwata": _2, "izu": _2, "izunokuni": _2, "kakegawa": _2, "kannami": _2, "kawanehon": _2, "kawazu": _2, "kikugawa": _2, "kosai": _2, "makinohara": _2, "matsuzaki": _2, "minamiizu": _2, "mishima": _2, "morimachi": _2, "nishiizu": _2, "numazu": _2, "omaezaki": _2, "shimada": _2, "shimizu": _2, "shimoda": _2, "shizuoka": _2, "susono": _2, "yaizu": _2, "yoshida": _2 }], "tochigi": [1, { "ashikaga": _2, "bato": _2, "haga": _2, "ichikai": _2, "iwafune": _2, "kaminokawa": _2, "kanuma": _2, "karasuyama": _2, "kuroiso": _2, "mashiko": _2, "mibu": _2, "moka": _2, "motegi": _2, "nasu": _2, "nasushiobara": _2, "nikko": _2, "nishikata": _2, "nogi": _2, "ohira": _2, "ohtawara": _2, "oyama": _2, "sakura": _2, "sano": _2, "shimotsuke": _2, "shioya": _2, "takanezawa": _2, "tochigi": _2, "tsuga": _2, "ujiie": _2, "utsunomiya": _2, "yaita": _2 }], "tokushima": [1, { "aizumi": _2, "anan": _2, "ichiba": _2, "itano": _2, "kainan": _2, "komatsushima": _2, "matsushige": _2, "mima": _2, "minami": _2, "miyoshi": _2, "mugi": _2, "nakagawa": _2, "naruto": _2, "sanagochi": _2, "shishikui": _2, "tokushima": _2, "wajiki": _2 }], "tokyo": [1, { "adachi": _2, "akiruno": _2, "akishima": _2, "aogashima": _2, "arakawa": _2, "bunkyo": _2, "chiyoda": _2, "chofu": _2, "chuo": _2, "edogawa": _2, "fuchu": _2, "fussa": _2, "hachijo": _2, "hachioji": _2, "hamura": _2, "higashikurume": _2, "higashimurayama": _2, "higashiyamato": _2, "hino": _2, "hinode": _2, "hinohara": _2, "inagi": _2, "itabashi": _2, "katsushika": _2, "kita": _2, "kiyose": _2, "kodaira": _2, "koganei": _2, "kokubunji": _2, "komae": _2, "koto": _2, "kouzushima": _2, "kunitachi": _2, "machida": _2, "meguro": _2, "minato": _2, "mitaka": _2, "mizuho": _2, "musashimurayama": _2, "musashino": _2, "nakano": _2, "nerima": _2, "ogasawara": _2, "okutama": _2, "ome": _2, "oshima": _2, "ota": _2, "setagaya": _2, "shibuya": _2, "shinagawa": _2, "shinjuku": _2, "suginami": _2, "sumida": _2, "tachikawa": _2, "taito": _2, "tama": _2, "toshima": _2 }], "tottori": [1, { "chizu": _2, "hino": _2, "kawahara": _2, "koge": _2, "kotoura": _2, "misasa": _2, "nanbu": _2, "nichinan": _2, "sakaiminato": _2, "tottori": _2, "wakasa": _2, "yazu": _2, "yonago": _2 }], "toyama": [1, { "asahi": _2, "fuchu": _2, "fukumitsu": _2, "funahashi": _2, "himi": _2, "imizu": _2, "inami": _2, "johana": _2, "kamiichi": _2, "kurobe": _2, "nakaniikawa": _2, "namerikawa": _2, "nanto": _2, "nyuzen": _2, "oyabe": _2, "taira": _2, "takaoka": _2, "tateyama": _2, "toga": _2, "tonami": _2, "toyama": _2, "unazuki": _2, "uozu": _2, "yamada": _2 }], "wakayama": [1, { "arida": _2, "aridagawa": _2, "gobo": _2, "hashimoto": _2, "hidaka": _2, "hirogawa": _2, "inami": _2, "iwade": _2, "kainan": _2, "kamitonda": _2, "katsuragi": _2, "kimino": _2, "kinokawa": _2, "kitayama": _2, "koya": _2, "koza": _2, "kozagawa": _2, "kudoyama": _2, "kushimoto": _2, "mihama": _2, "misato": _2, "nachikatsuura": _2, "shingu": _2, "shirahama": _2, "taiji": _2, "tanabe": _2, "wakayama": _2, "yuasa": _2, "yura": _2 }], "yamagata": [1, { "asahi": _2, "funagata": _2, "higashine": _2, "iide": _2, "kahoku": _2, "kaminoyama": _2, "kaneyama": _2, "kawanishi": _2, "mamurogawa": _2, "mikawa": _2, "murayama": _2, "nagai": _2, "nakayama": _2, "nanyo": _2, "nishikawa": _2, "obanazawa": _2, "oe": _2, "oguni": _2, "ohkura": _2, "oishida": _2, "sagae": _2, "sakata": _2, "sakegawa": _2, "shinjo": _2, "shirataka": _2, "shonai": _2, "takahata": _2, "tendo": _2, "tozawa": _2, "tsuruoka": _2, "yamagata": _2, "yamanobe": _2, "yonezawa": _2, "yuza": _2 }], "yamaguchi": [1, { "abu": _2, "hagi": _2, "hikari": _2, "hofu": _2, "iwakuni": _2, "kudamatsu": _2, "mitou": _2, "nagato": _2, "oshima": _2, "shimonoseki": _2, "shunan": _2, "tabuse": _2, "tokuyama": _2, "toyota": _2, "ube": _2, "yuu": _2 }], "yamanashi": [1, { "chuo": _2, "doshi": _2, "fuefuki": _2, "fujikawa": _2, "fujikawaguchiko": _2, "fujiyoshida": _2, "hayakawa": _2, "hokuto": _2, "ichikawamisato": _2, "kai": _2, "kofu": _2, "koshu": _2, "kosuge": _2, "minami-alps": _2, "minobu": _2, "nakamichi": _2, "nanbu": _2, "narusawa": _2, "nirasaki": _2, "nishikatsura": _2, "oshino": _2, "otsuki": _2, "showa": _2, "tabayama": _2, "tsuru": _2, "uenohara": _2, "yamanakako": _2, "yamanashi": _2 }], "xn--ehqz56n": _2, "\u4E09\u91CD": _2, "xn--1lqs03n": _2, "\u4EAC\u90FD": _2, "xn--qqqt11m": _2, "\u4F50\u8CC0": _2, "xn--f6qx53a": _2, "\u5175\u5EAB": _2, "xn--djrs72d6uy": _2, "\u5317\u6D77\u9053": _2, "xn--mkru45i": _2, "\u5343\u8449": _2, "xn--0trq7p7nn": _2, "\u548C\u6B4C\u5C71": _2, "xn--5js045d": _2, "\u57FC\u7389": _2, "xn--kbrq7o": _2, "\u5927\u5206": _2, "xn--pssu33l": _2, "\u5927\u962A": _2, "xn--ntsq17g": _2, "\u5948\u826F": _2, "xn--uisz3g": _2, "\u5BAE\u57CE": _2, "xn--6btw5a": _2, "\u5BAE\u5D0E": _2, "xn--1ctwo": _2, "\u5BCC\u5C71": _2, "xn--6orx2r": _2, "\u5C71\u53E3": _2, "xn--rht61e": _2, "\u5C71\u5F62": _2, "xn--rht27z": _2, "\u5C71\u68A8": _2, "xn--nit225k": _2, "\u5C90\u961C": _2, "xn--rht3d": _2, "\u5CA1\u5C71": _2, "xn--djty4k": _2, "\u5CA9\u624B": _2, "xn--klty5x": _2, "\u5CF6\u6839": _2, "xn--kltx9a": _2, "\u5E83\u5CF6": _2, "xn--kltp7d": _2, "\u5FB3\u5CF6": _2, "xn--c3s14m": _2, "\u611B\u5A9B": _2, "xn--vgu402c": _2, "\u611B\u77E5": _2, "xn--efvn9s": _2, "\u65B0\u6F5F": _2, "xn--1lqs71d": _2, "\u6771\u4EAC": _2, "xn--4pvxs": _2, "\u6803\u6728": _2, "xn--uuwu58a": _2, "\u6C96\u7E04": _2, "xn--zbx025d": _2, "\u6ECB\u8CC0": _2, "xn--8pvr4u": _2, "\u718A\u672C": _2, "xn--5rtp49c": _2, "\u77F3\u5DDD": _2, "xn--ntso0iqx3a": _2, "\u795E\u5948\u5DDD": _2, "xn--elqq16h": _2, "\u798F\u4E95": _2, "xn--4it168d": _2, "\u798F\u5CA1": _2, "xn--klt787d": _2, "\u798F\u5CF6": _2, "xn--rny31h": _2, "\u79CB\u7530": _2, "xn--7t0a264c": _2, "\u7FA4\u99AC": _2, "xn--uist22h": _2, "\u8328\u57CE": _2, "xn--8ltr62k": _2, "\u9577\u5D0E": _2, "xn--2m4a15e": _2, "\u9577\u91CE": _2, "xn--32vp30h": _2, "\u9752\u68EE": _2, "xn--4it797k": _2, "\u9759\u5CA1": _2, "xn--5rtq34k": _2, "\u9999\u5DDD": _2, "xn--k7yn95e": _2, "\u9AD8\u77E5": _2, "xn--tor131o": _2, "\u9CE5\u53D6": _2, "xn--d5qv7z876c": _2, "\u9E7F\u5150\u5CF6": _2, "kawasaki": _17, "kitakyushu": _17, "kobe": _17, "nagoya": _17, "sapporo": _17, "sendai": _17, "yokohama": _17, "buyshop": _3, "fashionstore": _3, "handcrafted": _3, "kawaiishop": _3, "supersale": _3, "theshop": _3, "0am": _3, "0g0": _3, "0j0": _3, "0t0": _3, "mydns": _3, "pgw": _3, "wjg": _3, "usercontent": _3, "angry": _3, "babyblue": _3, "babymilk": _3, "backdrop": _3, "bambina": _3, "bitter": _3, "blush": _3, "boo": _3, "boy": _3, "boyfriend": _3, "but": _3, "candypop": _3, "capoo": _3, "catfood": _3, "cheap": _3, "chicappa": _3, "chillout": _3, "chips": _3, "chowder": _3, "chu": _3, "ciao": _3, "cocotte": _3, "coolblog": _3, "cranky": _3, "cutegirl": _3, "daa": _3, "deca": _3, "deci": _3, "digick": _3, "egoism": _3, "fakefur": _3, "fem": _3, "flier": _3, "floppy": _3, "fool": _3, "frenchkiss": _3, "girlfriend": _3, "girly": _3, "gloomy": _3, "gonna": _3, "greater": _3, "hacca": _3, "heavy": _3, "her": _3, "hiho": _3, "hippy": _3, "holy": _3, "hungry": _3, "icurus": _3, "itigo": _3, "jellybean": _3, "kikirara": _3, "kill": _3, "kilo": _3, "kuron": _3, "littlestar": _3, "lolipopmc": _3, "lolitapunk": _3, "lomo": _3, "lovepop": _3, "lovesick": _3, "main": _3, "mods": _3, "mond": _3, "mongolian": _3, "moo": _3, "namaste": _3, "nikita": _3, "nobushi": _3, "noor": _3, "oops": _3, "parallel": _3, "parasite": _3, "pecori": _3, "peewee": _3, "penne": _3, "pepper": _3, "perma": _3, "pigboat": _3, "pinoko": _3, "punyu": _3, "pupu": _3, "pussycat": _3, "pya": _3, "raindrop": _3, "readymade": _3, "sadist": _3, "schoolbus": _3, "secret": _3, "staba": _3, "stripper": _3, "sub": _3, "sunnyday": _3, "thick": _3, "tonkotsu": _3, "under": _3, "upper": _3, "velvet": _3, "verse": _3, "versus": _3, "vivian": _3, "watson": _3, "weblike": _3, "whitesnow": _3, "zombie": _3, "hateblo": _3, "hatenablog": _3, "hatenadiary": _3, "2-d": _3, "bona": _3, "crap": _3, "daynight": _3, "eek": _3, "flop": _3, "halfmoon": _3, "jeez": _3, "matrix": _3, "mimoza": _3, "netgamers": _3, "nyanta": _3, "o0o0": _3, "rdy": _3, "rgr": _3, "rulez": _3, "sakurastorage": [0, { "isk01": _54, "isk02": _54 }], "saloon": _3, "sblo": _3, "skr": _3, "tank": _3, "uh-oh": _3, "undo": _3, "webaccel": [0, { "rs": _3, "user": _3 }], "websozai": _3, "xii": _3 }], "ke": [1, { "ac": _2, "co": _2, "go": _2, "info": _2, "me": _2, "mobi": _2, "ne": _2, "or": _2, "sc": _2 }], "kg": [1, { "com": _2, "edu": _2, "gov": _2, "mil": _2, "net": _2, "org": _2, "us": _3 }], "kh": _17, "ki": _55, "km": [1, { "ass": _2, "com": _2, "edu": _2, "gov": _2, "mil": _2, "nom": _2, "org": _2, "prd": _2, "tm": _2, "asso": _2, "coop": _2, "gouv": _2, "medecin": _2, "notaires": _2, "pharmaciens": _2, "presse": _2, "veterinaire": _2 }], "kn": [1, { "edu": _2, "gov": _2, "net": _2, "org": _2 }], "kp": [1, { "com": _2, "edu": _2, "gov": _2, "org": _2, "rep": _2, "tra": _2 }], "kr": [1, { "ac": _2, "ai": _2, "co": _2, "es": _2, "go": _2, "hs": _2, "io": _2, "it": _2, "kg": _2, "me": _2, "mil": _2, "ms": _2, "ne": _2, "or": _2, "pe": _2, "re": _2, "sc": _2, "busan": _2, "chungbuk": _2, "chungnam": _2, "daegu": _2, "daejeon": _2, "gangwon": _2, "gwangju": _2, "gyeongbuk": _2, "gyeonggi": _2, "gyeongnam": _2, "incheon": _2, "jeju": _2, "jeonbuk": _2, "jeonnam": _2, "seoul": _2, "ulsan": _2, "c01": _3, "eliv-dns": _3, "mmv": _3, "vki": _3 }], "kw": [1, { "com": _2, "edu": _2, "emb": _2, "gov": _2, "ind": _2, "net": _2, "org": _2 }], "ky": _44, "kz": [1, { "com": _2, "edu": _2, "gov": _2, "mil": _2, "net": _2, "org": _2, "jcloud": _3 }], "la": [1, { "com": _2, "edu": _2, "gov": _2, "info": _2, "int": _2, "net": _2, "org": _2, "per": _2, "bnr": _3 }], "lb": _4, "lc": [1, { "co": _2, "com": _2, "edu": _2, "gov": _2, "net": _2, "org": _2, "oy": _3 }], "li": _2, "lk": [1, { "ac": _2, "assn": _2, "com": _2, "edu": _2, "gov": _2, "grp": _2, "hotel": _2, "int": _2, "ltd": _2, "net": _2, "ngo": _2, "org": _2, "sch": _2, "soc": _2, "web": _2 }], "lr": _4, "ls": [1, { "ac": _2, "biz": _2, "co": _2, "edu": _2, "gov": _2, "info": _2, "net": _2, "org": _2, "sc": _2 }], "lt": _10, "lu": [1, { "123website": _3 }], "lv": [1, { "asn": _2, "com": _2, "conf": _2, "edu": _2, "gov": _2, "id": _2, "mil": _2, "net": _2, "org": _2 }], "ly": [1, { "com": _2, "edu": _2, "gov": _2, "id": _2, "med": _2, "net": _2, "org": _2, "plc": _2, "sch": _2 }], "ma": [1, { "ac": _2, "co": _2, "gov": _2, "net": _2, "org": _2, "press": _2 }], "mc": [1, { "asso": _2, "tm": _2 }], "md": [1, { "ir": _3 }], "me": [1, { "ac": _2, "co": _2, "edu": _2, "gov": _2, "its": _2, "net": _2, "org": _2, "priv": _2, "c66": _3, "craft": _3, "edgestack": _3, "filegear": _3, "glitch": _3, "filegear-sg": _3, "lohmus": _3, "barsy": _3, "mcdir": _3, "brasilia": _3, "ddns": _3, "dnsfor": _3, "hopto": _3, "loginto": _3, "noip": _3, "webhop": _3, "soundcast": _3, "tcp4": _3, "vp4": _3, "diskstation": _3, "dscloud": _3, "i234": _3, "myds": _3, "synology": _3, "transip": _43, "nohost": _3 }], "mg": [1, { "co": _2, "com": _2, "edu": _2, "gov": _2, "mil": _2, "nom": _2, "org": _2, "prd": _2 }], "mh": _2, "mil": _2, "mk": [1, { "com": _2, "edu": _2, "gov": _2, "inf": _2, "name": _2, "net": _2, "org": _2 }], "ml": [1, { "ac": _2, "art": _2, "asso": _2, "com": _2, "edu": _2, "gouv": _2, "gov": _2, "info": _2, "inst": _2, "net": _2, "org": _2, "pr": _2, "presse": _2 }], "mm": _17, "mn": [1, { "edu": _2, "gov": _2, "org": _2, "nyc": _3 }], "mo": _4, "mobi": [1, { "barsy": _3, "dscloud": _3 }], "mp": [1, { "ju": _3 }], "mq": _2, "mr": _10, "ms": [1, { "com": _2, "edu": _2, "gov": _2, "net": _2, "org": _2, "minisite": _3 }], "mt": _44, "mu": [1, { "ac": _2, "co": _2, "com": _2, "gov": _2, "net": _2, "or": _2, "org": _2 }], "museum": _2, "mv": [1, { "aero": _2, "biz": _2, "com": _2, "coop": _2, "edu": _2, "gov": _2, "info": _2, "int": _2, "mil": _2, "museum": _2, "name": _2, "net": _2, "org": _2, "pro": _2 }], "mw": [1, { "ac": _2, "biz": _2, "co": _2, "com": _2, "coop": _2, "edu": _2, "gov": _2, "int": _2, "net": _2, "org": _2 }], "mx": [1, { "com": _2, "edu": _2, "gob": _2, "net": _2, "org": _2 }], "my": [1, { "biz": _2, "com": _2, "edu": _2, "gov": _2, "mil": _2, "name": _2, "net": _2, "org": _2 }], "mz": [1, { "ac": _2, "adv": _2, "co": _2, "edu": _2, "gov": _2, "mil": _2, "net": _2, "org": _2 }], "na": [1, { "alt": _2, "co": _2, "com": _2, "gov": _2, "net": _2, "org": _2 }], "name": [1, { "her": _58, "his": _58 }], "nc": [1, { "asso": _2, "nom": _2 }], "ne": _2, "net": [1, { "adobeaemcloud": _3, "adobeio-static": _3, "adobeioruntime": _3, "akadns": _3, "akamai": _3, "akamai-staging": _3, "akamaiedge": _3, "akamaiedge-staging": _3, "akamaihd": _3, "akamaihd-staging": _3, "akamaiorigin": _3, "akamaiorigin-staging": _3, "akamaized": _3, "akamaized-staging": _3, "edgekey": _3, "edgekey-staging": _3, "edgesuite": _3, "edgesuite-staging": _3, "alwaysdata": _3, "myamaze": _3, "cloudfront": _3, "appudo": _3, "atlassian-dev": [0, { "prod": _51 }], "myfritz": _3, "onavstack": _3, "shopselect": _3, "blackbaudcdn": _3, "boomla": _3, "bplaced": _3, "square7": _3, "cdn77": [0, { "r": _3 }], "cdn77-ssl": _3, "gb": _3, "hu": _3, "jp": _3, "se": _3, "uk": _3, "clickrising": _3, "ddns-ip": _3, "dns-cloud": _3, "dns-dynamic": _3, "cloudaccess": _3, "cloudflare": [2, { "cdn": _3 }], "cloudflareanycast": _51, "cloudflarecn": _51, "cloudflareglobal": _51, "ctfcloud": _3, "feste-ip": _3, "knx-server": _3, "static-access": _3, "cryptonomic": _6, "dattolocal": _3, "mydatto": _3, "debian": _3, "definima": _3, "deno": _3, "at-band-camp": _3, "blogdns": _3, "broke-it": _3, "buyshouses": _3, "dnsalias": _3, "dnsdojo": _3, "does-it": _3, "dontexist": _3, "dynalias": _3, "dynathome": _3, "endofinternet": _3, "from-az": _3, "from-co": _3, "from-la": _3, "from-ny": _3, "gets-it": _3, "ham-radio-op": _3, "homeftp": _3, "homeip": _3, "homelinux": _3, "homeunix": _3, "in-the-band": _3, "is-a-chef": _3, "is-a-geek": _3, "isa-geek": _3, "kicks-ass": _3, "office-on-the": _3, "podzone": _3, "scrapper-site": _3, "selfip": _3, "sells-it": _3, "servebbs": _3, "serveftp": _3, "thruhere": _3, "webhop": _3, "casacam": _3, "dynu": _3, "dynv6": _3, "twmail": _3, "ru": _3, "channelsdvr": [2, { "u": _3 }], "fastly": [0, { "freetls": _3, "map": _3, "prod": [0, { "a": _3, "global": _3 }], "ssl": [0, { "a": _3, "b": _3, "global": _3 }] }], "fastlylb": [2, { "map": _3 }], "edgeapp": _3, "keyword-on": _3, "live-on": _3, "server-on": _3, "cdn-edges": _3, "heteml": _3, "cloudfunctions": _3, "grafana-dev": _3, "iobb": _3, "moonscale": _3, "in-dsl": _3, "in-vpn": _3, "oninferno": _3, "botdash": _3, "apps-1and1": _3, "ipifony": _3, "cloudjiffy": [2, { "fra1-de": _3, "west1-us": _3 }], "elastx": [0, { "jls-sto1": _3, "jls-sto2": _3, "jls-sto3": _3 }], "massivegrid": [0, { "paas": [0, { "fr-1": _3, "lon-1": _3, "lon-2": _3, "ny-1": _3, "ny-2": _3, "sg-1": _3 }] }], "saveincloud": [0, { "jelastic": _3, "nordeste-idc": _3 }], "scaleforce": _45, "kinghost": _3, "uni5": _3, "krellian": _3, "ggff": _3, "localcert": _3, "localto": _6, "barsy": _3, "luyani": _3, "memset": _3, "azure-api": _3, "azure-mobile": _3, "azureedge": _3, "azurefd": _3, "azurestaticapps": [2, { "1": _3, "2": _3, "3": _3, "4": _3, "5": _3, "6": _3, "7": _3, "centralus": _3, "eastasia": _3, "eastus2": _3, "westeurope": _3, "westus2": _3 }], "azurewebsites": _3, "cloudapp": _3, "trafficmanager": _3, "windows": [0, { "core": [0, { "blob": _3 }], "servicebus": _3 }], "mynetname": [0, { "sn": _3 }], "routingthecloud": _3, "bounceme": _3, "ddns": _3, "eating-organic": _3, "mydissent": _3, "myeffect": _3, "mymediapc": _3, "mypsx": _3, "mysecuritycamera": _3, "nhlfan": _3, "no-ip": _3, "pgafan": _3, "privatizehealthinsurance": _3, "redirectme": _3, "serveblog": _3, "serveminecraft": _3, "sytes": _3, "dnsup": _3, "hicam": _3, "now-dns": _3, "ownip": _3, "vpndns": _3, "cloudycluster": _3, "ovh": [0, { "hosting": _6, "webpaas": _6 }], "rackmaze": _3, "myradweb": _3, "in": _3, "subsc-pay": _3, "squares": _3, "schokokeks": _3, "firewall-gateway": _3, "seidat": _3, "senseering": _3, "siteleaf": _3, "mafelo": _3, "myspreadshop": _3, "vps-host": [2, { "jelastic": [0, { "atl": _3, "njs": _3, "ric": _3 }] }], "srcf": [0, { "soc": _3, "user": _3 }], "supabase": _3, "dsmynas": _3, "familyds": _3, "ts": [2, { "c": _6 }], "torproject": [2, { "pages": _3 }], "vusercontent": _3, "reserve-online": _3, "community-pro": _3, "meinforum": _3, "yandexcloud": [2, { "storage": _3, "website": _3 }], "za": _3 }], "nf": [1, { "arts": _2, "com": _2, "firm": _2, "info": _2, "net": _2, "other": _2, "per": _2, "rec": _2, "store": _2, "web": _2 }], "ng": [1, { "com": _2, "edu": _2, "gov": _2, "i": _2, "mil": _2, "mobi": _2, "name": _2, "net": _2, "org": _2, "sch": _2, "biz": [2, { "co": _3, "dl": _3, "go": _3, "lg": _3, "on": _3 }], "col": _3, "firm": _3, "gen": _3, "ltd": _3, "ngo": _3, "plc": _3 }], "ni": [1, { "ac": _2, "biz": _2, "co": _2, "com": _2, "edu": _2, "gob": _2, "in": _2, "info": _2, "int": _2, "mil": _2, "net": _2, "nom": _2, "org": _2, "web": _2 }], "nl": [1, { "co": _3, "hosting-cluster": _3, "gov": _3, "khplay": _3, "123website": _3, "myspreadshop": _3, "transurl": _6, "cistron": _3, "demon": _3 }], "no": [1, { "fhs": _2, "folkebibl": _2, "fylkesbibl": _2, "idrett": _2, "museum": _2, "priv": _2, "vgs": _2, "dep": _2, "herad": _2, "kommune": _2, "mil": _2, "stat": _2, "aa": _59, "ah": _59, "bu": _59, "fm": _59, "hl": _59, "hm": _59, "jan-mayen": _59, "mr": _59, "nl": _59, "nt": _59, "of": _59, "ol": _59, "oslo": _59, "rl": _59, "sf": _59, "st": _59, "svalbard": _59, "tm": _59, "tr": _59, "va": _59, "vf": _59, "akrehamn": _2, "xn--krehamn-dxa": _2, "\xE5krehamn": _2, "algard": _2, "xn--lgrd-poac": _2, "\xE5lg\xE5rd": _2, "arna": _2, "bronnoysund": _2, "xn--brnnysund-m8ac": _2, "br\xF8nn\xF8ysund": _2, "brumunddal": _2, "bryne": _2, "drobak": _2, "xn--drbak-wua": _2, "dr\xF8bak": _2, "egersund": _2, "fetsund": _2, "floro": _2, "xn--flor-jra": _2, "flor\xF8": _2, "fredrikstad": _2, "hokksund": _2, "honefoss": _2, "xn--hnefoss-q1a": _2, "h\xF8nefoss": _2, "jessheim": _2, "jorpeland": _2, "xn--jrpeland-54a": _2, "j\xF8rpeland": _2, "kirkenes": _2, "kopervik": _2, "krokstadelva": _2, "langevag": _2, "xn--langevg-jxa": _2, "langev\xE5g": _2, "leirvik": _2, "mjondalen": _2, "xn--mjndalen-64a": _2, "mj\xF8ndalen": _2, "mo-i-rana": _2, "mosjoen": _2, "xn--mosjen-eya": _2, "mosj\xF8en": _2, "nesoddtangen": _2, "orkanger": _2, "osoyro": _2, "xn--osyro-wua": _2, "os\xF8yro": _2, "raholt": _2, "xn--rholt-mra": _2, "r\xE5holt": _2, "sandnessjoen": _2, "xn--sandnessjen-ogb": _2, "sandnessj\xF8en": _2, "skedsmokorset": _2, "slattum": _2, "spjelkavik": _2, "stathelle": _2, "stavern": _2, "stjordalshalsen": _2, "xn--stjrdalshalsen-sqb": _2, "stj\xF8rdalshalsen": _2, "tananger": _2, "tranby": _2, "vossevangen": _2, "aarborte": _2, "aejrie": _2, "afjord": _2, "xn--fjord-lra": _2, "\xE5fjord": _2, "agdenes": _2, "akershus": _60, "aknoluokta": _2, "xn--koluokta-7ya57h": _2, "\xE1k\u014Boluokta": _2, "al": _2, "xn--l-1fa": _2, "\xE5l": _2, "alaheadju": _2, "xn--laheadju-7ya": _2, "\xE1laheadju": _2, "alesund": _2, "xn--lesund-hua": _2, "\xE5lesund": _2, "alstahaug": _2, "alta": _2, "xn--lt-liac": _2, "\xE1lt\xE1": _2, "alvdal": _2, "amli": _2, "xn--mli-tla": _2, "\xE5mli": _2, "amot": _2, "xn--mot-tla": _2, "\xE5mot": _2, "andasuolo": _2, "andebu": _2, "andoy": _2, "xn--andy-ira": _2, "and\xF8y": _2, "ardal": _2, "xn--rdal-poa": _2, "\xE5rdal": _2, "aremark": _2, "arendal": _2, "xn--s-1fa": _2, "\xE5s": _2, "aseral": _2, "xn--seral-lra": _2, "\xE5seral": _2, "asker": _2, "askim": _2, "askoy": _2, "xn--asky-ira": _2, "ask\xF8y": _2, "askvoll": _2, "asnes": _2, "xn--snes-poa": _2, "\xE5snes": _2, "audnedaln": _2, "aukra": _2, "aure": _2, "aurland": _2, "aurskog-holand": _2, "xn--aurskog-hland-jnb": _2, "aurskog-h\xF8land": _2, "austevoll": _2, "austrheim": _2, "averoy": _2, "xn--avery-yua": _2, "aver\xF8y": _2, "badaddja": _2, "xn--bdddj-mrabd": _2, "b\xE5d\xE5ddj\xE5": _2, "xn--brum-voa": _2, "b\xE6rum": _2, "bahcavuotna": _2, "xn--bhcavuotna-s4a": _2, "b\xE1hcavuotna": _2, "bahccavuotna": _2, "xn--bhccavuotna-k7a": _2, "b\xE1hccavuotna": _2, "baidar": _2, "xn--bidr-5nac": _2, "b\xE1id\xE1r": _2, "bajddar": _2, "xn--bjddar-pta": _2, "b\xE1jddar": _2, "balat": _2, "xn--blt-elab": _2, "b\xE1l\xE1t": _2, "balestrand": _2, "ballangen": _2, "balsfjord": _2, "bamble": _2, "bardu": _2, "barum": _2, "batsfjord": _2, "xn--btsfjord-9za": _2, "b\xE5tsfjord": _2, "bearalvahki": _2, "xn--bearalvhki-y4a": _2, "bearalv\xE1hki": _2, "beardu": _2, "beiarn": _2, "berg": _2, "bergen": _2, "berlevag": _2, "xn--berlevg-jxa": _2, "berlev\xE5g": _2, "bievat": _2, "xn--bievt-0qa": _2, "biev\xE1t": _2, "bindal": _2, "birkenes": _2, "bjarkoy": _2, "xn--bjarky-fya": _2, "bjark\xF8y": _2, "bjerkreim": _2, "bjugn": _2, "bodo": _2, "xn--bod-2na": _2, "bod\xF8": _2, "bokn": _2, "bomlo": _2, "xn--bmlo-gra": _2, "b\xF8mlo": _2, "bremanger": _2, "bronnoy": _2, "xn--brnny-wuac": _2, "br\xF8nn\xF8y": _2, "budejju": _2, "buskerud": _60, "bygland": _2, "bykle": _2, "cahcesuolo": _2, "xn--hcesuolo-7ya35b": _2, "\u010D\xE1hcesuolo": _2, "davvenjarga": _2, "xn--davvenjrga-y4a": _2, "davvenj\xE1rga": _2, "davvesiida": _2, "deatnu": _2, "dielddanuorri": _2, "divtasvuodna": _2, "divttasvuotna": _2, "donna": _2, "xn--dnna-gra": _2, "d\xF8nna": _2, "dovre": _2, "drammen": _2, "drangedal": _2, "dyroy": _2, "xn--dyry-ira": _2, "dyr\xF8y": _2, "eid": _2, "eidfjord": _2, "eidsberg": _2, "eidskog": _2, "eidsvoll": _2, "eigersund": _2, "elverum": _2, "enebakk": _2, "engerdal": _2, "etne": _2, "etnedal": _2, "evenassi": _2, "xn--eveni-0qa01ga": _2, "even\xE1\u0161\u0161i": _2, "evenes": _2, "evje-og-hornnes": _2, "farsund": _2, "fauske": _2, "fedje": _2, "fet": _2, "finnoy": _2, "xn--finny-yua": _2, "finn\xF8y": _2, "fitjar": _2, "fjaler": _2, "fjell": _2, "fla": _2, "xn--fl-zia": _2, "fl\xE5": _2, "flakstad": _2, "flatanger": _2, "flekkefjord": _2, "flesberg": _2, "flora": _2, "folldal": _2, "forde": _2, "xn--frde-gra": _2, "f\xF8rde": _2, "forsand": _2, "fosnes": _2, "xn--frna-woa": _2, "fr\xE6na": _2, "frana": _2, "frei": _2, "frogn": _2, "froland": _2, "frosta": _2, "froya": _2, "xn--frya-hra": _2, "fr\xF8ya": _2, "fuoisku": _2, "fuossko": _2, "fusa": _2, "fyresdal": _2, "gaivuotna": _2, "xn--givuotna-8ya": _2, "g\xE1ivuotna": _2, "galsa": _2, "xn--gls-elac": _2, "g\xE1ls\xE1": _2, "gamvik": _2, "gangaviika": _2, "xn--ggaviika-8ya47h": _2, "g\xE1\u014Bgaviika": _2, "gaular": _2, "gausdal": _2, "giehtavuoatna": _2, "gildeskal": _2, "xn--gildeskl-g0a": _2, "gildesk\xE5l": _2, "giske": _2, "gjemnes": _2, "gjerdrum": _2, "gjerstad": _2, "gjesdal": _2, "gjovik": _2, "xn--gjvik-wua": _2, "gj\xF8vik": _2, "gloppen": _2, "gol": _2, "gran": _2, "grane": _2, "granvin": _2, "gratangen": _2, "grimstad": _2, "grong": _2, "grue": _2, "gulen": _2, "guovdageaidnu": _2, "ha": _2, "xn--h-2fa": _2, "h\xE5": _2, "habmer": _2, "xn--hbmer-xqa": _2, "h\xE1bmer": _2, "hadsel": _2, "xn--hgebostad-g3a": _2, "h\xE6gebostad": _2, "hagebostad": _2, "halden": _2, "halsa": _2, "hamar": _2, "hamaroy": _2, "hammarfeasta": _2, "xn--hmmrfeasta-s4ac": _2, "h\xE1mm\xE1rfeasta": _2, "hammerfest": _2, "hapmir": _2, "xn--hpmir-xqa": _2, "h\xE1pmir": _2, "haram": _2, "hareid": _2, "harstad": _2, "hasvik": _2, "hattfjelldal": _2, "haugesund": _2, "hedmark": [0, { "os": _2, "valer": _2, "xn--vler-qoa": _2, "v\xE5ler": _2 }], "hemne": _2, "hemnes": _2, "hemsedal": _2, "hitra": _2, "hjartdal": _2, "hjelmeland": _2, "hobol": _2, "xn--hobl-ira": _2, "hob\xF8l": _2, "hof": _2, "hol": _2, "hole": _2, "holmestrand": _2, "holtalen": _2, "xn--holtlen-hxa": _2, "holt\xE5len": _2, "hordaland": [0, { "os": _2 }], "hornindal": _2, "horten": _2, "hoyanger": _2, "xn--hyanger-q1a": _2, "h\xF8yanger": _2, "hoylandet": _2, "xn--hylandet-54a": _2, "h\xF8ylandet": _2, "hurdal": _2, "hurum": _2, "hvaler": _2, "hyllestad": _2, "ibestad": _2, "inderoy": _2, "xn--indery-fya": _2, "inder\xF8y": _2, "iveland": _2, "ivgu": _2, "jevnaker": _2, "jolster": _2, "xn--jlster-bya": _2, "j\xF8lster": _2, "jondal": _2, "kafjord": _2, "xn--kfjord-iua": _2, "k\xE5fjord": _2, "karasjohka": _2, "xn--krjohka-hwab49j": _2, "k\xE1r\xE1\u0161johka": _2, "karasjok": _2, "karlsoy": _2, "karmoy": _2, "xn--karmy-yua": _2, "karm\xF8y": _2, "kautokeino": _2, "klabu": _2, "xn--klbu-woa": _2, "kl\xE6bu": _2, "klepp": _2, "kongsberg": _2, "kongsvinger": _2, "kraanghke": _2, "xn--kranghke-b0a": _2, "kr\xE5anghke": _2, "kragero": _2, "xn--krager-gya": _2, "krager\xF8": _2, "kristiansand": _2, "kristiansund": _2, "krodsherad": _2, "xn--krdsherad-m8a": _2, "kr\xF8dsherad": _2, "xn--kvfjord-nxa": _2, "kv\xE6fjord": _2, "xn--kvnangen-k0a": _2, "kv\xE6nangen": _2, "kvafjord": _2, "kvalsund": _2, "kvam": _2, "kvanangen": _2, "kvinesdal": _2, "kvinnherad": _2, "kviteseid": _2, "kvitsoy": _2, "xn--kvitsy-fya": _2, "kvits\xF8y": _2, "laakesvuemie": _2, "xn--lrdal-sra": _2, "l\xE6rdal": _2, "lahppi": _2, "xn--lhppi-xqa": _2, "l\xE1hppi": _2, "lardal": _2, "larvik": _2, "lavagis": _2, "lavangen": _2, "leangaviika": _2, "xn--leagaviika-52b": _2, "lea\u014Bgaviika": _2, "lebesby": _2, "leikanger": _2, "leirfjord": _2, "leka": _2, "leksvik": _2, "lenvik": _2, "lerdal": _2, "lesja": _2, "levanger": _2, "lier": _2, "lierne": _2, "lillehammer": _2, "lillesand": _2, "lindas": _2, "xn--linds-pra": _2, "lind\xE5s": _2, "lindesnes": _2, "loabat": _2, "xn--loabt-0qa": _2, "loab\xE1t": _2, "lodingen": _2, "xn--ldingen-q1a": _2, "l\xF8dingen": _2, "lom": _2, "loppa": _2, "lorenskog": _2, "xn--lrenskog-54a": _2, "l\xF8renskog": _2, "loten": _2, "xn--lten-gra": _2, "l\xF8ten": _2, "lund": _2, "lunner": _2, "luroy": _2, "xn--lury-ira": _2, "lur\xF8y": _2, "luster": _2, "lyngdal": _2, "lyngen": _2, "malatvuopmi": _2, "xn--mlatvuopmi-s4a": _2, "m\xE1latvuopmi": _2, "malselv": _2, "xn--mlselv-iua": _2, "m\xE5lselv": _2, "malvik": _2, "mandal": _2, "marker": _2, "marnardal": _2, "masfjorden": _2, "masoy": _2, "xn--msy-ula0h": _2, "m\xE5s\xF8y": _2, "matta-varjjat": _2, "xn--mtta-vrjjat-k7af": _2, "m\xE1tta-v\xE1rjjat": _2, "meland": _2, "meldal": _2, "melhus": _2, "meloy": _2, "xn--mely-ira": _2, "mel\xF8y": _2, "meraker": _2, "xn--merker-kua": _2, "mer\xE5ker": _2, "midsund": _2, "midtre-gauldal": _2, "moareke": _2, "xn--moreke-jua": _2, "mo\xE5reke": _2, "modalen": _2, "modum": _2, "molde": _2, "more-og-romsdal": [0, { "heroy": _2, "sande": _2 }], "xn--mre-og-romsdal-qqb": [0, { "xn--hery-ira": _2, "sande": _2 }], "m\xF8re-og-romsdal": [0, { "her\xF8y": _2, "sande": _2 }], "moskenes": _2, "moss": _2, "mosvik": _2, "muosat": _2, "xn--muost-0qa": _2, "muos\xE1t": _2, "naamesjevuemie": _2, "xn--nmesjevuemie-tcba": _2, "n\xE5\xE5mesjevuemie": _2, "xn--nry-yla5g": _2, "n\xE6r\xF8y": _2, "namdalseid": _2, "namsos": _2, "namsskogan": _2, "nannestad": _2, "naroy": _2, "narviika": _2, "narvik": _2, "naustdal": _2, "navuotna": _2, "xn--nvuotna-hwa": _2, "n\xE1vuotna": _2, "nedre-eiker": _2, "nesna": _2, "nesodden": _2, "nesseby": _2, "nesset": _2, "nissedal": _2, "nittedal": _2, "nord-aurdal": _2, "nord-fron": _2, "nord-odal": _2, "norddal": _2, "nordkapp": _2, "nordland": [0, { "bo": _2, "xn--b-5ga": _2, "b\xF8": _2, "heroy": _2, "xn--hery-ira": _2, "her\xF8y": _2 }], "nordre-land": _2, "nordreisa": _2, "nore-og-uvdal": _2, "notodden": _2, "notteroy": _2, "xn--nttery-byae": _2, "n\xF8tter\xF8y": _2, "odda": _2, "oksnes": _2, "xn--ksnes-uua": _2, "\xF8ksnes": _2, "omasvuotna": _2, "oppdal": _2, "oppegard": _2, "xn--oppegrd-ixa": _2, "oppeg\xE5rd": _2, "orkdal": _2, "orland": _2, "xn--rland-uua": _2, "\xF8rland": _2, "orskog": _2, "xn--rskog-uua": _2, "\xF8rskog": _2, "orsta": _2, "xn--rsta-fra": _2, "\xF8rsta": _2, "osen": _2, "osteroy": _2, "xn--ostery-fya": _2, "oster\xF8y": _2, "ostfold": [0, { "valer": _2 }], "xn--stfold-9xa": [0, { "xn--vler-qoa": _2 }], "\xF8stfold": [0, { "v\xE5ler": _2 }], "ostre-toten": _2, "xn--stre-toten-zcb": _2, "\xF8stre-toten": _2, "overhalla": _2, "ovre-eiker": _2, "xn--vre-eiker-k8a": _2, "\xF8vre-eiker": _2, "oyer": _2, "xn--yer-zna": _2, "\xF8yer": _2, "oygarden": _2, "xn--ygarden-p1a": _2, "\xF8ygarden": _2, "oystre-slidre": _2, "xn--ystre-slidre-ujb": _2, "\xF8ystre-slidre": _2, "porsanger": _2, "porsangu": _2, "xn--porsgu-sta26f": _2, "pors\xE1\u014Bgu": _2, "porsgrunn": _2, "rade": _2, "xn--rde-ula": _2, "r\xE5de": _2, "radoy": _2, "xn--rady-ira": _2, "rad\xF8y": _2, "xn--rlingen-mxa": _2, "r\xE6lingen": _2, "rahkkeravju": _2, "xn--rhkkervju-01af": _2, "r\xE1hkker\xE1vju": _2, "raisa": _2, "xn--risa-5na": _2, "r\xE1isa": _2, "rakkestad": _2, "ralingen": _2, "rana": _2, "randaberg": _2, "rauma": _2, "rendalen": _2, "rennebu": _2, "rennesoy": _2, "xn--rennesy-v1a": _2, "rennes\xF8y": _2, "rindal": _2, "ringebu": _2, "ringerike": _2, "ringsaker": _2, "risor": _2, "xn--risr-ira": _2, "ris\xF8r": _2, "rissa": _2, "roan": _2, "rodoy": _2, "xn--rdy-0nab": _2, "r\xF8d\xF8y": _2, "rollag": _2, "romsa": _2, "romskog": _2, "xn--rmskog-bya": _2, "r\xF8mskog": _2, "roros": _2, "xn--rros-gra": _2, "r\xF8ros": _2, "rost": _2, "xn--rst-0na": _2, "r\xF8st": _2, "royken": _2, "xn--ryken-vua": _2, "r\xF8yken": _2, "royrvik": _2, "xn--ryrvik-bya": _2, "r\xF8yrvik": _2, "ruovat": _2, "rygge": _2, "salangen": _2, "salat": _2, "xn--slat-5na": _2, "s\xE1lat": _2, "xn--slt-elab": _2, "s\xE1l\xE1t": _2, "saltdal": _2, "samnanger": _2, "sandefjord": _2, "sandnes": _2, "sandoy": _2, "xn--sandy-yua": _2, "sand\xF8y": _2, "sarpsborg": _2, "sauda": _2, "sauherad": _2, "sel": _2, "selbu": _2, "selje": _2, "seljord": _2, "siellak": _2, "sigdal": _2, "siljan": _2, "sirdal": _2, "skanit": _2, "xn--sknit-yqa": _2, "sk\xE1nit": _2, "skanland": _2, "xn--sknland-fxa": _2, "sk\xE5nland": _2, "skaun": _2, "skedsmo": _2, "ski": _2, "skien": _2, "skierva": _2, "xn--skierv-uta": _2, "skierv\xE1": _2, "skiptvet": _2, "skjak": _2, "xn--skjk-soa": _2, "skj\xE5k": _2, "skjervoy": _2, "xn--skjervy-v1a": _2, "skjerv\xF8y": _2, "skodje": _2, "smola": _2, "xn--smla-hra": _2, "sm\xF8la": _2, "snaase": _2, "xn--snase-nra": _2, "sn\xE5ase": _2, "snasa": _2, "xn--snsa-roa": _2, "sn\xE5sa": _2, "snillfjord": _2, "snoasa": _2, "sogndal": _2, "sogne": _2, "xn--sgne-gra": _2, "s\xF8gne": _2, "sokndal": _2, "sola": _2, "solund": _2, "somna": _2, "xn--smna-gra": _2, "s\xF8mna": _2, "sondre-land": _2, "xn--sndre-land-0cb": _2, "s\xF8ndre-land": _2, "songdalen": _2, "sor-aurdal": _2, "xn--sr-aurdal-l8a": _2, "s\xF8r-aurdal": _2, "sor-fron": _2, "xn--sr-fron-q1a": _2, "s\xF8r-fron": _2, "sor-odal": _2, "xn--sr-odal-q1a": _2, "s\xF8r-odal": _2, "sor-varanger": _2, "xn--sr-varanger-ggb": _2, "s\xF8r-varanger": _2, "sorfold": _2, "xn--srfold-bya": _2, "s\xF8rfold": _2, "sorreisa": _2, "xn--srreisa-q1a": _2, "s\xF8rreisa": _2, "sortland": _2, "sorum": _2, "xn--srum-gra": _2, "s\xF8rum": _2, "spydeberg": _2, "stange": _2, "stavanger": _2, "steigen": _2, "steinkjer": _2, "stjordal": _2, "xn--stjrdal-s1a": _2, "stj\xF8rdal": _2, "stokke": _2, "stor-elvdal": _2, "stord": _2, "stordal": _2, "storfjord": _2, "strand": _2, "stranda": _2, "stryn": _2, "sula": _2, "suldal": _2, "sund": _2, "sunndal": _2, "surnadal": _2, "sveio": _2, "svelvik": _2, "sykkylven": _2, "tana": _2, "telemark": [0, { "bo": _2, "xn--b-5ga": _2, "b\xF8": _2 }], "time": _2, "tingvoll": _2, "tinn": _2, "tjeldsund": _2, "tjome": _2, "xn--tjme-hra": _2, "tj\xF8me": _2, "tokke": _2, "tolga": _2, "tonsberg": _2, "xn--tnsberg-q1a": _2, "t\xF8nsberg": _2, "torsken": _2, "xn--trna-woa": _2, "tr\xE6na": _2, "trana": _2, "tranoy": _2, "xn--trany-yua": _2, "tran\xF8y": _2, "troandin": _2, "trogstad": _2, "xn--trgstad-r1a": _2, "tr\xF8gstad": _2, "tromsa": _2, "tromso": _2, "xn--troms-zua": _2, "troms\xF8": _2, "trondheim": _2, "trysil": _2, "tvedestrand": _2, "tydal": _2, "tynset": _2, "tysfjord": _2, "tysnes": _2, "xn--tysvr-vra": _2, "tysv\xE6r": _2, "tysvar": _2, "ullensaker": _2, "ullensvang": _2, "ulvik": _2, "unjarga": _2, "xn--unjrga-rta": _2, "unj\xE1rga": _2, "utsira": _2, "vaapste": _2, "vadso": _2, "xn--vads-jra": _2, "vads\xF8": _2, "xn--vry-yla5g": _2, "v\xE6r\xF8y": _2, "vaga": _2, "xn--vg-yiab": _2, "v\xE5g\xE5": _2, "vagan": _2, "xn--vgan-qoa": _2, "v\xE5gan": _2, "vagsoy": _2, "xn--vgsy-qoa0j": _2, "v\xE5gs\xF8y": _2, "vaksdal": _2, "valle": _2, "vang": _2, "vanylven": _2, "vardo": _2, "xn--vard-jra": _2, "vard\xF8": _2, "varggat": _2, "xn--vrggt-xqad": _2, "v\xE1rgg\xE1t": _2, "varoy": _2, "vefsn": _2, "vega": _2, "vegarshei": _2, "xn--vegrshei-c0a": _2, "veg\xE5rshei": _2, "vennesla": _2, "verdal": _2, "verran": _2, "vestby": _2, "vestfold": [0, { "sande": _2 }], "vestnes": _2, "vestre-slidre": _2, "vestre-toten": _2, "vestvagoy": _2, "xn--vestvgy-ixa6o": _2, "vestv\xE5g\xF8y": _2, "vevelstad": _2, "vik": _2, "vikna": _2, "vindafjord": _2, "voagat": _2, "volda": _2, "voss": _2, "co": _3, "123hjemmeside": _3, "myspreadshop": _3 }], "np": _17, "nr": _55, "nu": [1, { "merseine": _3, "mine": _3, "shacknet": _3, "enterprisecloud": _3 }], "nz": [1, { "ac": _2, "co": _2, "cri": _2, "geek": _2, "gen": _2, "govt": _2, "health": _2, "iwi": _2, "kiwi": _2, "maori": _2, "xn--mori-qsa": _2, "m\u0101ori": _2, "mil": _2, "net": _2, "org": _2, "parliament": _2, "school": _2, "cloudns": _3 }], "om": [1, { "co": _2, "com": _2, "edu": _2, "gov": _2, "med": _2, "museum": _2, "net": _2, "org": _2, "pro": _2 }], "onion": _2, "org": [1, { "altervista": _3, "pimienta": _3, "poivron": _3, "potager": _3, "sweetpepper": _3, "cdn77": [0, { "c": _3, "rsc": _3 }], "cdn77-secure": [0, { "origin": [0, { "ssl": _3 }] }], "ae": _3, "cloudns": _3, "ip-dynamic": _3, "ddnss": _3, "dpdns": _3, "duckdns": _3, "tunk": _3, "blogdns": _3, "blogsite": _3, "boldlygoingnowhere": _3, "dnsalias": _3, "dnsdojo": _3, "doesntexist": _3, "dontexist": _3, "doomdns": _3, "dvrdns": _3, "dynalias": _3, "dyndns": [2, { "go": _3, "home": _3 }], "endofinternet": _3, "endoftheinternet": _3, "from-me": _3, "game-host": _3, "gotdns": _3, "hobby-site": _3, "homedns": _3, "homeftp": _3, "homelinux": _3, "homeunix": _3, "is-a-bruinsfan": _3, "is-a-candidate": _3, "is-a-celticsfan": _3, "is-a-chef": _3, "is-a-geek": _3, "is-a-knight": _3, "is-a-linux-user": _3, "is-a-patsfan": _3, "is-a-soxfan": _3, "is-found": _3, "is-lost": _3, "is-saved": _3, "is-very-bad": _3, "is-very-evil": _3, "is-very-good": _3, "is-very-nice": _3, "is-very-sweet": _3, "isa-geek": _3, "kicks-ass": _3, "misconfused": _3, "podzone": _3, "readmyblog": _3, "selfip": _3, "sellsyourhome": _3, "servebbs": _3, "serveftp": _3, "servegame": _3, "stuff-4-sale": _3, "webhop": _3, "accesscam": _3, "camdvr": _3, "freeddns": _3, "mywire": _3, "webredirect": _3, "twmail": _3, "eu": [2, { "al": _3, "asso": _3, "at": _3, "au": _3, "be": _3, "bg": _3, "ca": _3, "cd": _3, "ch": _3, "cn": _3, "cy": _3, "cz": _3, "de": _3, "dk": _3, "edu": _3, "ee": _3, "es": _3, "fi": _3, "fr": _3, "gr": _3, "hr": _3, "hu": _3, "ie": _3, "il": _3, "in": _3, "int": _3, "is": _3, "it": _3, "jp": _3, "kr": _3, "lt": _3, "lu": _3, "lv": _3, "me": _3, "mk": _3, "mt": _3, "my": _3, "net": _3, "ng": _3, "nl": _3, "no": _3, "nz": _3, "pl": _3, "pt": _3, "ro": _3, "ru": _3, "se": _3, "si": _3, "sk": _3, "tr": _3, "uk": _3, "us": _3 }], "fedorainfracloud": _3, "fedorapeople": _3, "fedoraproject": [0, { "cloud": _3, "os": _42, "stg": [0, { "os": _42 }] }], "freedesktop": _3, "hatenadiary": _3, "hepforge": _3, "in-dsl": _3, "in-vpn": _3, "js": _3, "barsy": _3, "mayfirst": _3, "routingthecloud": _3, "bmoattachments": _3, "cable-modem": _3, "collegefan": _3, "couchpotatofries": _3, "hopto": _3, "mlbfan": _3, "myftp": _3, "mysecuritycamera": _3, "nflfan": _3, "no-ip": _3, "read-books": _3, "ufcfan": _3, "zapto": _3, "dynserv": _3, "now-dns": _3, "is-local": _3, "httpbin": _3, "pubtls": _3, "jpn": _3, "my-firewall": _3, "myfirewall": _3, "spdns": _3, "small-web": _3, "dsmynas": _3, "familyds": _3, "teckids": _54, "tuxfamily": _3, "diskstation": _3, "hk": _3, "us": _3, "toolforge": _3, "wmcloud": _3, "wmflabs": _3, "za": _3 }], "pa": [1, { "abo": _2, "ac": _2, "com": _2, "edu": _2, "gob": _2, "ing": _2, "med": _2, "net": _2, "nom": _2, "org": _2, "sld": _2 }], "pe": [1, { "com": _2, "edu": _2, "gob": _2, "mil": _2, "net": _2, "nom": _2, "org": _2 }], "pf": [1, { "com": _2, "edu": _2, "org": _2 }], "pg": _17, "ph": [1, { "com": _2, "edu": _2, "gov": _2, "i": _2, "mil": _2, "net": _2, "ngo": _2, "org": _2, "cloudns": _3 }], "pk": [1, { "ac": _2, "biz": _2, "com": _2, "edu": _2, "fam": _2, "gkp": _2, "gob": _2, "gog": _2, "gok": _2, "gop": _2, "gos": _2, "gov": _2, "net": _2, "org": _2, "web": _2 }], "pl": [1, { "com": _2, "net": _2, "org": _2, "agro": _2, "aid": _2, "atm": _2, "auto": _2, "biz": _2, "edu": _2, "gmina": _2, "gsm": _2, "info": _2, "mail": _2, "media": _2, "miasta": _2, "mil": _2, "nieruchomosci": _2, "nom": _2, "pc": _2, "powiat": _2, "priv": _2, "realestate": _2, "rel": _2, "sex": _2, "shop": _2, "sklep": _2, "sos": _2, "szkola": _2, "targi": _2, "tm": _2, "tourism": _2, "travel": _2, "turystyka": _2, "gov": [1, { "ap": _2, "griw": _2, "ic": _2, "is": _2, "kmpsp": _2, "konsulat": _2, "kppsp": _2, "kwp": _2, "kwpsp": _2, "mup": _2, "mw": _2, "oia": _2, "oirm": _2, "oke": _2, "oow": _2, "oschr": _2, "oum": _2, "pa": _2, "pinb": _2, "piw": _2, "po": _2, "pr": _2, "psp": _2, "psse": _2, "pup": _2, "rzgw": _2, "sa": _2, "sdn": _2, "sko": _2, "so": _2, "sr": _2, "starostwo": _2, "ug": _2, "ugim": _2, "um": _2, "umig": _2, "upow": _2, "uppo": _2, "us": _2, "uw": _2, "uzs": _2, "wif": _2, "wiih": _2, "winb": _2, "wios": _2, "witd": _2, "wiw": _2, "wkz": _2, "wsa": _2, "wskr": _2, "wsse": _2, "wuoz": _2, "wzmiuw": _2, "zp": _2, "zpisdn": _2 }], "augustow": _2, "babia-gora": _2, "bedzin": _2, "beskidy": _2, "bialowieza": _2, "bialystok": _2, "bielawa": _2, "bieszczady": _2, "boleslawiec": _2, "bydgoszcz": _2, "bytom": _2, "cieszyn": _2, "czeladz": _2, "czest": _2, "dlugoleka": _2, "elblag": _2, "elk": _2, "glogow": _2, "gniezno": _2, "gorlice": _2, "grajewo": _2, "ilawa": _2, "jaworzno": _2, "jelenia-gora": _2, "jgora": _2, "kalisz": _2, "karpacz": _2, "kartuzy": _2, "kaszuby": _2, "katowice": _2, "kazimierz-dolny": _2, "kepno": _2, "ketrzyn": _2, "klodzko": _2, "kobierzyce": _2, "kolobrzeg": _2, "konin": _2, "konskowola": _2, "kutno": _2, "lapy": _2, "lebork": _2, "legnica": _2, "lezajsk": _2, "limanowa": _2, "lomza": _2, "lowicz": _2, "lubin": _2, "lukow": _2, "malbork": _2, "malopolska": _2, "mazowsze": _2, "mazury": _2, "mielec": _2, "mielno": _2, "mragowo": _2, "naklo": _2, "nowaruda": _2, "nysa": _2, "olawa": _2, "olecko": _2, "olkusz": _2, "olsztyn": _2, "opoczno": _2, "opole": _2, "ostroda": _2, "ostroleka": _2, "ostrowiec": _2, "ostrowwlkp": _2, "pila": _2, "pisz": _2, "podhale": _2, "podlasie": _2, "polkowice": _2, "pomorskie": _2, "pomorze": _2, "prochowice": _2, "pruszkow": _2, "przeworsk": _2, "pulawy": _2, "radom": _2, "rawa-maz": _2, "rybnik": _2, "rzeszow": _2, "sanok": _2, "sejny": _2, "skoczow": _2, "slask": _2, "slupsk": _2, "sosnowiec": _2, "stalowa-wola": _2, "starachowice": _2, "stargard": _2, "suwalki": _2, "swidnica": _2, "swiebodzin": _2, "swinoujscie": _2, "szczecin": _2, "szczytno": _2, "tarnobrzeg": _2, "tgory": _2, "turek": _2, "tychy": _2, "ustka": _2, "walbrzych": _2, "warmia": _2, "warszawa": _2, "waw": _2, "wegrow": _2, "wielun": _2, "wlocl": _2, "wloclawek": _2, "wodzislaw": _2, "wolomin": _2, "wroclaw": _2, "zachpomor": _2, "zagan": _2, "zarow": _2, "zgora": _2, "zgorzelec": _2, "art": _3, "gliwice": _3, "krakow": _3, "poznan": _3, "wroc": _3, "zakopane": _3, "beep": _3, "ecommerce-shop": _3, "cfolks": _3, "dfirma": _3, "dkonto": _3, "you2": _3, "shoparena": _3, "homesklep": _3, "sdscloud": _3, "unicloud": _3, "lodz": _3, "pabianice": _3, "plock": _3, "sieradz": _3, "skierniewice": _3, "zgierz": _3, "krasnik": _3, "leczna": _3, "lubartow": _3, "lublin": _3, "poniatowa": _3, "swidnik": _3, "co": _3, "torun": _3, "simplesite": _3, "myspreadshop": _3, "gda": _3, "gdansk": _3, "gdynia": _3, "med": _3, "sopot": _3, "bielsko": _3 }], "pm": [1, { "own": _3, "name": _3 }], "pn": [1, { "co": _2, "edu": _2, "gov": _2, "net": _2, "org": _2 }], "post": _2, "pr": [1, { "biz": _2, "com": _2, "edu": _2, "gov": _2, "info": _2, "isla": _2, "name": _2, "net": _2, "org": _2, "pro": _2, "ac": _2, "est": _2, "prof": _2 }], "pro": [1, { "aaa": _2, "aca": _2, "acct": _2, "avocat": _2, "bar": _2, "cpa": _2, "eng": _2, "jur": _2, "law": _2, "med": _2, "recht": _2, "12chars": _3, "cloudns": _3, "barsy": _3, "ngrok": _3 }], "ps": [1, { "com": _2, "edu": _2, "gov": _2, "net": _2, "org": _2, "plo": _2, "sec": _2 }], "pt": [1, { "com": _2, "edu": _2, "gov": _2, "int": _2, "net": _2, "nome": _2, "org": _2, "publ": _2, "123paginaweb": _3 }], "pw": [1, { "gov": _2, "cloudns": _3, "x443": _3 }], "py": [1, { "com": _2, "coop": _2, "edu": _2, "gov": _2, "mil": _2, "net": _2, "org": _2 }], "qa": [1, { "com": _2, "edu": _2, "gov": _2, "mil": _2, "name": _2, "net": _2, "org": _2, "sch": _2 }], "re": [1, { "asso": _2, "com": _2, "netlib": _3, "can": _3 }], "ro": [1, { "arts": _2, "com": _2, "firm": _2, "info": _2, "nom": _2, "nt": _2, "org": _2, "rec": _2, "store": _2, "tm": _2, "www": _2, "co": _3, "shop": _3, "barsy": _3 }], "rs": [1, { "ac": _2, "co": _2, "edu": _2, "gov": _2, "in": _2, "org": _2, "brendly": _50, "barsy": _3, "ox": _3 }], "ru": [1, { "ac": _3, "edu": _3, "gov": _3, "int": _3, "mil": _3, "eurodir": _3, "adygeya": _3, "bashkiria": _3, "bir": _3, "cbg": _3, "com": _3, "dagestan": _3, "grozny": _3, "kalmykia": _3, "kustanai": _3, "marine": _3, "mordovia": _3, "msk": _3, "mytis": _3, "nalchik": _3, "nov": _3, "pyatigorsk": _3, "spb": _3, "vladikavkaz": _3, "vladimir": _3, "na4u": _3, "mircloud": _3, "myjino": [2, { "hosting": _6, "landing": _6, "spectrum": _6, "vps": _6 }], "cldmail": [0, { "hb": _3 }], "mcdir": [2, { "vps": _3 }], "mcpre": _3, "net": _3, "org": _3, "pp": _3, "lk3": _3, "ras": _3 }], "rw": [1, { "ac": _2, "co": _2, "coop": _2, "gov": _2, "mil": _2, "net": _2, "org": _2 }], "sa": [1, { "com": _2, "edu": _2, "gov": _2, "med": _2, "net": _2, "org": _2, "pub": _2, "sch": _2 }], "sb": _4, "sc": _4, "sd": [1, { "com": _2, "edu": _2, "gov": _2, "info": _2, "med": _2, "net": _2, "org": _2, "tv": _2 }], "se": [1, { "a": _2, "ac": _2, "b": _2, "bd": _2, "brand": _2, "c": _2, "d": _2, "e": _2, "f": _2, "fh": _2, "fhsk": _2, "fhv": _2, "g": _2, "h": _2, "i": _2, "k": _2, "komforb": _2, "kommunalforbund": _2, "komvux": _2, "l": _2, "lanbib": _2, "m": _2, "n": _2, "naturbruksgymn": _2, "o": _2, "org": _2, "p": _2, "parti": _2, "pp": _2, "press": _2, "r": _2, "s": _2, "t": _2, "tm": _2, "u": _2, "w": _2, "x": _2, "y": _2, "z": _2, "com": _3, "iopsys": _3, "123minsida": _3, "itcouldbewor": _3, "myspreadshop": _3 }], "sg": [1, { "com": _2, "edu": _2, "gov": _2, "net": _2, "org": _2, "enscaled": _3 }], "sh": [1, { "com": _2, "gov": _2, "mil": _2, "net": _2, "org": _2, "hashbang": _3, "botda": _3, "platform": [0, { "ent": _3, "eu": _3, "us": _3 }], "now": _3 }], "si": [1, { "f5": _3, "gitapp": _3, "gitpage": _3 }], "sj": _2, "sk": _2, "sl": _4, "sm": _2, "sn": [1, { "art": _2, "com": _2, "edu": _2, "gouv": _2, "org": _2, "perso": _2, "univ": _2 }], "so": [1, { "com": _2, "edu": _2, "gov": _2, "me": _2, "net": _2, "org": _2, "surveys": _3 }], "sr": _2, "ss": [1, { "biz": _2, "co": _2, "com": _2, "edu": _2, "gov": _2, "me": _2, "net": _2, "org": _2, "sch": _2 }], "st": [1, { "co": _2, "com": _2, "consulado": _2, "edu": _2, "embaixada": _2, "mil": _2, "net": _2, "org": _2, "principe": _2, "saotome": _2, "store": _2, "helioho": _3, "kirara": _3, "noho": _3 }], "su": [1, { "abkhazia": _3, "adygeya": _3, "aktyubinsk": _3, "arkhangelsk": _3, "armenia": _3, "ashgabad": _3, "azerbaijan": _3, "balashov": _3, "bashkiria": _3, "bryansk": _3, "bukhara": _3, "chimkent": _3, "dagestan": _3, "east-kazakhstan": _3, "exnet": _3, "georgia": _3, "grozny": _3, "ivanovo": _3, "jambyl": _3, "kalmykia": _3, "kaluga": _3, "karacol": _3, "karaganda": _3, "karelia": _3, "khakassia": _3, "krasnodar": _3, "kurgan": _3, "kustanai": _3, "lenug": _3, "mangyshlak": _3, "mordovia": _3, "msk": _3, "murmansk": _3, "nalchik": _3, "navoi": _3, "north-kazakhstan": _3, "nov": _3, "obninsk": _3, "penza": _3, "pokrovsk": _3, "sochi": _3, "spb": _3, "tashkent": _3, "termez": _3, "togliatti": _3, "troitsk": _3, "tselinograd": _3, "tula": _3, "tuva": _3, "vladikavkaz": _3, "vladimir": _3, "vologda": _3 }], "sv": [1, { "com": _2, "edu": _2, "gob": _2, "org": _2, "red": _2 }], "sx": _10, "sy": _5, "sz": [1, { "ac": _2, "co": _2, "org": _2 }], "tc": _2, "td": _2, "tel": _2, "tf": [1, { "sch": _3 }], "tg": _2, "th": [1, { "ac": _2, "co": _2, "go": _2, "in": _2, "mi": _2, "net": _2, "or": _2, "online": _3, "shop": _3 }], "tj": [1, { "ac": _2, "biz": _2, "co": _2, "com": _2, "edu": _2, "go": _2, "gov": _2, "int": _2, "mil": _2, "name": _2, "net": _2, "nic": _2, "org": _2, "test": _2, "web": _2 }], "tk": _2, "tl": _10, "tm": [1, { "co": _2, "com": _2, "edu": _2, "gov": _2, "mil": _2, "net": _2, "nom": _2, "org": _2 }], "tn": [1, { "com": _2, "ens": _2, "fin": _2, "gov": _2, "ind": _2, "info": _2, "intl": _2, "mincom": _2, "nat": _2, "net": _2, "org": _2, "perso": _2, "tourism": _2, "orangecloud": _3 }], "to": [1, { "611": _3, "com": _2, "edu": _2, "gov": _2, "mil": _2, "net": _2, "org": _2, "oya": _3, "x0": _3, "quickconnect": _24, "vpnplus": _3 }], "tr": [1, { "av": _2, "bbs": _2, "bel": _2, "biz": _2, "com": _2, "dr": _2, "edu": _2, "gen": _2, "gov": _2, "info": _2, "k12": _2, "kep": _2, "mil": _2, "name": _2, "net": _2, "org": _2, "pol": _2, "tel": _2, "tsk": _2, "tv": _2, "web": _2, "nc": _10 }], "tt": [1, { "biz": _2, "co": _2, "com": _2, "edu": _2, "gov": _2, "info": _2, "mil": _2, "name": _2, "net": _2, "org": _2, "pro": _2 }], "tv": [1, { "better-than": _3, "dyndns": _3, "on-the-web": _3, "worse-than": _3, "from": _3, "sakura": _3 }], "tw": [1, { "club": _2, "com": [1, { "mymailer": _3 }], "ebiz": _2, "edu": _2, "game": _2, "gov": _2, "idv": _2, "mil": _2, "net": _2, "org": _2, "url": _3, "mydns": _3 }], "tz": [1, { "ac": _2, "co": _2, "go": _2, "hotel": _2, "info": _2, "me": _2, "mil": _2, "mobi": _2, "ne": _2, "or": _2, "sc": _2, "tv": _2 }], "ua": [1, { "com": _2, "edu": _2, "gov": _2, "in": _2, "net": _2, "org": _2, "cherkassy": _2, "cherkasy": _2, "chernigov": _2, "chernihiv": _2, "chernivtsi": _2, "chernovtsy": _2, "ck": _2, "cn": _2, "cr": _2, "crimea": _2, "cv": _2, "dn": _2, "dnepropetrovsk": _2, "dnipropetrovsk": _2, "donetsk": _2, "dp": _2, "if": _2, "ivano-frankivsk": _2, "kh": _2, "kharkiv": _2, "kharkov": _2, "kherson": _2, "khmelnitskiy": _2, "khmelnytskyi": _2, "kiev": _2, "kirovograd": _2, "km": _2, "kr": _2, "kropyvnytskyi": _2, "krym": _2, "ks": _2, "kv": _2, "kyiv": _2, "lg": _2, "lt": _2, "lugansk": _2, "luhansk": _2, "lutsk": _2, "lv": _2, "lviv": _2, "mk": _2, "mykolaiv": _2, "nikolaev": _2, "od": _2, "odesa": _2, "odessa": _2, "pl": _2, "poltava": _2, "rivne": _2, "rovno": _2, "rv": _2, "sb": _2, "sebastopol": _2, "sevastopol": _2, "sm": _2, "sumy": _2, "te": _2, "ternopil": _2, "uz": _2, "uzhgorod": _2, "uzhhorod": _2, "vinnica": _2, "vinnytsia": _2, "vn": _2, "volyn": _2, "yalta": _2, "zakarpattia": _2, "zaporizhzhe": _2, "zaporizhzhia": _2, "zhitomir": _2, "zhytomyr": _2, "zp": _2, "zt": _2, "cc": _3, "inf": _3, "ltd": _3, "cx": _3, "biz": _3, "co": _3, "pp": _3, "v": _3 }], "ug": [1, { "ac": _2, "co": _2, "com": _2, "edu": _2, "go": _2, "gov": _2, "mil": _2, "ne": _2, "or": _2, "org": _2, "sc": _2, "us": _2 }], "uk": [1, { "ac": _2, "co": [1, { "bytemark": [0, { "dh": _3, "vm": _3 }], "layershift": _45, "barsy": _3, "barsyonline": _3, "retrosnub": _53, "nh-serv": _3, "no-ip": _3, "adimo": _3, "myspreadshop": _3 }], "gov": [1, { "api": _3, "campaign": _3, "service": _3 }], "ltd": _2, "me": _2, "net": _2, "nhs": _2, "org": [1, { "glug": _3, "lug": _3, "lugs": _3, "affinitylottery": _3, "raffleentry": _3, "weeklylottery": _3 }], "plc": _2, "police": _2, "sch": _17, "conn": _3, "copro": _3, "hosp": _3, "independent-commission": _3, "independent-inquest": _3, "independent-inquiry": _3, "independent-panel": _3, "independent-review": _3, "public-inquiry": _3, "royal-commission": _3, "pymnt": _3, "barsy": _3, "nimsite": _3, "oraclegovcloudapps": _6 }], "us": [1, { "dni": _2, "isa": _2, "nsn": _2, "ak": _61, "al": _61, "ar": _61, "as": _61, "az": _61, "ca": _61, "co": _61, "ct": _61, "dc": _61, "de": [1, { "cc": _2, "lib": _3 }], "fl": _61, "ga": _61, "gu": _61, "hi": _62, "ia": _61, "id": _61, "il": _61, "in": _61, "ks": _61, "ky": _61, "la": _61, "ma": [1, { "k12": [1, { "chtr": _2, "paroch": _2, "pvt": _2 }], "cc": _2, "lib": _2 }], "md": _61, "me": _61, "mi": [1, { "k12": _2, "cc": _2, "lib": _2, "ann-arbor": _2, "cog": _2, "dst": _2, "eaton": _2, "gen": _2, "mus": _2, "tec": _2, "washtenaw": _2 }], "mn": _61, "mo": _61, "ms": _61, "mt": _61, "nc": _61, "nd": _62, "ne": _61, "nh": _61, "nj": _61, "nm": _61, "nv": _61, "ny": _61, "oh": _61, "ok": _61, "or": _61, "pa": _61, "pr": _61, "ri": _62, "sc": _61, "sd": _62, "tn": _61, "tx": _61, "ut": _61, "va": _61, "vi": _61, "vt": _61, "wa": _61, "wi": _61, "wv": [1, { "cc": _2 }], "wy": _61, "cloudns": _3, "is-by": _3, "land-4-sale": _3, "stuff-4-sale": _3, "heliohost": _3, "enscaled": [0, { "phx": _3 }], "mircloud": _3, "ngo": _3, "golffan": _3, "noip": _3, "pointto": _3, "freeddns": _3, "srv": [2, { "gh": _3, "gl": _3 }], "platterp": _3, "servername": _3 }], "uy": [1, { "com": _2, "edu": _2, "gub": _2, "mil": _2, "net": _2, "org": _2 }], "uz": [1, { "co": _2, "com": _2, "net": _2, "org": _2 }], "va": _2, "vc": [1, { "com": _2, "edu": _2, "gov": _2, "mil": _2, "net": _2, "org": _2, "gv": [2, { "d": _3 }], "0e": _6, "mydns": _3 }], "ve": [1, { "arts": _2, "bib": _2, "co": _2, "com": _2, "e12": _2, "edu": _2, "emprende": _2, "firm": _2, "gob": _2, "gov": _2, "info": _2, "int": _2, "mil": _2, "net": _2, "nom": _2, "org": _2, "rar": _2, "rec": _2, "store": _2, "tec": _2, "web": _2 }], "vg": [1, { "edu": _2 }], "vi": [1, { "co": _2, "com": _2, "k12": _2, "net": _2, "org": _2 }], "vn": [1, { "ac": _2, "ai": _2, "biz": _2, "com": _2, "edu": _2, "gov": _2, "health": _2, "id": _2, "info": _2, "int": _2, "io": _2, "name": _2, "net": _2, "org": _2, "pro": _2, "angiang": _2, "bacgiang": _2, "backan": _2, "baclieu": _2, "bacninh": _2, "baria-vungtau": _2, "bentre": _2, "binhdinh": _2, "binhduong": _2, "binhphuoc": _2, "binhthuan": _2, "camau": _2, "cantho": _2, "caobang": _2, "daklak": _2, "daknong": _2, "danang": _2, "dienbien": _2, "dongnai": _2, "dongthap": _2, "gialai": _2, "hagiang": _2, "haiduong": _2, "haiphong": _2, "hanam": _2, "hanoi": _2, "hatinh": _2, "haugiang": _2, "hoabinh": _2, "hungyen": _2, "khanhhoa": _2, "kiengiang": _2, "kontum": _2, "laichau": _2, "lamdong": _2, "langson": _2, "laocai": _2, "longan": _2, "namdinh": _2, "nghean": _2, "ninhbinh": _2, "ninhthuan": _2, "phutho": _2, "phuyen": _2, "quangbinh": _2, "quangnam": _2, "quangngai": _2, "quangninh": _2, "quangtri": _2, "soctrang": _2, "sonla": _2, "tayninh": _2, "thaibinh": _2, "thainguyen": _2, "thanhhoa": _2, "thanhphohochiminh": _2, "thuathienhue": _2, "tiengiang": _2, "travinh": _2, "tuyenquang": _2, "vinhlong": _2, "vinhphuc": _2, "yenbai": _2 }], "vu": _44, "wf": [1, { "biz": _3, "sch": _3 }], "ws": [1, { "com": _2, "edu": _2, "gov": _2, "net": _2, "org": _2, "advisor": _6, "cloud66": _3, "dyndns": _3, "mypets": _3 }], "yt": [1, { "org": _3 }], "xn--mgbaam7a8h": _2, "\u0627\u0645\u0627\u0631\u0627\u062A": _2, "xn--y9a3aq": _2, "\u0570\u0561\u0575": _2, "xn--54b7fta0cc": _2, "\u09AC\u09BE\u0982\u09B2\u09BE": _2, "xn--90ae": _2, "\u0431\u0433": _2, "xn--mgbcpq6gpa1a": _2, "\u0627\u0644\u0628\u062D\u0631\u064A\u0646": _2, "xn--90ais": _2, "\u0431\u0435\u043B": _2, "xn--fiqs8s": _2, "\u4E2D\u56FD": _2, "xn--fiqz9s": _2, "\u4E2D\u570B": _2, "xn--lgbbat1ad8j": _2, "\u0627\u0644\u062C\u0632\u0627\u0626\u0631": _2, "xn--wgbh1c": _2, "\u0645\u0635\u0631": _2, "xn--e1a4c": _2, "\u0435\u044E": _2, "xn--qxa6a": _2, "\u03B5\u03C5": _2, "xn--mgbah1a3hjkrd": _2, "\u0645\u0648\u0631\u064A\u062A\u0627\u0646\u064A\u0627": _2, "xn--node": _2, "\u10D2\u10D4": _2, "xn--qxam": _2, "\u03B5\u03BB": _2, "xn--j6w193g": [1, { "xn--gmqw5a": _2, "xn--55qx5d": _2, "xn--mxtq1m": _2, "xn--wcvs22d": _2, "xn--uc0atv": _2, "xn--od0alg": _2 }], "\u9999\u6E2F": [1, { "\u500B\u4EBA": _2, "\u516C\u53F8": _2, "\u653F\u5E9C": _2, "\u6559\u80B2": _2, "\u7D44\u7E54": _2, "\u7DB2\u7D61": _2 }], "xn--2scrj9c": _2, "\u0CAD\u0CBE\u0CB0\u0CA4": _2, "xn--3hcrj9c": _2, "\u0B2D\u0B3E\u0B30\u0B24": _2, "xn--45br5cyl": _2, "\u09AD\u09BE\u09F0\u09A4": _2, "xn--h2breg3eve": _2, "\u092D\u093E\u0930\u0924\u092E\u094D": _2, "xn--h2brj9c8c": _2, "\u092D\u093E\u0930\u094B\u0924": _2, "xn--mgbgu82a": _2, "\u0680\u0627\u0631\u062A": _2, "xn--rvc1e0am3e": _2, "\u0D2D\u0D3E\u0D30\u0D24\u0D02": _2, "xn--h2brj9c": _2, "\u092D\u093E\u0930\u0924": _2, "xn--mgbbh1a": _2, "\u0628\u0627\u0631\u062A": _2, "xn--mgbbh1a71e": _2, "\u0628\u06BE\u0627\u0631\u062A": _2, "xn--fpcrj9c3d": _2, "\u0C2D\u0C3E\u0C30\u0C24\u0C4D": _2, "xn--gecrj9c": _2, "\u0AAD\u0ABE\u0AB0\u0AA4": _2, "xn--s9brj9c": _2, "\u0A2D\u0A3E\u0A30\u0A24": _2, "xn--45brj9c": _2, "\u09AD\u09BE\u09B0\u09A4": _2, "xn--xkc2dl3a5ee0h": _2, "\u0B87\u0BA8\u0BCD\u0BA4\u0BBF\u0BAF\u0BBE": _2, "xn--mgba3a4f16a": _2, "\u0627\u06CC\u0631\u0627\u0646": _2, "xn--mgba3a4fra": _2, "\u0627\u064A\u0631\u0627\u0646": _2, "xn--mgbtx2b": _2, "\u0639\u0631\u0627\u0642": _2, "xn--mgbayh7gpa": _2, "\u0627\u0644\u0627\u0631\u062F\u0646": _2, "xn--3e0b707e": _2, "\uD55C\uAD6D": _2, "xn--80ao21a": _2, "\u049B\u0430\u0437": _2, "xn--q7ce6a": _2, "\u0EA5\u0EB2\u0EA7": _2, "xn--fzc2c9e2c": _2, "\u0DBD\u0D82\u0D9A\u0DCF": _2, "xn--xkc2al3hye2a": _2, "\u0B87\u0BB2\u0B99\u0BCD\u0B95\u0BC8": _2, "xn--mgbc0a9azcg": _2, "\u0627\u0644\u0645\u063A\u0631\u0628": _2, "xn--d1alf": _2, "\u043C\u043A\u0434": _2, "xn--l1acc": _2, "\u043C\u043E\u043D": _2, "xn--mix891f": _2, "\u6FB3\u9580": _2, "xn--mix082f": _2, "\u6FB3\u95E8": _2, "xn--mgbx4cd0ab": _2, "\u0645\u0644\u064A\u0633\u064A\u0627": _2, "xn--mgb9awbf": _2, "\u0639\u0645\u0627\u0646": _2, "xn--mgbai9azgqp6j": _2, "\u067E\u0627\u06A9\u0633\u062A\u0627\u0646": _2, "xn--mgbai9a5eva00b": _2, "\u067E\u0627\u0643\u0633\u062A\u0627\u0646": _2, "xn--ygbi2ammx": _2, "\u0641\u0644\u0633\u0637\u064A\u0646": _2, "xn--90a3ac": [1, { "xn--80au": _2, "xn--90azh": _2, "xn--d1at": _2, "xn--c1avg": _2, "xn--o1ac": _2, "xn--o1ach": _2 }], "\u0441\u0440\u0431": [1, { "\u0430\u043A": _2, "\u043E\u0431\u0440": _2, "\u043E\u0434": _2, "\u043E\u0440\u0433": _2, "\u043F\u0440": _2, "\u0443\u043F\u0440": _2 }], "xn--p1ai": _2, "\u0440\u0444": _2, "xn--wgbl6a": _2, "\u0642\u0637\u0631": _2, "xn--mgberp4a5d4ar": _2, "\u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629": _2, "xn--mgberp4a5d4a87g": _2, "\u0627\u0644\u0633\u0639\u0648\u062F\u06CC\u0629": _2, "xn--mgbqly7c0a67fbc": _2, "\u0627\u0644\u0633\u0639\u0648\u062F\u06CC\u06C3": _2, "xn--mgbqly7cvafr": _2, "\u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0647": _2, "xn--mgbpl2fh": _2, "\u0633\u0648\u062F\u0627\u0646": _2, "xn--yfro4i67o": _2, "\u65B0\u52A0\u5761": _2, "xn--clchc0ea0b2g2a9gcd": _2, "\u0B9A\u0BBF\u0B99\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0BC2\u0BB0\u0BCD": _2, "xn--ogbpf8fl": _2, "\u0633\u0648\u0631\u064A\u0629": _2, "xn--mgbtf8fl": _2, "\u0633\u0648\u0631\u064A\u0627": _2, "xn--o3cw4h": [1, { "xn--o3cyx2a": _2, "xn--12co0c3b4eva": _2, "xn--m3ch0j3a": _2, "xn--h3cuzk1di": _2, "xn--12c1fe0br": _2, "xn--12cfi8ixb8l": _2 }], "\u0E44\u0E17\u0E22": [1, { "\u0E17\u0E2B\u0E32\u0E23": _2, "\u0E18\u0E38\u0E23\u0E01\u0E34\u0E08": _2, "\u0E40\u0E19\u0E47\u0E15": _2, "\u0E23\u0E31\u0E10\u0E1A\u0E32\u0E25": _2, "\u0E28\u0E36\u0E01\u0E29\u0E32": _2, "\u0E2D\u0E07\u0E04\u0E4C\u0E01\u0E23": _2 }], "xn--pgbs0dh": _2, "\u062A\u0648\u0646\u0633": _2, "xn--kpry57d": _2, "\u53F0\u7063": _2, "xn--kprw13d": _2, "\u53F0\u6E7E": _2, "xn--nnx388a": _2, "\u81FA\u7063": _2, "xn--j1amh": _2, "\u0443\u043A\u0440": _2, "xn--mgb2ddes": _2, "\u0627\u0644\u064A\u0645\u0646": _2, "xxx": _2, "ye": _5, "za": [0, { "ac": _2, "agric": _2, "alt": _2, "co": _2, "edu": _2, "gov": _2, "grondar": _2, "law": _2, "mil": _2, "net": _2, "ngo": _2, "nic": _2, "nis": _2, "nom": _2, "org": _2, "school": _2, "tm": _2, "web": _2 }], "zm": [1, { "ac": _2, "biz": _2, "co": _2, "com": _2, "edu": _2, "gov": _2, "info": _2, "mil": _2, "net": _2, "org": _2, "sch": _2 }], "zw": [1, { "ac": _2, "co": _2, "gov": _2, "mil": _2, "org": _2 }], "aaa": _2, "aarp": _2, "abb": _2, "abbott": _2, "abbvie": _2, "abc": _2, "able": _2, "abogado": _2, "abudhabi": _2, "academy": [1, { "official": _3 }], "accenture": _2, "accountant": _2, "accountants": _2, "aco": _2, "actor": _2, "ads": _2, "adult": _2, "aeg": _2, "aetna": _2, "afl": _2, "africa": _2, "agakhan": _2, "agency": _2, "aig": _2, "airbus": _2, "airforce": _2, "airtel": _2, "akdn": _2, "alibaba": _2, "alipay": _2, "allfinanz": _2, "allstate": _2, "ally": _2, "alsace": _2, "alstom": _2, "amazon": _2, "americanexpress": _2, "americanfamily": _2, "amex": _2, "amfam": _2, "amica": _2, "amsterdam": _2, "analytics": _2, "android": _2, "anquan": _2, "anz": _2, "aol": _2, "apartments": _2, "app": [1, { "adaptable": _3, "aiven": _3, "beget": _6, "brave": _7, "clerk": _3, "clerkstage": _3, "wnext": _3, "csb": [2, { "preview": _3 }], "convex": _3, "deta": _3, "ondigitalocean": _3, "easypanel": _3, "encr": _3, "evervault": _8, "expo": [2, { "staging": _3 }], "edgecompute": _3, "on-fleek": _3, "flutterflow": _3, "e2b": _3, "framer": _3, "hosted": _6, "run": _6, "web": _3, "hasura": _3, "botdash": _3, "loginline": _3, "lovable": _3, "luyani": _3, "medusajs": _3, "messerli": _3, "netfy": _3, "netlify": _3, "ngrok": _3, "ngrok-free": _3, "developer": _6, "noop": _3, "northflank": _6, "upsun": _6, "replit": _9, "nyat": _3, "snowflake": [0, { "*": _3, "privatelink": _6 }], "streamlit": _3, "storipress": _3, "telebit": _3, "typedream": _3, "vercel": _3, "bookonline": _3, "wdh": _3, "windsurf": _3, "zeabur": _3, "zerops": _6 }], "apple": _2, "aquarelle": _2, "arab": _2, "aramco": _2, "archi": _2, "army": _2, "art": _2, "arte": _2, "asda": _2, "associates": _2, "athleta": _2, "attorney": _2, "auction": _2, "audi": _2, "audible": _2, "audio": _2, "auspost": _2, "author": _2, "auto": _2, "autos": _2, "aws": [1, { "sagemaker": [0, { "ap-northeast-1": _13, "ap-northeast-2": _13, "ap-south-1": _13, "ap-southeast-1": _13, "ap-southeast-2": _13, "ca-central-1": _15, "eu-central-1": _13, "eu-west-1": _13, "eu-west-2": _13, "us-east-1": _15, "us-east-2": _15, "us-west-2": _15, "af-south-1": _12, "ap-east-1": _12, "ap-northeast-3": _12, "ap-south-2": _14, "ap-southeast-3": _12, "ap-southeast-4": _14, "ca-west-1": [0, { "notebook": _3, "notebook-fips": _3 }], "eu-central-2": _12, "eu-north-1": _12, "eu-south-1": _12, "eu-south-2": _12, "eu-west-3": _12, "il-central-1": _12, "me-central-1": _12, "me-south-1": _12, "sa-east-1": _12, "us-gov-east-1": _16, "us-gov-west-1": _16, "us-west-1": [0, { "notebook": _3, "notebook-fips": _3, "studio": _3 }], "experiments": _6 }], "repost": [0, { "private": _6 }], "on": [0, { "ap-northeast-1": _11, "ap-southeast-1": _11, "ap-southeast-2": _11, "eu-central-1": _11, "eu-north-1": _11, "eu-west-1": _11, "us-east-1": _11, "us-east-2": _11, "us-west-2": _11 }] }], "axa": _2, "azure": _2, "baby": _2, "baidu": _2, "banamex": _2, "band": _2, "bank": _2, "bar": _2, "barcelona": _2, "barclaycard": _2, "barclays": _2, "barefoot": _2, "bargains": _2, "baseball": _2, "basketball": [1, { "aus": _3, "nz": _3 }], "bauhaus": _2, "bayern": _2, "bbc": _2, "bbt": _2, "bbva": _2, "bcg": _2, "bcn": _2, "beats": _2, "beauty": _2, "beer": _2, "berlin": _2, "best": _2, "bestbuy": _2, "bet": _2, "bharti": _2, "bible": _2, "bid": _2, "bike": _2, "bing": _2, "bingo": _2, "bio": _2, "black": _2, "blackfriday": _2, "blockbuster": _2, "blog": _2, "bloomberg": _2, "blue": _2, "bms": _2, "bmw": _2, "bnpparibas": _2, "boats": _2, "boehringer": _2, "bofa": _2, "bom": _2, "bond": _2, "boo": _2, "book": _2, "booking": _2, "bosch": _2, "bostik": _2, "boston": _2, "bot": _2, "boutique": _2, "box": _2, "bradesco": _2, "bridgestone": _2, "broadway": _2, "broker": _2, "brother": _2, "brussels": _2, "build": [1, { "v0": _3, "windsurf": _3 }], "builders": [1, { "cloudsite": _3 }], "business": _18, "buy": _2, "buzz": _2, "bzh": _2, "cab": _2, "cafe": _2, "cal": _2, "call": _2, "calvinklein": _2, "cam": _2, "camera": _2, "camp": [1, { "emf": [0, { "at": _3 }] }], "canon": _2, "capetown": _2, "capital": _2, "capitalone": _2, "car": _2, "caravan": _2, "cards": _2, "care": _2, "career": _2, "careers": _2, "cars": _2, "casa": [1, { "nabu": [0, { "ui": _3 }] }], "case": _2, "cash": _2, "casino": _2, "catering": _2, "catholic": _2, "cba": _2, "cbn": _2, "cbre": _2, "center": _2, "ceo": _2, "cern": _2, "cfa": _2, "cfd": _2, "chanel": _2, "channel": _2, "charity": _2, "chase": _2, "chat": _2, "cheap": _2, "chintai": _2, "christmas": _2, "chrome": _2, "church": _2, "cipriani": _2, "circle": _2, "cisco": _2, "citadel": _2, "citi": _2, "citic": _2, "city": _2, "claims": _2, "cleaning": _2, "click": _2, "clinic": _2, "clinique": _2, "clothing": _2, "cloud": [1, { "convex": _3, "elementor": _3, "encoway": [0, { "eu": _3 }], "statics": _6, "ravendb": _3, "axarnet": [0, { "es-1": _3 }], "diadem": _3, "jelastic": [0, { "vip": _3 }], "jele": _3, "jenv-aruba": [0, { "aruba": [0, { "eur": [0, { "it1": _3 }] }], "it1": _3 }], "keliweb": [2, { "cs": _3 }], "oxa": [2, { "tn": _3, "uk": _3 }], "primetel": [2, { "uk": _3 }], "reclaim": [0, { "ca": _3, "uk": _3, "us": _3 }], "trendhosting": [0, { "ch": _3, "de": _3 }], "jotelulu": _3, "kuleuven": _3, "laravel": _3, "linkyard": _3, "magentosite": _6, "matlab": _3, "observablehq": _3, "perspecta": _3, "vapor": _3, "on-rancher": _6, "scw": [0, { "baremetal": [0, { "fr-par-1": _3, "fr-par-2": _3, "nl-ams-1": _3 }], "fr-par": [0, { "cockpit": _3, "fnc": [2, { "functions": _3 }], "k8s": _20, "s3": _3, "s3-website": _3, "whm": _3 }], "instances": [0, { "priv": _3, "pub": _3 }], "k8s": _3, "nl-ams": [0, { "cockpit": _3, "k8s": _20, "s3": _3, "s3-website": _3, "whm": _3 }], "pl-waw": [0, { "cockpit": _3, "k8s": _20, "s3": _3, "s3-website": _3 }], "scalebook": _3, "smartlabeling": _3 }], "servebolt": _3, "onstackit": [0, { "runs": _3 }], "trafficplex": _3, "unison-services": _3, "urown": _3, "voorloper": _3, "zap": _3 }], "club": [1, { "cloudns": _3, "jele": _3, "barsy": _3 }], "clubmed": _2, "coach": _2, "codes": [1, { "owo": _6 }], "coffee": _2, "college": _2, "cologne": _2, "commbank": _2, "community": [1, { "nog": _3, "ravendb": _3, "myforum": _3 }], "company": _2, "compare": _2, "computer": _2, "comsec": _2, "condos": _2, "construction": _2, "consulting": _2, "contact": _2, "contractors": _2, "cooking": _2, "cool": [1, { "elementor": _3, "de": _3 }], "corsica": _2, "country": _2, "coupon": _2, "coupons": _2, "courses": _2, "cpa": _2, "credit": _2, "creditcard": _2, "creditunion": _2, "cricket": _2, "crown": _2, "crs": _2, "cruise": _2, "cruises": _2, "cuisinella": _2, "cymru": _2, "cyou": _2, "dad": _2, "dance": _2, "data": _2, "date": _2, "dating": _2, "datsun": _2, "day": _2, "dclk": _2, "dds": _2, "deal": _2, "dealer": _2, "deals": _2, "degree": _2, "delivery": _2, "dell": _2, "deloitte": _2, "delta": _2, "democrat": _2, "dental": _2, "dentist": _2, "desi": _2, "design": [1, { "graphic": _3, "bss": _3 }], "dev": [1, { "12chars": _3, "myaddr": _3, "panel": _3, "lcl": _6, "lclstage": _6, "stg": _6, "stgstage": _6, "pages": _3, "r2": _3, "workers": _3, "deno": _3, "deno-staging": _3, "deta": _3, "lp": _3, "evervault": _8, "fly": _3, "githubpreview": _3, "gateway": _6, "botdash": _3, "inbrowser": _6, "is-a-good": _3, "is-a": _3, "iserv": _3, "runcontainers": _3, "localcert": [0, { "user": _6 }], "loginline": _3, "barsy": _3, "mediatech": _3, "modx": _3, "ngrok": _3, "ngrok-free": _3, "is-a-fullstack": _3, "is-cool": _3, "is-not-a": _3, "localplayer": _3, "xmit": _3, "platter-app": _3, "replit": [2, { "archer": _3, "bones": _3, "canary": _3, "global": _3, "hacker": _3, "id": _3, "janeway": _3, "kim": _3, "kira": _3, "kirk": _3, "odo": _3, "paris": _3, "picard": _3, "pike": _3, "prerelease": _3, "reed": _3, "riker": _3, "sisko": _3, "spock": _3, "staging": _3, "sulu": _3, "tarpit": _3, "teams": _3, "tucker": _3, "wesley": _3, "worf": _3 }], "crm": [0, { "d": _6, "w": _6, "wa": _6, "wb": _6, "wc": _6, "wd": _6, "we": _6, "wf": _6 }], "vercel": _3, "webhare": _6, "hrsn": _3 }], "dhl": _2, "diamonds": _2, "diet": _2, "digital": [1, { "cloudapps": [2, { "london": _3 }] }], "direct": [1, { "libp2p": _3 }], "directory": _2, "discount": _2, "discover": _2, "dish": _2, "diy": _2, "dnp": _2, "docs": _2, "doctor": _2, "dog": _2, "domains": _2, "dot": _2, "download": _2, "drive": _2, "dtv": _2, "dubai": _2, "dunlop": _2, "dupont": _2, "durban": _2, "dvag": _2, "dvr": _2, "earth": _2, "eat": _2, "eco": _2, "edeka": _2, "education": _18, "email": [1, { "crisp": [0, { "on": _3 }], "tawk": _48, "tawkto": _48 }], "emerck": _2, "energy": _2, "engineer": _2, "engineering": _2, "enterprises": _2, "epson": _2, "equipment": _2, "ericsson": _2, "erni": _2, "esq": _2, "estate": [1, { "compute": _6 }], "eurovision": _2, "eus": [1, { "party": _49 }], "events": [1, { "koobin": _3, "co": _3 }], "exchange": _2, "expert": _2, "exposed": _2, "express": _2, "extraspace": _2, "fage": _2, "fail": _2, "fairwinds": _2, "faith": _2, "family": _2, "fan": _2, "fans": _2, "farm": [1, { "storj": _3 }], "farmers": _2, "fashion": _2, "fast": _2, "fedex": _2, "feedback": _2, "ferrari": _2, "ferrero": _2, "fidelity": _2, "fido": _2, "film": _2, "final": _2, "finance": _2, "financial": _18, "fire": _2, "firestone": _2, "firmdale": _2, "fish": _2, "fishing": _2, "fit": _2, "fitness": _2, "flickr": _2, "flights": _2, "flir": _2, "florist": _2, "flowers": _2, "fly": _2, "foo": _2, "food": _2, "football": _2, "ford": _2, "forex": _2, "forsale": _2, "forum": _2, "foundation": _2, "fox": _2, "free": _2, "fresenius": _2, "frl": _2, "frogans": _2, "frontier": _2, "ftr": _2, "fujitsu": _2, "fun": _2, "fund": _2, "furniture": _2, "futbol": _2, "fyi": _2, "gal": _2, "gallery": _2, "gallo": _2, "gallup": _2, "game": _2, "games": [1, { "pley": _3, "sheezy": _3 }], "gap": _2, "garden": _2, "gay": [1, { "pages": _3 }], "gbiz": _2, "gdn": [1, { "cnpy": _3 }], "gea": _2, "gent": _2, "genting": _2, "george": _2, "ggee": _2, "gift": _2, "gifts": _2, "gives": _2, "giving": _2, "glass": _2, "gle": _2, "global": [1, { "appwrite": _3 }], "globo": _2, "gmail": _2, "gmbh": _2, "gmo": _2, "gmx": _2, "godaddy": _2, "gold": _2, "goldpoint": _2, "golf": _2, "goo": _2, "goodyear": _2, "goog": [1, { "cloud": _3, "translate": _3, "usercontent": _6 }], "google": _2, "gop": _2, "got": _2, "grainger": _2, "graphics": _2, "gratis": _2, "green": _2, "gripe": _2, "grocery": _2, "group": [1, { "discourse": _3 }], "gucci": _2, "guge": _2, "guide": _2, "guitars": _2, "guru": _2, "hair": _2, "hamburg": _2, "hangout": _2, "haus": _2, "hbo": _2, "hdfc": _2, "hdfcbank": _2, "health": [1, { "hra": _3 }], "healthcare": _2, "help": _2, "helsinki": _2, "here": _2, "hermes": _2, "hiphop": _2, "hisamitsu": _2, "hitachi": _2, "hiv": _2, "hkt": _2, "hockey": _2, "holdings": _2, "holiday": _2, "homedepot": _2, "homegoods": _2, "homes": _2, "homesense": _2, "honda": _2, "horse": _2, "hospital": _2, "host": [1, { "cloudaccess": _3, "freesite": _3, "easypanel": _3, "fastvps": _3, "myfast": _3, "tempurl": _3, "wpmudev": _3, "jele": _3, "mircloud": _3, "wp2": _3, "half": _3 }], "hosting": [1, { "opencraft": _3 }], "hot": _2, "hotels": _2, "hotmail": _2, "house": _2, "how": _2, "hsbc": _2, "hughes": _2, "hyatt": _2, "hyundai": _2, "ibm": _2, "icbc": _2, "ice": _2, "icu": _2, "ieee": _2, "ifm": _2, "ikano": _2, "imamat": _2, "imdb": _2, "immo": _2, "immobilien": _2, "inc": _2, "industries": _2, "infiniti": _2, "ing": _2, "ink": _2, "institute": _2, "insurance": _2, "insure": _2, "international": _2, "intuit": _2, "investments": _2, "ipiranga": _2, "irish": _2, "ismaili": _2, "ist": _2, "istanbul": _2, "itau": _2, "itv": _2, "jaguar": _2, "java": _2, "jcb": _2, "jeep": _2, "jetzt": _2, "jewelry": _2, "jio": _2, "jll": _2, "jmp": _2, "jnj": _2, "joburg": _2, "jot": _2, "joy": _2, "jpmorgan": _2, "jprs": _2, "juegos": _2, "juniper": _2, "kaufen": _2, "kddi": _2, "kerryhotels": _2, "kerryproperties": _2, "kfh": _2, "kia": _2, "kids": _2, "kim": _2, "kindle": _2, "kitchen": _2, "kiwi": _2, "koeln": _2, "komatsu": _2, "kosher": _2, "kpmg": _2, "kpn": _2, "krd": [1, { "co": _3, "edu": _3 }], "kred": _2, "kuokgroup": _2, "kyoto": _2, "lacaixa": _2, "lamborghini": _2, "lamer": _2, "land": _2, "landrover": _2, "lanxess": _2, "lasalle": _2, "lat": _2, "latino": _2, "latrobe": _2, "law": _2, "lawyer": _2, "lds": _2, "lease": _2, "leclerc": _2, "lefrak": _2, "legal": _2, "lego": _2, "lexus": _2, "lgbt": _2, "lidl": _2, "life": _2, "lifeinsurance": _2, "lifestyle": _2, "lighting": _2, "like": _2, "lilly": _2, "limited": _2, "limo": _2, "lincoln": _2, "link": [1, { "myfritz": _3, "cyon": _3, "dweb": _6, "inbrowser": _6, "nftstorage": _56, "mypep": _3, "storacha": _56, "w3s": _56 }], "live": [1, { "aem": _3, "hlx": _3, "ewp": _6 }], "living": _2, "llc": _2, "llp": _2, "loan": _2, "loans": _2, "locker": _2, "locus": _2, "lol": [1, { "omg": _3 }], "london": _2, "lotte": _2, "lotto": _2, "love": _2, "lpl": _2, "lplfinancial": _2, "ltd": _2, "ltda": _2, "lundbeck": _2, "luxe": _2, "luxury": _2, "madrid": _2, "maif": _2, "maison": _2, "makeup": _2, "man": _2, "management": _2, "mango": _2, "map": _2, "market": _2, "marketing": _2, "markets": _2, "marriott": _2, "marshalls": _2, "mattel": _2, "mba": _2, "mckinsey": _2, "med": _2, "media": _57, "meet": _2, "melbourne": _2, "meme": _2, "memorial": _2, "men": _2, "menu": [1, { "barsy": _3, "barsyonline": _3 }], "merck": _2, "merckmsd": _2, "miami": _2, "microsoft": _2, "mini": _2, "mint": _2, "mit": _2, "mitsubishi": _2, "mlb": _2, "mls": _2, "mma": _2, "mobile": _2, "moda": _2, "moe": _2, "moi": _2, "mom": [1, { "ind": _3 }], "monash": _2, "money": _2, "monster": _2, "mormon": _2, "mortgage": _2, "moscow": _2, "moto": _2, "motorcycles": _2, "mov": _2, "movie": _2, "msd": _2, "mtn": _2, "mtr": _2, "music": _2, "nab": _2, "nagoya": _2, "navy": _2, "nba": _2, "nec": _2, "netbank": _2, "netflix": _2, "network": [1, { "alces": _6, "co": _3, "arvo": _3, "azimuth": _3, "tlon": _3 }], "neustar": _2, "new": _2, "news": [1, { "noticeable": _3 }], "next": _2, "nextdirect": _2, "nexus": _2, "nfl": _2, "ngo": _2, "nhk": _2, "nico": _2, "nike": _2, "nikon": _2, "ninja": _2, "nissan": _2, "nissay": _2, "nokia": _2, "norton": _2, "now": _2, "nowruz": _2, "nowtv": _2, "nra": _2, "nrw": _2, "ntt": _2, "nyc": _2, "obi": _2, "observer": _2, "office": _2, "okinawa": _2, "olayan": _2, "olayangroup": _2, "ollo": _2, "omega": _2, "one": [1, { "kin": _6, "service": _3 }], "ong": [1, { "obl": _3 }], "onl": _2, "online": [1, { "eero": _3, "eero-stage": _3, "websitebuilder": _3, "barsy": _3 }], "ooo": _2, "open": _2, "oracle": _2, "orange": [1, { "tech": _3 }], "organic": _2, "origins": _2, "osaka": _2, "otsuka": _2, "ott": _2, "ovh": [1, { "nerdpol": _3 }], "page": [1, { "aem": _3, "hlx": _3, "hlx3": _3, "translated": _3, "codeberg": _3, "heyflow": _3, "prvcy": _3, "rocky": _3, "pdns": _3, "plesk": _3 }], "panasonic": _2, "paris": _2, "pars": _2, "partners": _2, "parts": _2, "party": _2, "pay": _2, "pccw": _2, "pet": _2, "pfizer": _2, "pharmacy": _2, "phd": _2, "philips": _2, "phone": _2, "photo": _2, "photography": _2, "photos": _57, "physio": _2, "pics": _2, "pictet": _2, "pictures": [1, { "1337": _3 }], "pid": _2, "pin": _2, "ping": _2, "pink": _2, "pioneer": _2, "pizza": [1, { "ngrok": _3 }], "place": _18, "play": _2, "playstation": _2, "plumbing": _2, "plus": _2, "pnc": _2, "pohl": _2, "poker": _2, "politie": _2, "porn": _2, "pramerica": _2, "praxi": _2, "press": _2, "prime": _2, "prod": _2, "productions": _2, "prof": _2, "progressive": _2, "promo": _2, "properties": _2, "property": _2, "protection": _2, "pru": _2, "prudential": _2, "pub": [1, { "id": _6, "kin": _6, "barsy": _3 }], "pwc": _2, "qpon": _2, "quebec": _2, "quest": _2, "racing": _2, "radio": _2, "read": _2, "realestate": _2, "realtor": _2, "realty": _2, "recipes": _2, "red": _2, "redstone": _2, "redumbrella": _2, "rehab": _2, "reise": _2, "reisen": _2, "reit": _2, "reliance": _2, "ren": _2, "rent": _2, "rentals": _2, "repair": _2, "report": _2, "republican": _2, "rest": _2, "restaurant": _2, "review": _2, "reviews": _2, "rexroth": _2, "rich": _2, "richardli": _2, "ricoh": _2, "ril": _2, "rio": _2, "rip": [1, { "clan": _3 }], "rocks": [1, { "myddns": _3, "stackit": _3, "lima-city": _3, "webspace": _3 }], "rodeo": _2, "rogers": _2, "room": _2, "rsvp": _2, "rugby": _2, "ruhr": _2, "run": [1, { "appwrite": _6, "development": _3, "ravendb": _3, "liara": [2, { "iran": _3 }], "servers": _3, "build": _6, "code": _6, "database": _6, "migration": _6, "onporter": _3, "repl": _3, "stackit": _3, "val": [2, { "web": _3 }], "wix": _3 }], "rwe": _2, "ryukyu": _2, "saarland": _2, "safe": _2, "safety": _2, "sakura": _2, "sale": _2, "salon": _2, "samsclub": _2, "samsung": _2, "sandvik": _2, "sandvikcoromant": _2, "sanofi": _2, "sap": _2, "sarl": _2, "sas": _2, "save": _2, "saxo": _2, "sbi": _2, "sbs": _2, "scb": _2, "schaeffler": _2, "schmidt": _2, "scholarships": _2, "school": _2, "schule": _2, "schwarz": _2, "science": _2, "scot": [1, { "gov": [2, { "service": _3 }] }], "search": _2, "seat": _2, "secure": _2, "security": _2, "seek": _2, "select": _2, "sener": _2, "services": [1, { "loginline": _3 }], "seven": _2, "sew": _2, "sex": _2, "sexy": _2, "sfr": _2, "shangrila": _2, "sharp": _2, "shell": _2, "shia": _2, "shiksha": _2, "shoes": _2, "shop": [1, { "base": _3, "hoplix": _3, "barsy": _3, "barsyonline": _3, "shopware": _3 }], "shopping": _2, "shouji": _2, "show": _2, "silk": _2, "sina": _2, "singles": _2, "site": [1, { "square": _3, "canva": _21, "cloudera": _6, "convex": _3, "cyon": _3, "fastvps": _3, "figma": _3, "preview": _3, "heyflow": _3, "jele": _3, "jouwweb": _3, "loginline": _3, "barsy": _3, "notion": _3, "omniwe": _3, "opensocial": _3, "madethis": _3, "platformsh": _6, "tst": _6, "byen": _3, "srht": _3, "novecore": _3, "cpanel": _3, "wpsquared": _3 }], "ski": _2, "skin": _2, "sky": _2, "skype": _2, "sling": _2, "smart": _2, "smile": _2, "sncf": _2, "soccer": _2, "social": _2, "softbank": _2, "software": _2, "sohu": _2, "solar": _2, "solutions": _2, "song": _2, "sony": _2, "soy": _2, "spa": _2, "space": [1, { "myfast": _3, "heiyu": _3, "hf": [2, { "static": _3 }], "app-ionos": _3, "project": _3, "uber": _3, "xs4all": _3 }], "sport": _2, "spot": _2, "srl": _2, "stada": _2, "staples": _2, "star": _2, "statebank": _2, "statefarm": _2, "stc": _2, "stcgroup": _2, "stockholm": _2, "storage": _2, "store": [1, { "barsy": _3, "sellfy": _3, "shopware": _3, "storebase": _3 }], "stream": _2, "studio": _2, "study": _2, "style": _2, "sucks": _2, "supplies": _2, "supply": _2, "support": [1, { "barsy": _3 }], "surf": _2, "surgery": _2, "suzuki": _2, "swatch": _2, "swiss": _2, "sydney": _2, "systems": [1, { "knightpoint": _3 }], "tab": _2, "taipei": _2, "talk": _2, "taobao": _2, "target": _2, "tatamotors": _2, "tatar": _2, "tattoo": _2, "tax": _2, "taxi": _2, "tci": _2, "tdk": _2, "team": [1, { "discourse": _3, "jelastic": _3 }], "tech": [1, { "cleverapps": _3 }], "technology": _18, "temasek": _2, "tennis": _2, "teva": _2, "thd": _2, "theater": _2, "theatre": _2, "tiaa": _2, "tickets": _2, "tienda": _2, "tips": _2, "tires": _2, "tirol": _2, "tjmaxx": _2, "tjx": _2, "tkmaxx": _2, "tmall": _2, "today": [1, { "prequalifyme": _3 }], "tokyo": _2, "tools": [1, { "addr": _46, "myaddr": _3 }], "top": [1, { "ntdll": _3, "wadl": _6 }], "toray": _2, "toshiba": _2, "total": _2, "tours": _2, "town": _2, "toyota": _2, "toys": _2, "trade": _2, "trading": _2, "training": _2, "travel": _2, "travelers": _2, "travelersinsurance": _2, "trust": _2, "trv": _2, "tube": _2, "tui": _2, "tunes": _2, "tushu": _2, "tvs": _2, "ubank": _2, "ubs": _2, "unicom": _2, "university": _2, "uno": _2, "uol": _2, "ups": _2, "vacations": _2, "vana": _2, "vanguard": _2, "vegas": _2, "ventures": _2, "verisign": _2, "versicherung": _2, "vet": _2, "viajes": _2, "video": _2, "vig": _2, "viking": _2, "villas": _2, "vin": _2, "vip": _2, "virgin": _2, "visa": _2, "vision": _2, "viva": _2, "vivo": _2, "vlaanderen": _2, "vodka": _2, "volvo": _2, "vote": _2, "voting": _2, "voto": _2, "voyage": _2, "wales": _2, "walmart": _2, "walter": _2, "wang": _2, "wanggou": _2, "watch": _2, "watches": _2, "weather": _2, "weatherchannel": _2, "webcam": _2, "weber": _2, "website": _57, "wed": _2, "wedding": _2, "weibo": _2, "weir": _2, "whoswho": _2, "wien": _2, "wiki": _57, "williamhill": _2, "win": _2, "windows": _2, "wine": _2, "winners": _2, "wme": _2, "wolterskluwer": _2, "woodside": _2, "work": _2, "works": _2, "world": _2, "wow": _2, "wtc": _2, "wtf": _2, "xbox": _2, "xerox": _2, "xihuan": _2, "xin": _2, "xn--11b4c3d": _2, "\u0915\u0949\u092E": _2, "xn--1ck2e1b": _2, "\u30BB\u30FC\u30EB": _2, "xn--1qqw23a": _2, "\u4F5B\u5C71": _2, "xn--30rr7y": _2, "\u6148\u5584": _2, "xn--3bst00m": _2, "\u96C6\u56E2": _2, "xn--3ds443g": _2, "\u5728\u7EBF": _2, "xn--3pxu8k": _2, "\u70B9\u770B": _2, "xn--42c2d9a": _2, "\u0E04\u0E2D\u0E21": _2, "xn--45q11c": _2, "\u516B\u5366": _2, "xn--4gbrim": _2, "\u0645\u0648\u0642\u0639": _2, "xn--55qw42g": _2, "\u516C\u76CA": _2, "xn--55qx5d": _2, "\u516C\u53F8": _2, "xn--5su34j936bgsg": _2, "\u9999\u683C\u91CC\u62C9": _2, "xn--5tzm5g": _2, "\u7F51\u7AD9": _2, "xn--6frz82g": _2, "\u79FB\u52A8": _2, "xn--6qq986b3xl": _2, "\u6211\u7231\u4F60": _2, "xn--80adxhks": _2, "\u043C\u043E\u0441\u043A\u0432\u0430": _2, "xn--80aqecdr1a": _2, "\u043A\u0430\u0442\u043E\u043B\u0438\u043A": _2, "xn--80asehdb": _2, "\u043E\u043D\u043B\u0430\u0439\u043D": _2, "xn--80aswg": _2, "\u0441\u0430\u0439\u0442": _2, "xn--8y0a063a": _2, "\u8054\u901A": _2, "xn--9dbq2a": _2, "\u05E7\u05D5\u05DD": _2, "xn--9et52u": _2, "\u65F6\u5C1A": _2, "xn--9krt00a": _2, "\u5FAE\u535A": _2, "xn--b4w605ferd": _2, "\u6DE1\u9A6C\u9521": _2, "xn--bck1b9a5dre4c": _2, "\u30D5\u30A1\u30C3\u30B7\u30E7\u30F3": _2, "xn--c1avg": _2, "\u043E\u0440\u0433": _2, "xn--c2br7g": _2, "\u0928\u0947\u091F": _2, "xn--cck2b3b": _2, "\u30B9\u30C8\u30A2": _2, "xn--cckwcxetd": _2, "\u30A2\u30DE\u30BE\u30F3": _2, "xn--cg4bki": _2, "\uC0BC\uC131": _2, "xn--czr694b": _2, "\u5546\u6807": _2, "xn--czrs0t": _2, "\u5546\u5E97": _2, "xn--czru2d": _2, "\u5546\u57CE": _2, "xn--d1acj3b": _2, "\u0434\u0435\u0442\u0438": _2, "xn--eckvdtc9d": _2, "\u30DD\u30A4\u30F3\u30C8": _2, "xn--efvy88h": _2, "\u65B0\u95FB": _2, "xn--fct429k": _2, "\u5BB6\u96FB": _2, "xn--fhbei": _2, "\u0643\u0648\u0645": _2, "xn--fiq228c5hs": _2, "\u4E2D\u6587\u7F51": _2, "xn--fiq64b": _2, "\u4E2D\u4FE1": _2, "xn--fjq720a": _2, "\u5A31\u4E50": _2, "xn--flw351e": _2, "\u8C37\u6B4C": _2, "xn--fzys8d69uvgm": _2, "\u96FB\u8A0A\u76C8\u79D1": _2, "xn--g2xx48c": _2, "\u8D2D\u7269": _2, "xn--gckr3f0f": _2, "\u30AF\u30E9\u30A6\u30C9": _2, "xn--gk3at1e": _2, "\u901A\u8CA9": _2, "xn--hxt814e": _2, "\u7F51\u5E97": _2, "xn--i1b6b1a6a2e": _2, "\u0938\u0902\u0917\u0920\u0928": _2, "xn--imr513n": _2, "\u9910\u5385": _2, "xn--io0a7i": _2, "\u7F51\u7EDC": _2, "xn--j1aef": _2, "\u043A\u043E\u043C": _2, "xn--jlq480n2rg": _2, "\u4E9A\u9A6C\u900A": _2, "xn--jvr189m": _2, "\u98DF\u54C1": _2, "xn--kcrx77d1x4a": _2, "\u98DE\u5229\u6D66": _2, "xn--kput3i": _2, "\u624B\u673A": _2, "xn--mgba3a3ejt": _2, "\u0627\u0631\u0627\u0645\u0643\u0648": _2, "xn--mgba7c0bbn0a": _2, "\u0627\u0644\u0639\u0644\u064A\u0627\u0646": _2, "xn--mgbab2bd": _2, "\u0628\u0627\u0632\u0627\u0631": _2, "xn--mgbca7dzdo": _2, "\u0627\u0628\u0648\u0638\u0628\u064A": _2, "xn--mgbi4ecexp": _2, "\u0643\u0627\u062B\u0648\u0644\u064A\u0643": _2, "xn--mgbt3dhd": _2, "\u0647\u0645\u0631\u0627\u0647": _2, "xn--mk1bu44c": _2, "\uB2F7\uCEF4": _2, "xn--mxtq1m": _2, "\u653F\u5E9C": _2, "xn--ngbc5azd": _2, "\u0634\u0628\u0643\u0629": _2, "xn--ngbe9e0a": _2, "\u0628\u064A\u062A\u0643": _2, "xn--ngbrx": _2, "\u0639\u0631\u0628": _2, "xn--nqv7f": _2, "\u673A\u6784": _2, "xn--nqv7fs00ema": _2, "\u7EC4\u7EC7\u673A\u6784": _2, "xn--nyqy26a": _2, "\u5065\u5EB7": _2, "xn--otu796d": _2, "\u62DB\u8058": _2, "xn--p1acf": [1, { "xn--90amc": _3, "xn--j1aef": _3, "xn--j1ael8b": _3, "xn--h1ahn": _3, "xn--j1adp": _3, "xn--c1avg": _3, "xn--80aaa0cvac": _3, "xn--h1aliz": _3, "xn--90a1af": _3, "xn--41a": _3 }], "\u0440\u0443\u0441": [1, { "\u0431\u0438\u0437": _3, "\u043A\u043E\u043C": _3, "\u043A\u0440\u044B\u043C": _3, "\u043C\u0438\u0440": _3, "\u043C\u0441\u043A": _3, "\u043E\u0440\u0433": _3, "\u0441\u0430\u043C\u0430\u0440\u0430": _3, "\u0441\u043E\u0447\u0438": _3, "\u0441\u043F\u0431": _3, "\u044F": _3 }], "xn--pssy2u": _2, "\u5927\u62FF": _2, "xn--q9jyb4c": _2, "\u307F\u3093\u306A": _2, "xn--qcka1pmc": _2, "\u30B0\u30FC\u30B0\u30EB": _2, "xn--rhqv96g": _2, "\u4E16\u754C": _2, "xn--rovu88b": _2, "\u66F8\u7C4D": _2, "xn--ses554g": _2, "\u7F51\u5740": _2, "xn--t60b56a": _2, "\uB2F7\uB137": _2, "xn--tckwe": _2, "\u30B3\u30E0": _2, "xn--tiq49xqyj": _2, "\u5929\u4E3B\u6559": _2, "xn--unup4y": _2, "\u6E38\u620F": _2, "xn--vermgensberater-ctb": _2, "verm\xF6gensberater": _2, "xn--vermgensberatung-pwb": _2, "verm\xF6gensberatung": _2, "xn--vhquv": _2, "\u4F01\u4E1A": _2, "xn--vuq861b": _2, "\u4FE1\u606F": _2, "xn--w4r85el8fhu5dnra": _2, "\u5609\u91CC\u5927\u9152\u5E97": _2, "xn--w4rs40l": _2, "\u5609\u91CC": _2, "xn--xhq521b": _2, "\u5E7F\u4E1C": _2, "xn--zfr164b": _2, "\u653F\u52A1": _2, "xyz": [1, { "botdash": _3, "telebit": _6 }], "yachts": _2, "yahoo": _2, "yamaxun": _2, "yandex": _2, "yodobashi": _2, "yoga": _2, "yokohama": _2, "you": _2, "youtube": _2, "yun": _2, "zappos": _2, "zara": _2, "zero": _2, "zip": _2, "zone": [1, { "cloud66": _3, "triton": _6, "stackit": _3, "lima": _3 }], "zuerich": _2 }];
  return rules2;
}();

// node_modules/tldts/dist/es6/src/suffix-trie.js
function lookupInTrie(parts, trie, index, allowedMask) {
  let result = null;
  let node = trie;
  while (node !== void 0) {
    if ((node[0] & allowedMask) !== 0) {
      result = {
        index: index + 1,
        isIcann: node[0] === 1,
        isPrivate: node[0] === 2
      };
    }
    if (index === -1) {
      break;
    }
    const succ = node[1];
    node = Object.prototype.hasOwnProperty.call(succ, parts[index]) ? succ[parts[index]] : succ["*"];
    index -= 1;
  }
  return result;
}
function suffixLookup(hostname, options, out) {
  var _a;
  if (fast_path_default(hostname, options, out)) {
    return;
  }
  const hostnameParts = hostname.split(".");
  const allowedMask = (options.allowPrivateDomains ? 2 : 0) | (options.allowIcannDomains ? 1 : 0);
  const exceptionMatch = lookupInTrie(hostnameParts, exceptions, hostnameParts.length - 1, allowedMask);
  if (exceptionMatch !== null) {
    out.isIcann = exceptionMatch.isIcann;
    out.isPrivate = exceptionMatch.isPrivate;
    out.publicSuffix = hostnameParts.slice(exceptionMatch.index + 1).join(".");
    return;
  }
  const rulesMatch = lookupInTrie(hostnameParts, rules, hostnameParts.length - 1, allowedMask);
  if (rulesMatch !== null) {
    out.isIcann = rulesMatch.isIcann;
    out.isPrivate = rulesMatch.isPrivate;
    out.publicSuffix = hostnameParts.slice(rulesMatch.index).join(".");
    return;
  }
  out.isIcann = false;
  out.isPrivate = false;
  out.publicSuffix = (_a = hostnameParts[hostnameParts.length - 1]) !== null && _a !== void 0 ? _a : null;
}

// node_modules/tldts/dist/es6/index.js
var RESULT = getEmptyResult();
function parse(url, options = {}) {
  return parseImpl(url, 5, suffixLookup, options, getEmptyResult());
}

// uBlock_EDITION_UBE_Stage3.js
var FEATURES_FULL = {
  "favicon_check": 3,
  "url_anchor": 4,
  "links_in_tags": 10,
  "request_sources_from_diff_url": 3,
  "sfh": 5,
  "iframe": 11,
  "suspicious_js": 11,
  "nlp_text": 1,
  "detect_auto_redirect": 3,
  "check_login_form_visibility": 1,
  "detect_right_click_block": 2
}

  function analyzeTagAttributes(tagObj, tagList, tagAttribute, domain, isLinksObj) {
    let validLinks = 0;
    for (let i = 0; i < tagList.length; i++) {
      const attributeContent = tagList[i].getAttribute(tagAttribute);
      if (!attributeContent) {
        continue;
      }
      validLinks++;
      const conDomain = getCleanDomain(attributeContent);
      if (conDomain && conDomain !== domain) {
        tagObj.externalCount += 1;
      }
      if (!isLinksObj) {
        tagObj.susWords += countSuspiciousWords(attributeContent);
      }
    }
    if (isLinksObj) {
      tagObj.total = validLinks;
    }
    tagObj.externalRatio = validLinks > 0 ? tagObj.externalCount / validLinks : 0;
  }
  function scanTagResources(baseDomain, doc) {
    const linksObj = { externalCount: 0, total: 0, externalRatio: 0 };
    const scriptsObj = { externalCount: 0, susWords: 0, externalRatio: 0 };
    const metasObj = { externalCount: 0, susWords: 0, externalRatio: 0 };
    analyzeTagAttributes(linksObj, doc.querySelectorAll("link"), "href", baseDomain, true);
    analyzeTagAttributes(scriptsObj, doc.querySelectorAll("script"), "src", baseDomain, false);
    analyzeTagAttributes(metasObj, doc.querySelectorAll("meta"), "content", baseDomain, false);
    const totalExternal = linksObj.externalCount + scriptsObj.externalCount + metasObj.externalCount;
    return {
      "External Metas": metasObj.externalCount,
      "External Metas Suspicious Words": metasObj.susWords,
      "External Metas Ratio": metasObj.externalRatio,
      "External Scripts": scriptsObj.externalCount,
      "External Scripts Suspicious Words": scriptsObj.susWords,
      "External Scripts Ratio": scriptsObj.externalRatio,
      "External Links": linksObj.externalCount,
      "External Links Ratio": linksObj.externalRatio,
      "Total Links": linksObj.total,
      "External Total": totalExternal
    };
  }
  function checkStyleAnomalies(tag) {
    if (!(tag instanceof Element)) {
      return false;
    }
    const style = window.getComputedStyle(tag);
    return style.display === "none" || style.visibility === "hidden" || style.opacity === "0" || tag.offsetWidth === 0 || tag.offsetHeight === 0;
  }
  function checkIfAd(src) {
    if (typeof src !== "string") {
      return false;
    }
    const keywords = ["ads", "analytics", "pixel", "tracker", "doubleclick"];
    return keywords.some((word) => src.toLowerCase().includes(word));
  }
  function extractIFrameFeatures(baseDomain, doc) {
    const counts = {
      src: 0,
      srcIFrameHidden: 0,
      IFrameSrcSize: 0,
      srcDifferentDomain: 0,
      srcNoSandbox: 0,
      srcdoc: 0,
      srcdocJS: 0,
      srcdocIFrameHidden: 0,
      srcdocSusWords: 0
    };
    const IFrames = doc.querySelectorAll("iframe");
    for (let i = 0; i < IFrames.length; i++) {
      try {
        const src = IFrames[i].getAttribute("src")?.trim().toLowerCase();
        if (src && !checkIfAd(src)) {
          counts.src++;
          if (checkStyleAnomalies(IFrames[i])) {
            counts.srcIFrameHidden++;
          }
          const srcDomain = getCleanDomain(src);
          if (srcDomain && srcDomain !== baseDomain) {
            counts.srcDifferentDomain++;
          }
          const width = IFrames[i].getAttribute("width")?.trim();
          const height = IFrames[i].getAttribute("height")?.trim();
          if (width && height && (width === "0" || height === "0")) {
            counts.IFrameSrcSize++;
          }
          if (!IFrames[i].hasAttribute("sandbox")) {
            counts.srcNoSandbox++;
          }
        }
      } catch (error) {
        console.log(`Failed to parse IFrame src: ${error}`);
      }
      try {
        const srcDoc = IFrames[i].getAttribute("srcdoc")?.trim().toLowerCase();
        if (srcDoc) {
          counts.srcdoc++;
          if (countSuspiciousWords(srcDoc) > 0) {
            counts.srcdocSusWords++;
          }
          if (checkStyleAnomalies(IFrames[i])) {
            counts.srcdocIFrameHidden++;
          }
          const jsRegex = /<script\b|javascript:/i;
          if (jsRegex.test(srcDoc)) {
            counts.srcdocJS++;
          }
        }
      } catch (error) {
        console.log(`Failed to parse IFrame srcdoc: ${error}`);
      }
    }
    const externalSrcRatio = counts.src > 0 ? counts.srcDifferentDomain / counts.src : 0;
    return {
      "IFrame src": counts.src,
      "IFrame src Hidden": counts.srcIFrameHidden,
      "IFrame src Size": counts.IFrameSrcSize,
      "IFrame src Different Domains": counts.srcDifferentDomain,
      "IFrame src No Sandbox": counts.srcNoSandbox,
      "IFrame External src Ratio": externalSrcRatio,
      "IFrame srcdoc": counts.srcdoc,
      "IFrame srcdoc Scripts": counts.srcdocJS,
      "IFrame srcdoc Hidden": counts.srcdocIFrameHidden,
      "IFrame srcdoc Suspicious Words": counts.srcdocSusWords,
      "IFrame Total": counts.src + counts.srcdoc
    };
  }
  function countSuspiciousWords(text) {
    if (typeof text !== "string") {
      return 0;
    }
    const suspiciousWordRegex = /(log[\s\-]?in|sign[\s\-]?in|auth|user(name)?|email|phone|account|credential|password|passcode|pin|security[\s\-]?code|credit[\s\-]?card|cvv|expiry|iban|bank)/gi;
    const matches = text.match(suspiciousWordRegex);
    return matches ? matches.length : 0;
  }
  function detectRightClickBlock(doc) {
    let suspiciousScriptCount = 0;
    let contextmenuTagsCount = doc.querySelectorAll("[oncontextmenu]").length;
    const inlineScripts = doc.querySelectorAll("script:not([src])");
    for (let i = 0; i < inlineScripts.length; i++) {
      const content = inlineScripts[i].textContent;
      if (!content) {
        continue;
      }
      if (/event\s*\.\s*button\s*==\s*2/i.test(content) || /contextmenu/i.test(content)) {
        suspiciousScriptCount++;
      }
    }
    return {
      "Right Click Scripts": suspiciousScriptCount,
      "Right Click Menu Tags": contextmenuTagsCount
    };
  }
  function detectAutoRedirect(baseDomain, doc) {
    const result = {
      "AR Meta Refresh": 0,
      "AR JS": 0,
      "AR Cross Domain": 0
    };
    const metaTags = doc.querySelectorAll("meta[http-equiv]");
    for (let i = 0; i < metaTags.length; i++) {
      const equiv = (metaTags[i].getAttribute("http-equiv") || "").trim().toLowerCase();
      if (equiv && equiv === "refresh") {
        result["AR Meta Refresh"] = 1;
        break;
      }
    }
    const htmlText = doc.documentElement.innerHTML;
    if (/(?:window\.)?location\.(?:href|replace)\s*=/i.test(htmlText)) {
      result["AR JS"] = 1;
    }
    const currentDomain = getCleanDomain(location.hostname);
    if (currentDomain !== baseDomain) {
      result["AR Cross Domain"] = 1;
    }
    return result;
  }
  function checkNLP(doc) {
    const text = doc.body.textContent.trim();
    const sensitiveFieldPattern = /log[\s\-]?in|sign[\s\-]?in|sign[\s\-]?on|register|auth(?:enticate|entication)?|user(?:name)?|e[\s\-]?mail|phone|mobile|account|acct|credential|pass(?:word|code)?|pin|security[\s\-]?code|2fa|otp|credit[\s\-]?card|card[\s\-]?number|cvv|cvc|expiry|exp[\s\-]?date|iban|bic|swift|bank|routing[\s\-]?number/gi;
    const matches = Array.from(text.matchAll(sensitiveFieldPattern));
    return { "NLP": matches.length };
  }
  function detectSuspiciousJS(baseDomain, doc) {
    const highRiskPatterns = [
      /eval\s*\(/i,
      /new\s+Function\s*\(/i,
      /document\.write\s*\(/i,
      /on(mouseover|error|click|submit)\s*=/i,
      /set(?:Timeout|Interval)\s*\(\s*['"]/i,
      /atob\s*\(/i,
      /unescape\s*\(/i,
      /String\.fromCharCode\s*\(/i
    ];
    const mediumRiskPatterns = [
      /(?:window|document)\.location(\.href)?\s*=/i,
      /innerHTML\s*=/i,
      /outerHTML\s*=/i,
      /onbeforeunload/i,
      /window\.open\s*\(/i,
      /history\.pushState\s*\(/i,
      /form\s+.*action\s*=.*login/i,
      /input\s+.*type\s*=\s*['"](password|email)['"]/i
    ];
    const lowRiskPatterns = [
      /navigator\.clipboard/i,
      /navigator\.sendBeacon\s*\(/i,
      /XMLHttpRequest/i,
      /fetch\s*\(/i,
      /new\s+WebSocket\s*\(/i,
      /postMessage\s*\(/i,
      /document\.cookie/i,
      /username\s*[:=]/i,
      /password\s*[:=]/i,
      /email\s*[:=]/i
    ];
    const knownScriptHosts = [
      "cdnjs.cloudflare.com",
      "cdn.jsdelivr.net",
      "ajax.googleapis.com",
      "fonts.googleapis.com",
      "fonts.gstatic.com",
      "stackpath.bootstrapcdn.com",
      "ajax.aspnetcdn.com",
      "maxcdn.bootstrapcdn.com",
      "code.jquery.com",
      "cdn.jsdelivr.net",
      "cdn.shopify.com",
      "cdn.wix.com",
      "unpkg.com",
      "polyfill.io",
      "bootstrapcdn.com",
      "gstatic.com",
      "google.com",
      "googleapis.com",
      "microsoft.com",
      "cloudflare.com",
      "cloudfront.net",
      "fbcdn.net",
      "facebook.com",
      "yahooapis.com",
      "notion.so",
      "vercel.app",
      "netlify.app",
      "res.cloudinary.com"
    ];
    let highRiskPatternsCount = 0;
    let mediumRiskPatternsCount = 0;
    let lowRiskPatternsCount = 0;
    let differentDomainsCount = 0;
    let onMouseOver = 0;
    const allScripts = Array.from(doc.scripts);
    const inlineScripts = allScripts.filter((script) => !script.hasAttribute("src"));
    const externalScripts = allScripts.filter((script) => script.hasAttribute("src"));
    for (let i = 0; i < inlineScripts.length; i++) {
      const content = inlineScripts[i].textContent;
      highRiskPatterns.forEach((pattern) => {
        if (pattern.test(content)) {
          highRiskPatternsCount++;
        }
      });
      mediumRiskPatterns.forEach((pattern) => {
        if (pattern.test(content)) {
          mediumRiskPatternsCount++;
        }
      });
      lowRiskPatterns.forEach((pattern) => {
        if (pattern.test(content)) {
          lowRiskPatternsCount++;
        }
      });
      if (/onmouseover/i.test(inlineScripts[i].textContent)) {
        onMouseOver++;
      }
    }
    const totalPatternsCount = lowRiskPatternsCount + mediumRiskPatternsCount + highRiskPatternsCount;
    for (let i = 0; i < externalScripts.length; i++) {
      const source = (externalScripts[i].getAttribute("src") || "").trim().toLowerCase();
      const sourceDomain = getCleanDomain(source);
      if (sourceDomain && sourceDomain !== baseDomain && !knownScriptHosts.includes(sourceDomain)) {
        differentDomainsCount++;
      }
    }
    const susJSBehaveRatio = externalScripts.length > 0 ? differentDomainsCount / externalScripts.length : 0;
    const riskPatternsRatio = inlineScripts.length > 0 ? totalPatternsCount / inlineScripts.length : 0;
    return {
      "JS Total": allScripts.length,
      "JS Inline": inlineScripts.length,
      "JS External": externalScripts.length,
      "JS High Risk Patterns": highRiskPatternsCount,
      "JS Medium Risk Patterns": mediumRiskPatternsCount,
      "JS Low Risk Patterns": lowRiskPatternsCount,
      "JS Different Domains": differentDomainsCount,
      "JS Behave Ratio": susJSBehaveRatio,
      "JS Risk Patterns Ratio": riskPatternsRatio,
      "JS OnMouseOver Scripts": onMouseOver,
      "JS OnMouseOver Tags": doc.querySelectorAll("[onmouseover]").length
    };
  }
  function extractSFHFeatures(baseDomain, doc) {
    const skipBlanks = /* @__PURE__ */ new Set(["about:blank", "#", ""]);
    const susWords = /* @__PURE__ */ new Set(["login", "signin", "sign-in", "sign in", "verify", "auth", "password", "2fa", "secure", "credentials"]);
    const forms = doc.forms;
    const formsLength = forms.length;
    let blankActions = 0;
    let differentDomains = 0;
    let typePasswords = 0;
    let suspiciousWordsCount = 0;
    for (let i = 0; i < formsLength; i++) {
      const action = (forms[i].getAttribute("action") || "").trim().toLowerCase();
      if (!action || skipBlanks.has(action)) {
        blankActions++;
      } else {
        const actionDomain = getCleanDomain(action);
        if (actionDomain && actionDomain !== baseDomain) {
          differentDomains++;
        }
      }
      const inputs = forms[i].querySelectorAll("input, select, textarea");
      for (let j = 0; j < inputs.length; j++) {
        const inputType = inputs[j].getAttribute("type");
        const inputName = inputs[j].getAttribute("name");
        if (inputType && inputType.toLowerCase() === "password") {
          typePasswords++;
        }
        if (inputName) {
          for (const word of susWords) {
            if (inputName.includes(word)) {
              suspiciousWordsCount++;
              break;
            }
          }
        }
      }
    }
    return {
      "SFH Total": formsLength,
      "SFH Blank Actions": blankActions,
      "SFH Different Domains": differentDomains,
      "SFH Passwords": typePasswords,
      "SFH Suspicious Words": suspiciousWordsCount
    };
  }
  function extractRequestURLFeatures(baseDomain, doc) {
    const resources = ["img", "source", "audio", "video", "embed", "iframe"].flatMap((tag) => Array.from(doc.querySelectorAll(`${tag}[src]`)));
    const totalResources = resources.length;
    let srcValDiffDomainCount = 0;
    for (let i = 0; i < totalResources; i++) {
      const srcVal = (resources[i].getAttribute("src") || "").trim().toLowerCase();
      const srcValDomain = getCleanDomain(srcVal);
      if (srcValDomain && srcValDomain !== baseDomain) {
        srcValDiffDomainCount++;
      }
    }
    const srcRatio = totalResources > 0 ? srcValDiffDomainCount / totalResources : 0;
    return {
      "Resources Total": totalResources,
      "Resources External": srcValDiffDomainCount,
      "Resources External Ratio": srcRatio
    };
  }
  function extractURLOfAnchor(baseDomain, doc) {
    const skipHrefs = /* @__PURE__ */ new Set([
      "#",
      "#!",
      "javascript:",
      "javascript:;",
      "javascript:void(0)",
      "javascript:void(0);",
      "javascript:void(1);"
    ]);
    const hrefs = doc.querySelectorAll("a[href]");
    const totalHrefs = hrefs.length;
    let anchorEmptyHrefCount = 0;
    let anchorDiffDomainCount = 0;
    for (let i = 0; i < totalHrefs; i++) {
      const link = (hrefs[i].getAttribute("href") || "").trim().toLowerCase();
      if (!link || skipHrefs.has(link)) {
        anchorEmptyHrefCount++;
        continue;
      }
      const hrefDomain = getCleanDomain(link);
      if (hrefDomain && hrefDomain !== baseDomain) {
        anchorDiffDomainCount++;
      }
    }
    const validAnchors = totalHrefs - anchorEmptyHrefCount;
    const anchorDiffRatio = validAnchors > 0 ? anchorDiffDomainCount / validAnchors : 0;
    return {
      "Anchor Tags": totalHrefs,
      "Anchor Empty Hrefs": anchorEmptyHrefCount,
      "Anchor Different Domains": anchorDiffDomainCount,
      "Anchor Different Domains Ratio": anchorDiffRatio
    };
  }
  function favicon(baseDomain, doc) {
    let faviconDifferentDomains = 0;
    let faviconInvalidTypes = 0;
    const links = doc.querySelectorAll("link");
    let hrefArray = [];
    for (let index = 0; index < links.length; index++) {
      const rel = links[index].getAttribute("rel")?.toLowerCase();
      const href = links[index].getAttribute("href");
      if (rel?.includes("icon") && href) {
        hrefArray.push(href);
      }
    }
    const hasIcon = hrefArray.length > 0 ? 1 : 0;
    hrefArray.forEach((href) => {
      if (!checkIconLinkEnd(href)) {
        faviconInvalidTypes += 1;
      }
      const faviconDomain = getCleanDomain(href);
      if (faviconDomain && faviconDomain !== baseDomain) {
        faviconDifferentDomains += 1;
      }
    });
    return {
      "favicon Present": hasIcon,
      "favicon Different Domains": faviconDifferentDomains,
      "favicon Invalid Type": faviconInvalidTypes
    };
  }
  function checkLoginFormVisibility(doc) {
    const forms = doc.querySelectorAll("form");
    let result = 0;
    for (let i = 0; i < forms.length; i++) {
      if (checkStyleAnomalies(forms[i])) {
        result++;
      }
    }
    return { "Hidden Login Forms": result };
  }
  function checkIconLinkEnd(hrefLink) {
    return /\.(ico|png|gif)([?#].*)?$/i.test(hrefLink);
  }
  function getCleanDomain(url) {
    const parsed = parse(url);
    return parsed.domain || null;
  }
  function getFeatureResults(baseDomain, feature, doc) {
    let featureResults = {};
    if (feature === "favicon_check") {
      featureResults = favicon(baseDomain, doc);
    } else if (feature === "url_anchor") {
      featureResults = extractURLOfAnchor(baseDomain, doc);
    } else if (feature === "links_in_tags") {
      featureResults = scanTagResources(baseDomain, doc);
    } else if (feature === "request_sources_from_diff_url") {
      featureResults = extractRequestURLFeatures(baseDomain, doc);
    } else if (feature === "sfh") {
      featureResults = extractSFHFeatures(baseDomain, doc);
    } else if (feature === "iframe") {
      featureResults = extractIFrameFeatures(baseDomain, doc);
    } else if (feature === "suspicious_js") {
      featureResults = detectSuspiciousJS(baseDomain, doc);
    } else if (feature === "nlp_text") {
      featureResults = checkNLP(doc);
    } else if (feature === "detect_auto_redirect") {
      featureResults = detectAutoRedirect(baseDomain, doc);
    } else if (feature === "check_login_form_visibility") {
      featureResults = checkLoginFormVisibility(doc);
    } else if (feature === "detect_right_click_block") {
      featureResults = detectRightClickBlock(doc);
    }
    return featureResults;
  }
  function getResults(doc, tabId) {
    const baseDomain = getCleanDomain(window.location.hostname);
    const results = {};
    for (const [feature, length] of Object.entries(FEATURES_FULL)) {
      try {
        const featureResults = getFeatureResults(baseDomain, feature, doc);
        const featureResultsLen = Object.keys(featureResults).length;
        if (featureResultsLen !== length) {
          console.error(`getFeatureResults for ${feature} failed due to incompatible lengths (Expected ${length}, Got ${featureResultsLen}`);
          continue;
        }
        Object.assign(results, featureResults);
      } catch (error) {
        console.error(`Failed to get feature results (${feature}) for Tab ${tabId}: ${error}`);
      }
    }
    return results;
  }
  function getFullHTML() {
    return new Promise((resolve) => {
      if (document.readyState === "complete") {
        resolve(document.documentElement.outerHTML);
      } else {
        window.addEventListener("load", () => {
          resolve(document.documentElement.outerHTML);
        }, { once: true });
      }
    });
  }
  async function processDOM(tabId) {
    let doc = null;
    try {
      const html = await getFullHTML();
      doc = new DOMParser().parseFromString(html, "text/html");
    } catch (error) {
      console.error(`Failed to parse DOM for Tab ${tabId}: ${error}`);
    }
    if (doc) {
      return getResults(doc, tabId);
    }
  }

  browser.runtime.sendMessage({
    what: 'contentScriptReady',
    source: 'ubeContentScript'
  });

  browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.source === 'ubeBackgroundScript' && request.what === 'checkHTML') {
      browser.runtime.sendMessage({
        what: 'startedProcessing',
        source: 'ubeContentScript',
        tabId: request.tabId,
        url: request.url
      });

      (async () => {
        try {
          const result = await processDOM(request.tabId);
          sendResponse({
            source: 'ubeContentScript',
            success: true,
            result: result
          });
        } catch (error) {
          sendResponse({
            source: 'ubeContentScript',
            success: false,
            error: error
          });
        }
      })();

      return true; // keep message channel open for async response
    }
  });
