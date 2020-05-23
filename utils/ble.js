var app = getApp();
var utils = require("../utils/util.js");


//返回蓝牙是否正处于链接状态
function onBLEConnectionStateChange(_onFailCallback) {
  wx.onBLEConnectionStateChange(function (res) {
    // 该方法回调中可以用于处理连接意外断开等异常情况
    console.log(`device ${res.deviceId} state has changed, connected: ${res.connected}`);
    return res.connected;
  });
}

//断开与低功耗蓝牙设备的连接
function closeBLEConnection() {
  var that = this;
  wx.closeBLEConnection({
    deviceId: app.globalData.deviceId
  })
  app.globalData.connected = false;

  wx.showToast({
    title: '连接已断开',
    icon: 'success'
  });
  setTimeout(function () {
    wx.navigateBack();
  }, 2000)
}

//获取蓝牙设备某个服务中的所有 characteristic（特征值）
function getBLEDeviceCharacteristics() {
  wx.getBLEDeviceCharacteristics({
    deviceId: app.globalData.deviceId,
    serviceId: app.globalData.serviceId,
    success: function (res) {
      for (let i = 0; i < res.characteristics.length; i++) {
        let item = res.characteristics[i]
        if (item.properties.read) { //该特征值是否支持 read 操作    
          app.globalData.textLog = app.globalData.textLog + "Characteristic support read: " + item.uuid + "\n";
          app.globalData.readCharacteristicId = item.uuid;
        }
        if (item.properties.write) { //该特征值是否支持 write 操作         
          app.globalData.textLog = app.globalData.textLog + "Characteristic support write: " + item.uuid + "\n";
          app.globalData.writeCharacteristicId = item.uuid;
          app.globalData.canWrite = true;
        }
        if (item.properties.notify || item.properties.indicate) { //该特征值是否支持 notify或indicate 操作
          app.globalData.textLog = app.globalData.textLog + "Characteristic notify write: " + item.uuid + "\n";
          app.globalData.notifyCharacteristicId = item.uuid;
          notifyBLECharacteristicValueChange();
        }

      }

    }
  })

}

//启用低功耗蓝牙设备特征值变化时的 notify 功能，订阅特征值。
//注意：必须设备的特征值支持notify或者indicate才可以成功调用，具体参照 characteristic 的 properties 属性
function notifyBLECharacteristicValueChange() {
  wx.notifyBLECharacteristicValueChange({
    state: true, // 启用 notify 功能
    deviceId: app.globalData.deviceId,
    serviceId: app.globalData.serviceId,
    characteristicId: app.globalData.notifyCharacteristicId,
    success: function (res) {
      app.globalData.textLog = app.globalData.textLog + "notify启动成功" + res.errMsg + "\n";
      onBLECharacteristicValueChange(); //监听特征值变化
    },
    fail: function (_res) {
      wx.showToast({
        title: 'notify启动失败',
        mask: true
      });
      setTimeout(function () {
        wx.hideToast();
      }, 2000)
    }

  })

}

