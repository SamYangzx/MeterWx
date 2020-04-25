
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
    deviceId: that.data.deviceId
  })
  that.setData({
    connected: false,

  });
  wx.showToast({
    title: '连接已断开',
    icon: 'success'
  });
  setTimeout(function () {
    wx.navigateBack();
  }, 2000)
}

//获取蓝牙设备某个服务中的所有 characteristic（特征值）
function getBLEDeviceCharacteristics(_order) {
  var that = this;
  wx.getBLEDeviceCharacteristics({
    deviceId: that.data.deviceId,
    serviceId: that.data.serviceId,
    success: function (res) {
      for (let i = 0; i < res.characteristics.length; i++) {
        let item = res.characteristics[i]
        if (item.properties.read) { //该特征值是否支持 read 操作
          var log = that.data.textLog + "该特征值支持 read 操作:" + item.uuid + "\n";
          that.setData({
            textLog: log,
            readCharacteristicId: item.uuid
          });
        }
        if (item.properties.write) { //该特征值是否支持 write 操作
          var log = that.data.textLog + "该特征值支持 write 操作:" + item.uuid + "\n";
          that.setData({
            textLog: log,
            writeCharacteristicId: item.uuid,
            canWrite: true
          });

        }
        if (item.properties.notify || item.properties.indicate) { //该特征值是否支持 notify或indicate 操作
          var log = that.data.textLog + "该特征值支持 notify 操作:" + item.uuid + "\n";
          that.setData({
            textLog: log,
            notifyCharacteristicId: item.uuid,
          });
          that.notifyBLECharacteristicValueChange();
        }

      }

    }
  })
  // that.onBLECharacteristicValueChange();   //监听特征值变化
}

//启用低功耗蓝牙设备特征值变化时的 notify 功能，订阅特征值。
//注意：必须设备的特征值支持notify或者indicate才可以成功调用，具体参照 characteristic 的 properties 属性
 function notifyBLECharacteristicValueChange() {
  var that = this;
  wx.notifyBLECharacteristicValueChange({
    state: true, // 启用 notify 功能
    deviceId: that.data.deviceId,
    serviceId: that.data.serviceId,
    characteristicId: that.data.notifyCharacteristicId,
    success: function (res) {
      var log = that.data.textLog + "notify启动成功" + res.errMsg + "\n";
      that.setData({
        textLog: log,
      });
      that.onBLECharacteristicValueChange(); //监听特征值变化
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
    var resValue = utils.ab2hext(res.value); //16进制字符串
    var resValueStr = utils.hexToString(resValue);

    var log0 = that.data.textLog + "成功获取：" + resValueStr + "\n";
    console.log("receive: " + resValueStr);
    that.setData({
      textLog: log0,
   
    });

  });
}

//orderInput
 function orderInput(e) {
  this.setData({
    orderInputStr: e.detail.value
  })
}

//发送指令
 function sentOrder() {
  var that = this;
  var orderStr = that.data.orderInputStr; //指令
  let order = utils.stringToBytes(orderStr);
  that.writeBLECharacteristicValue(order);
}

//向低功耗蓝牙设备特征值中写入二进制数据。
//注意：必须设备的特征值支持write才可以成功调用，具体参照 characteristic 的 properties 属性
 function writeBLECharacteristicValue(order) {
  var that = this;
  let byteLength = order.byteLength;
  var log = that.data.textLog + "当前执行指令的字节长度:" + byteLength + "\n";
  that.setData({
    textLog: log,
  });

  wx.writeBLECharacteristicValue({
    deviceId: that.data.deviceId,
    serviceId: that.data.serviceId,
    characteristicId: that.data.writeCharacteristicId,
    // 这里的value是ArrayBuffer类型
    value: order.slice(0, 20),
    success: function (res) {
      if (byteLength > 20) {
        setTimeout(function () {
          // that.writeBLECharacteristicValue(order.slice(20, byteLength));
        }, 150);
      }
      var log = that.data.textLog + "写入成功：" + res.errMsg + "\n";
      that.setData({
        textLog: log,
      });
    },

    fail: function (res) {
      var log = that.data.textLog + "写入失败" + res.errMsg + "\n";
      that.setData({
        textLog: log,
      });
    }

  })
}

module.exports = {
  getBLEDeviceCharacteristics: getBLEDeviceCharacteristics
}
