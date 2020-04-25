var COLLECTOR_PRE_CODE = "AA"; //CMD head that phone receive collector
var PLATFORM_PRE_CODE = "BB"; //CMD head that phone send to collector
var END_CODE = "CC";
//CMD type begin
var RESET_CMD_CODE = "E0";
var CALIBRATE_CMD_CODE = "E1";
var CONFIRM_CAL_CMD_CODE = "E2";
var CHOOSE_CMD_CODE = "E3";
var UPLOCD_CMD_CODE = "E4";
var START_STOP_CMD_CODE = "E5";
var LOAD_CMD_CODE = "E6";
var SAVE_CALIBRATE_CMD_CODE = "E7";
var BATTERY_CMD_CODE = "E8";
var MAX_MEASURE_CMD_CODE = "E9";
//CMD type end

// 字符串转byte
function stringToBytes(str) {
  var strArray = new Uint8Array(str.length);
  for (var i = 0; i < str.length; i++) {
    strArray[i] = str.charCodeAt(i);
  }
  const array = new Uint8Array(strArray.length)
  strArray.forEach((item, index) => array[index] = item)
  return array.buffer;
}

// ArrayBuffer转16进制字符串示例
function ab2hext(buffer) {
  var hexArr = Array.prototype.map.call(
    new Uint8Array(buffer),
    function (bit) {
      return ('00' + bit.toString(16)).slice(-2)
    }
  )
  return hexArr.join('');
}

//16进制转字符串
function hexToString(str) {
  var trimedStr = str.trim();
  var rawStr =
    trimedStr.substr(0, 2).toLowerCase() === "0x" ?
    trimedStr.substr(2) :
    trimedStr;
  var len = rawStr.length;
  if (len % 2 !== 0) {
    // alert("Illegal Format ASCII Code!");
    return "";
  }
  var curCharCode;
  var resultStr = [];
  for (var i = 0; i < len; i = i + 2) {
    curCharCode = parseInt(rawStr.substr(i, 2), 16); // ASCII Code Value
    resultStr.push(String.fromCharCode(curCharCode));
  }
  return resultStr.join("");
}

//字符串转字节序列
function stringToByte(str) {
  var bytes = new Array();
  var len, c;
  len = str.length;
  for (var i = 0; i < len; i++) {
    c = str.charCodeAt(i);
    if (c >= 0x010000 && c <= 0x10FFFF) {
      bytes.push(((c >> 18) & 0x07) | 0xF0);
      bytes.push(((c >> 12) & 0x3F) | 0x80);
      bytes.push(((c >> 6) & 0x3F) | 0x80);
      bytes.push((c & 0x3F) | 0x80);
    } else if (c >= 0x000800 && c <= 0x00FFFF) {
      bytes.push(((c >> 12) & 0x0F) | 0xE0);
      bytes.push(((c >> 6) & 0x3F) | 0x80);
      bytes.push((c & 0x3F) | 0x80);
    } else if (c >= 0x000080 && c <= 0x0007FF) {
      bytes.push(((c >> 6) & 0x1F) | 0xC0);
      bytes.push((c & 0x3F) | 0x80);
    } else {
      bytes.push(c & 0xFF);
    }
  }
  return bytes;


}

//字节序列转ASCII码
//[0x24, 0x26, 0x28, 0x2A] ==> "$&C*"
function byteToString(arr) {
  if (typeof arr === 'string') {
    return arr;
  }
  var str = '',
    _arr = arr;
  for (var i = 0; i < _arr.length; i++) {
    var one = _arr[i].toString(2),
      v = one.match(/^1+?(?=0)/);
    if (v && one.length == 8) {
      var bytesLength = v[0].length;
      var store = _arr[i].toString(2).slice(7 - bytesLength);
      for (var st = 1; st < bytesLength; st++) {
        store += _arr[st + i].toString(2).slice(2);
      }
      str += String.fromCharCode(parseInt(store, 2));
      i += bytesLength - 1;
    } else {
      str += String.fromCharCode(_arr[i]);
    }
  }
  return str;
}

function string2HexString(s) {
  return ab2hext(stringToBytes(s));
}


function hex2Bytes(hexStr) {
  return stringToBytes(hexToString(hexStr));
}

