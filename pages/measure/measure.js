// pages/measure/measure.js
var app = getApp();
var utils = require("../../utils/util.js");
var bles = require("../../utils/ble.js");

var measure = '0'
var unit = ''

const BATTERY_WIDTH = 24
const BATTERY_PADDING_WIDTH = 6
const BATTERY_HEAD_WIDTH = BATTERY_WIDTH - BATTERY_PADDING_WIDTH * 2
const BATTERY_HEIGHT = 40
const BATTERY_HEAD_HEIGHT = 6
const GREY_COLOR = '#9C9C9C'
const LINE_WIDTH = 2
const LEFT_BATTERY_HEIGHT = BATTERY_HEIGHT - BATTERY_HEAD_HEIGHT - LINE_WIDTH * 2
const BATTERY_GRIDS = 3 //battery 

var allLog = false;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    battery: 0,
    measure: measure,
    unit: unit,
    multiArray: [
      ['力值', '长度'],
      ['N', 'kN', 'cN', 'mN', 'kgf', 'daN', 'Lbf', '']
    ],
    multiIndex: [0, 0],
    actualIndex: [0, 0],
    actualArray: [
      ['力值', '长度'],
      ['N', 'kN', 'cN', 'mN', 'kgf', 'daN', 'Lbf', '']
    ],

    dialogShow: false,
    showResetDlg: false,
    buttons: [{
      text: '取消'
    }, {
      text: '确定'
    }],

    isMaxMode: "false",
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


  },

  drawBattery: function (value) {
    const ctx = wx.createCanvasContext('canvas')
    ctx.setLineWidth(LINE_WIDTH)
    ctx.setFillStyle(GREY_COLOR)
    ctx.fillRect(LINE_WIDTH + BATTERY_PADDING_WIDTH, 0, BATTERY_HEAD_WIDTH, BATTERY_HEAD_HEIGHT)

    ctx.setStrokeStyle(GREY_COLOR)
    ctx.strokeRect(LINE_WIDTH, BATTERY_HEAD_HEIGHT, BATTERY_WIDTH, BATTERY_HEIGHT - BATTERY_HEAD_HEIGHT)
    ctx.setFillStyle('#1aad19')

    if (value > BATTERY_GRIDS) {
      battery = LEFT_BATTERY_HEIGHT;
    } else {
      var battery = (value * LEFT_BATTERY_HEIGHT / BATTERY_GRIDS).toFixed(0);
    }
    var startHeight = BATTERY_HEIGHT - battery - LINE_WIDTH;
    // if (startHeight <= BATTERY_HEAD_HEIGHT) {
    //   startHeight = BATTERY_HEAD_HEIGHT + LINE_WIDTH;
    // } else if (startHeight >= BATTERY_HEIGHT) {
    //   startHeight = startHeight - LINE_WIDTH;
    // }
    ctx.fillRect(LINE_WIDTH * 2, startHeight, (BATTERY_WIDTH - LINE_WIDTH * 2), battery)
    ctx.draw()
  },


  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    var that = this;
    if (!app.globalData.connected) {
      this.setData({
        dialogShow: true
      })
    }
    this.drawBattery(that.data.battery);

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
    if (this.data.dialogShow) {
      this.setData({
        dialogShow: false,
      })
    }

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

  tapConnectButton(e) {
    console.log("index: " + e.detail.index + ", item: " + e.detail.item);
    this.setData({
      dialogShow: false,
    })

    if (e.detail.index == "1") {

      wx.navigateTo({
        url: '../scan/scan',
        success: function (res) {
          // success
        },
        fail: function () {
          // fail
        },

        complete: function () {
          // complete
        }
      });
    }
  },

  showBattery: function (e) {
    this.setData({
      batteryStr: e
    })
  },

  reset: function (e) {
    this.setData({
      showResetDlg: true
    })
  },

  realReset(e) {
    this.setData({
      showResetDlg: false,
      measure: '0'
    })
    app.globalData.textLog = "";
    bles.sendData(utils.RESET_CMD_CODE, "", true);
  },

  maxValue: function (e) {
    var that = this
    if (that.data.isMaxMode) {
      console.log("isMaxMode true!")
      bles.sendData(utils.MAX_MEASURE_CMD_CODE, "00", true);
      this.setData({
        isMaxMode: "false"
      })
    } else {
      console.log("isMaxMode false!")
      bles.sendData(utils.MAX_MEASURE_CMD_CODE, "01", true);
      this.setData({
        isMaxMode: "true"
      })
    }
  },

  bindMultiPickerChange: function (e) {
    var that = this;
    console.log('picker  ', e.detail.value)
    var data = {
      multiArray: this.data.multiArray
    };
    switch (e.detail.value[0]) {
      case 0:
        data.multiArray[1] = ["N", "kN", "cN", "mN", "kgf", "daN", "Lbf", ""]
        break
      case 1:
        data.multiArray[1] = ["km", "m", "dm", "cm", "mm", "μm", "nm", "inch", "ft", "mm/s", "m/s", "km/h", "mm/min", ""]
        break
    }

    app.globalData.unit = data.multiArray[1][e.detail.value[1]];
    this.setData({
      // unit: app.globalData.unit,
      actualArray: data.multiArray,
      actualIndex: e.detail.value
    })
    bles.sendData(utils.CALIBRATE_CMD_CODE, app.globalData.unit, false);
  },

  bindMultiPickerColumnChange: function (e) {
    // console.log('修改的列为', e.detail.column, '，值为', e.detail.value);
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

  bindPickerTap: function (e) {
    this.setData({
      multiIndex: this.data.actualIndex
    })
  },

  test: function () {
    utils.test();
    console.log("-----------");

  },

  handledCmd: function (data) {
    var that = this;
    var _wholeCmd16 = data;
    that.setData({
        textLog: app.globalData.textLog
      }),
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
        // var index = utils.getValueUnitIndex(valueUnitS);
        // var value = utils.getStrWithoutFront0(valueUnitS.substring(0, index));
        var value = valueUnitS;
        console.log("value" + value);
        if (value == null) {
          console.error("value is null");
          break;
        }
        that.setData({
          measure: that.data.isMaxMode ? "MAX: " + value : value,
        });
        break;
      case utils.BATTERY_CMD_CODE:
        var value = parseInt(_wholeCmd16.substring(6, 8), 10);
        that.setData({
          battery: value
        });
        that.drawBattery(that.data.battery);
        break;
      case utils.MAX_MEASURE_CMD_CODE:
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