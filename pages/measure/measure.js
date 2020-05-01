// pages/measure/measure.js
var app = getApp();
var utils = require("../../utils/util.js");
var bles = require("../../utils/ble.js");

var batteryStr = '电量 0%'
var measure = '0'
var unit = 'N'
var allLog = false;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    battery: batteryStr,
    measure: measure,
    unit: unit,
    multiArray: [
      ['力值', '长度'],
      ['N', 'kN', 'cN', 'mN', 'kgf', 'daN', 'Lbf', '']
    ],
    multiIndex: [0, 0],


    textLog: "",
    deviceId: "",
    name: "",
    allRes: "",
    serviceId: "",
    readCharacteristicId: "",
    writeCharacteristicId: "",
    notifyCharacteristicId: "",
    connected: true,
    canWrite: false,
    lastCmdLength: 0,
    wholeCmd16: ""
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;


  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    var that = this;
    if (wx.setKeepScreenOn) {
      wx.setKeepScreenOn({
        keepScreenOn: true,
        success: function (res) {
          //console.log('保持屏幕常亮')
        }
      })
    }

    that.test();
    var devid = app.globalData.deviceId;
    var devname = app.globalData.name;
    var devserviceid = app.globalData.serviceId;
    var log = "设备名=" + devname + "\n设备UUID=" + devid + "\n服务UUID=" + devserviceid +
      "\nconnected: " + app.globalData.connected + "\n";
    console.log('app.globalData.connected: ' + app.globalData.connected);
    this.setData({
      textLog: log,
      deviceId: devid,
      name: devname,
      serviceId: devserviceid
    });
    app.globalData.recCb = that.handledCmd;
    if (app.globalData.connected) {
      //获取特征值
      // that.getBLEDeviceCharacteristics();
      bles.getBLEDeviceCharacteristics();

    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  showBattery: function (e) {
    this.setData({
      batteryStr: e
    })
  },

  reset: function (e) {
    this.setData({
      measure: '0'
    })
    this.sendData(utils.RESET_CMD_CODE, "", true);
  },

  maxValue: function (e) {
    this.sendData(utils.MAX_MEASURE_CMD_CODE, "", true);
  },

  bindMultiPickerChange: function (e) {
    console.log('picker  ', e.detail.value)
    this.setData({
      multiIndex: e.detail.value
    })
    // this.sendData()
  },

  bindMultiPickerColumnChange: function (e) {
    console.log('修改的列为', e.detail.column, '，值为', e.detail.value);
    var data = {
      multiArray: this.data.multiArray,
      multiIndex: this.data.multiIndex
    };
    data.multiIndex[e.detail.column] = e.detail.value;
    switch (e.detail.column) {
      case 0:
        switch (data.multiIndex[0]) {
          case 0:
            data.multiArray[1] = ["N", "kN", "cN", "mN", "kgf", "daN", "Lbf", ""]
            break
          case 1:
            data.multiArray[1] = ["km", "m", "dm", "cm", "mm", "μm", "nm", "inch", "ft", "mm/s", "m/s", "km/h", "mm/min", ""]
            break

        }
        data.multiIndex[1] = 0
        break;

    }
    this.setData(data);
  },

  //返回蓝牙是否正处于链接状态
  onBLEConnectionStateChange: function (onFailCallback) {
    wx.onBLEConnectionStateChange(function (res) {
      // 该方法回调中可以用于处理连接意外断开等异常情况
      console.log(`device ${res.deviceId} state has changed, connected: ${res.connected}`);
      return res.connected;
    });
  },
  //断开与低功耗蓝牙设备的连接
  closeBLEConnection: function () {
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
  },
  //获取蓝牙设备某个服务中的所有 characteristic（特征值）
  getBLEDeviceCharacteristics: function (order) {
    var that = this;
    console.log('that.data.deviceId: ' + that.data.deviceId + "\n that.data.serviceId: " + that.data.serviceId);
    wx.getBLEDeviceCharacteristics({
      deviceId: that.data.deviceId,
      serviceId: that.data.serviceId,
      success: function (res) {
        console.log('invoke getBLEDeviceCharacteristics success');
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

  },
  //启用低功耗蓝牙设备特征值变化时的 notify 功能，订阅特征值。
  //注意：必须设备的特征值支持notify或者indicate才可以成功调用，具体参照 characteristic 的 properties 属性
  notifyBLECharacteristicValueChange: function () {
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
      fail: function (res) {
        wx.showToast({
          title: 'notify启动失败',
          mask: true
        });
        setTimeout(function () {
          wx.hideToast();
        }, 2000)
      }

    })

  },
  //监听低功耗蓝牙设备的特征值变化。必须先启用notify接口才能接收到设备推送的notification。
  onBLECharacteristicValueChange: function () {
    var that = this;
    wx.onBLECharacteristicValueChange(function (res) {
      var resValue16 = utils.ab2hext(res.value); //16进制字符串
      var resValueStr = utils.hexToString(resValue16);
      console.log("16str: " + resValue16);
      // var log0 = that.data.textLog + "Rec：" + resValueStr + "\n";
      var log0 = "Rec：" + resValueStr + "\n";
      that.setData({
        textLog: log0,
      });
      console.log("that.data.lastCmdLength " + that.data.lastCmdLength);

      var needHandled = true;
      //判断命令是否需要拼接
      if (that.data.lastCmdLength > 0) {
        that.setData({
          wholeCmd16: that.data.wholeCmd16 + resValue16,
          lastCmdLength: that.data.lastCmdLength - 20,
        });
      } else {
        var head = resValue16.substring(0, 2);
        if (utils.COLLECTOR_PRE_CODE === head.toUpperCase()) {
          //length > 18 后，命令会分2次接收, length是后面的命令码、数据、校验码+结束码的总长度
          var lengthInCmd = parseInt(resValue16.substring(2, 4), 16) + 1;
          console.log("lengthInCmd " + lengthInCmd);
          that.setData({
            wholeCmd16: resValue16,
          });
          that.setData({
            lastCmdLength: lengthInCmd > 18 ? lengthInCmd - 18 : 0,
          });

        } else {
          needHandled = false;
        }
      }

      if (!needHandled) {
        return;
      }

      //真正处理完整的命令, 用了原生的数组和转化后的字符串来处理。
      if (that.data.lastCmdLength <= 0) {
        // var wholeCmd16 = utils.ab2hext(that.data.wholeCmd);
        console.log("that.data.wholeCmd16: " + that.data.wholeCmd16);
        var _wholeCmd16 = that.data.wholeCmd16;
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
              that.setData({
                measure: value,
              });
              break;
            case utils.BATTERY_CMD_CODE:
              var value = parseInt(_wholeCmd16.substring(6, 7), 10);
              that.setData({
                // batteryStr = value * 25
              });
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
  },
  //orderInput
  orderInput: function (e) {
    this.setData({
      orderInputStr: e.detail.value
    })
  },

  //发送指令
  sentOrder: function () {
    var that = this;
    var orderStr = that.data.orderInputStr; //指令
    let order = utils.stringToBytes(orderStr);
    that.writeBLECharacteristicValue(order);
  },

  //发送字符串
  sendData: function (cmdCode, origin, hex) {
    var that = this;
    var data = hex ? utils.PLATFORM_PRE_CODE + cmdCode + origin : utils.COLLECTOR_PRE_CODE + cmdCode + utils.string2HexString(origin);
    let order = utils.hex2Bytes(data);
    that.writeBLECharacteristicValue(order);
  },

  //向低功耗蓝牙设备特征值中写入二进制数据。
  //注意：必须设备的特征值支持write才可以成功调用，具体参照 characteristic 的 properties 属性
  writeBLECharacteristicValue: function (order) {
    var that = this;
    let byteLength = order.byteLength;
    var log = that.data.textLog + "当前执行指令的字节长度:" + byteLength + "\n";
    that.setData({
      textLog: log,
    });
    if (!app.globalData.connected) {
      return;
    }
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
  },

  test: function () {
    utils.test();
    console.log("-----------");

  },

  handledCmd: function (data) {
    var that = this;
    var _wholeCmd16 = data;
    console.log("wholeCmd16: " + _wholeCmd16);
    var wholeCmd16Length = _wholeCmd16.length;
    var head = _wholeCmd16.substring(0, 2);
    var lengthInCmd = parseInt(_wholeCmd16.substring(2, 4), 16);
    var type = _wholeCmd16.substring(4, 6);
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
        that.setData({
          measure: value,
        });
        break;
      case utils.BATTERY_CMD_CODE:
        var value = parseInt(_wholeCmd16.substring(6, 7), 10);
        that.setData({
          // batteryStr = value * 25
        });
        break;

      default:
        console.log("default");
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})