//pre, cmdCode是16进制字串
//hex 只表示origin 是字符串还是16进制的字符串
function getChecksum(pre, cmdCode, origin, hex) {
  if (originData == null) {
    originData = "";
  }
  var check = 0;
  var item;
  var data;
  if (hex) {
    data = pre + cmdCode + origin;
  } else {
    data = pre + cmdCode + string2HexString(origin);
  }
  for (var i = 0; i < data.length; i = i + 2) {
    item = parseInt(data.substring(i, i + 1), 16);
    check ^= item;
  }
  return check;
}


//test OK. return hex str of check.
function getCheck(hexStr) {
  var check = 0;
  var item;
  for (var i = 0; i < hexStr.length; i = i + 2) {
    item = parseInt(hexStr.substring(i, i + 2), 16);
    check ^= item;
    // console.log("check: " + check);
  }
  return int2Hex(check);
}

function getCmdHex(cmdCode, originData, hex) {
  var hexData;
  if (hex) {
    hexData = originData;
  } else {
    hexData = string2HexString(originData);
  }

  var lengthS = int2Hex((cmdCode.length + hexData.length) / 2 + 1);
  var cmd = lengthS + cmdCode + hexData;
  var check = getCheck(cmd);
  cmd = COLLECTOR_PRE_CODE + cmd + check + END_CODE;
  return cmd;
}

function int2Hex(v) {
  var hex;
  if (v < 0x10) {
    hex = "0" + v.toString(16);
  } else {
    hex = v.toString(16);
  }
  return hex.toUpperCase();
}

//获取单位的索引
function getValueUnitIndex(str) {
  var index = 0;
  console.log("str: " + str);
  for (var i = 0; i < str.length; i++) {
    if (str[i] >= 'A') { //字母的高4为会大于4
      index = i;
      console.log("str[i] >= '4' , i: " + i);
      break;
    }
  }
  return index;
}

//删掉接收的字串中前面多余的0
function getStrWithoutFront0(str) {
  var index = 0;
  for (var i = 0; i < str.length; i++) {
    if (str[i] != '0') { //字母的高4为会大于4
      if (str[i] == '.') {
        index = i - 1;
      } else {
        index = i;
      }
      break;
    }
  }

  return str.substring(index, str.length);
}

function test() {
  var s = "12E4016368616E656C3120303030302E304E";
  var num = 100;
  var check = getCheck(s);
  // num = 100;
  // console.log("num: " + num.toString(16));
  // num = 255;
  // console.log("num: " + num.toString(16));
  console.log("s: " + s);
  console.log("check: " + check.toString(16));
  var cmd = getCmdHex("E4", "channel", false);
  console.log("cmd: " + cmd);
  var cmd = getCmdHex("E4", "016368616E656C3120303030302E304E", true);
  console.log("cmd: " + cmd);

}

/*微信app版本比较*/
function versionCompare(ver1, ver2) {
  var version1pre = parseFloat(ver1)
  var version2pre = parseFloat(ver2)
  var version1next = parseInt(ver1.replace(version1pre + ".", ""))
  var version2next = parseInt(ver2.replace(version2pre + ".", ""))
  if (version1pre > version2pre)
    return true
  else if (version1pre < version2pre)
    return false
  else {
    if (version1next > version2next)
      return true
    else
      return false
  }
}

module.exports = {
  COLLECTOR_PRE_CODE: COLLECTOR_PRE_CODE,
  PLATFORM_PRE_CODE: PLATFORM_PRE_CODE,
  UPLOCD_CMD_CODE: UPLOCD_CMD_CODE,
  BATTERY_CMD_CODE: BATTERY_CMD_CODE,
  MAX_MEASURE_CMD_CODE: MAX_MEASURE_CMD_CODE,
  RESET_CMD_CODE:RESET_CMD_CODE,

  test: test,
  stringToBytes: stringToBytes,
  ab2hext: ab2hext,
  hexToString: hexToString,
  string2HexString: string2HexString,
  hex2Bytes: hex2Bytes,
  getChecksum: getChecksum,
  getCheck: getCheck,
  getCmdHex: getCmdHex,
  getValueUnitIndex: getValueUnitIndex,
  getStrWithoutFront0: getStrWithoutFront0,
  versionCompare: versionCompare
}