//监听BLE数据，监听低功耗蓝牙设备的特征值变化。必须先启用notify接口才能接收到设备推送的notification。
function onBLECharacteristicValueChange() {
  var that = this;
  wx.onBLECharacteristicValueChange(function (res) {
    var resValue16 = utils.ab2hext(res.value); //16进制字符串
    var resValueStr = utils.hexToString(resValue16);
    console.log("receive: " + resValue16);

    var needHandled = true;
    //判断命令是否需要拼接
    if (app.globalData.lastCmdLength > 0) {
      app.globalData.wholeCmd16 += resValue16;
      app.globalData.lastCmdLength = app.globalData.lastCmdLength - 20;
    } else {
      var head = resValue16.substring(0, 2);
      if (utils.COLLECTOR_PRE_CODE === head.toUpperCase()) {
        //length > 18 后，命令会分2次接收, length是后面的命令码、数据、校验码+结束码的总长度
        var lengthInCmd = parseInt(resValue16.substring(2, 4), 16) + 1;
        console.log("lengthInCmd " + lengthInCmd);
        app.globalData.wholeCmd16 = resValue16;
        app.globalData.lastCmdLength = lengthInCmd > 18 ? lengthInCmd - 18 : 0;

      } else {
        needHandled = false;
      }
    }

    if (!needHandled) {
      return;
    }

    //真正处理完整的命令, 用了原生的数组和转化后的字符串来处理。
    if (app.globalData.lastCmdLength <= 0) {
      var _wholeCmd16 = app.globalData.wholeCmd16;
      console.log("wholeCmd16: " + _wholeCmd16);
      var wholeCmd16Length = _wholeCmd16.length;
      var head = _wholeCmd16.substring(0, 2);
      var lengthInCmd = parseInt(_wholeCmd16.substring(2, 4), 16);
      var type = _wholeCmd16.substring(4, 6);
      var checkContent = _wholeCmd16.substring(2, wholeCmd16Length - 2);
      var check = 0;
      for (var i = 0; i < checkContent.length; i = i + 2) {
        var ii = parseInt(checkContent.substring(i, i + 1), 16);
        check ^= ii;
      }
      console.log("check: " + check);
      if (check === 0) {
        typeof app.globalData.recCb == "function" && app.globalData.recCb(app.globalData.wholeCmd16)
        app.globalData.textLog = app.globalData.textLog + "Rec: " + app.globalData.wholeCmd16 + "\n";
        console.log("cmd type: " + type);
        switch (type.toUpperCase()) {
          case utils.UPLOCD_CMD_CODE:
            //不要前面的channel部分
            var valueUnit16 = _wholeCmd16.substring(24, wholeCmd16Length - 4);
            var valueUnitS = utils.hexToString(valueUnit16);
            console.log("valueUnit16：" + valueUnit16);
            console.log("valueUnitS" + valueUnitS);
            var index = utils.getValueUnitIndex(valueUnitS);
            var value = utils.getStrWithoutFront0(valueUnitS.substring(0, index));
            console.log("value" + value);
            if (value == null) {
              console.error("value is null");
              break;
            }
            // that.setData({
            //   measure: value,
            // });
            break;
          case utils.BATTERY_CMD_CODE:
            var value = parseInt(_wholeCmd16.substring(6, 7), 10);

            break;

          default:
            console.log("default");
        }

      } else {
        console.log("check error!!");
        sendData(utils.CHECK_ERROR_CMD_CODE, "", true);
      }
    }

  });
}


//向低功耗蓝牙设备特征值中写入二进制数据。
//注意：必须设备的特征值支持write才可以成功调用，具体参照 characteristic 的 properties 属性
function writeBLECharacteristicValue(order) {
  if (!app.globalData.connected) {
    console.log("No devices connected!!");
    return;
  }
  var that = this;
  let byteLength = order.byteLength;

  wx.writeBLECharacteristicValue({
    deviceId: app.globalData.deviceId,
    serviceId: app.globalData.serviceId,
    characteristicId: app.globalData.writeCharacteristicId,
    // 这里的value是ArrayBuffer类型
    value: order.slice(0, 20),
    success: function (res) {
      if (byteLength > 20) {
        setTimeout(function () {
          //writeBLECharacteristicValue(order.slice(20, byteLength));
        }, 150);
      }
      app.globalData.textLog = app.globalData.textLog + "写入成功：" + res.errMsg + "\n";
    },

    fail: function (res) {
      app.globalData.textLog = app.globalData.textLog + "写入失败" + res.errMsg + "\n";
    }

  })
}

//发送字符串
function sendData(cmdCode, origin, hex) {
  // var data = hex ? utils.PLATFORM_PRE_CODE + cmdCode + origin : utils.COLLECTOR_PRE_CODE + cmdCode + utils.string2HexString(origin);
  var data = utils.getCmdHex(cmdCode, origin, hex);
  console.log("send hex data: " + data);
  console.log("send origin data: " + utils.hexToString(data));
  app.globalData.textLog = app.globalData.textLog + "Send: " + data + "\n";
  let order = utils.hex2Bytes(data);
  writeBLECharacteristicValue(order);
}

module.exports = {
  getBLEDeviceCharacteristics: getBLEDeviceCharacteristics,
  sendData: sendData
}