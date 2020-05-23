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
const BATTERY_COLOR = '#1aad19'
const LINE_WIDTH = 2
const LEFT_BATTERY_HEIGHT = BATTERY_HEIGHT - BATTERY_HEAD_HEIGHT - LINE_WIDTH * 2
const BATTERY_GRIDS = 3 //battery 
const RADIS = 3

const MAX_VALUE = "峰值"
const CURRENT_VALUE = "实时值"

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

    isMaxMode: false,
    maxOrCurrentValue: MAX_VALUE,
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
    this.roundRectHead(ctx, LINE_WIDTH + BATTERY_PADDING_WIDTH, 0, BATTERY_HEAD_WIDTH, BATTERY_HEAD_HEIGHT, RADIS, true, GREY_COLOR)
    this.roundRect(ctx, LINE_WIDTH, BATTERY_HEAD_HEIGHT, BATTERY_WIDTH, BATTERY_HEIGHT - BATTERY_HEAD_HEIGHT, RADIS, false, GREY_COLOR)

    var battery = 0;
    if (value > BATTERY_GRIDS) {
      battery = LEFT_BATTERY_HEIGHT;
    } else {
      // battery = (value * LEFT_BATTERY_HEIGHT / BATTERY_GRIDS).toFixed(0);//不行
      battery = parseInt(value * LEFT_BATTERY_HEIGHT / BATTERY_GRIDS);
    }
    var startHeight = BATTERY_HEIGHT - battery - LINE_WIDTH;
    // console.log("battery: " + battery + ",  startHeight: " + startHeight)
    this.roundRect(ctx, LINE_WIDTH * 2, startHeight, (BATTERY_WIDTH - LINE_WIDTH * 2), battery, RADIS, true, BATTERY_COLOR)
    ctx.draw()

  },


  /**
   * 仅绘制左上角，右上角
   * @param {*} ctx 
   * @param {*} x 
   * @param {*} y 
   * @param {*} w 
   * @param {*} h 
   * @param {*} r 
   * @param {*} fill 
   * @param {*} color 
   */
  roundRectHead: function (ctx, x, y, w, h, r, fill, color) {
    // 开始绘制
    ctx.beginPath()
    // 因为边缘描边存在锯齿，最好指定使用 transparent 填充
    // 这里是使用 fill 还是 stroke都可以，二选一即可
    if (fill) {
      ctx.setFillStyle(color)
    } else {
      ctx.setStrokeStyle(color)
    }
    // 左上角
    ctx.arc(x + r, y + r, r, Math.PI, Math.PI * 1.5)

    // border-top
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)

    // 右上角
    ctx.arc(x + w - r, y + r, r, Math.PI * 1.5, Math.PI * 2)

    // border-right
    ctx.lineTo(x + w, y + h)

    // border-bottom
    ctx.lineTo(x, y + h)

    // border-left
    ctx.lineTo(x, y + r)

    // 这里是使用 fill 还是 stroke都可以，二选一即可，但是需要与上面对应
    if (fill) {
      ctx.fill()
    } else {
      ctx.stroke()
    }
    ctx.closePath()

  },

  /**
   * 绘制圆角矩形
   * @param {*} ctx 
   * @param {*} x 
   * @param {*} y 
   * @param {*} w 
   * @param {*} h 
   * @param {*} r 
   * @param {*} fill 
   * @param {*} color 
   */
  roundRect: function (ctx, x, y, w, h, r, fill, color) {
    if (w == 0 || h == 0) {
      return
    }
    if (w < 2 * r) {
      r = w / 2;
    }
    if (h < 2 * r) {
      r = h / 2;
    }
    // 开始绘制
    ctx.beginPath()
    // 因为边缘描边存在锯齿，最好指定使用 transparent 填充
    // 这里是使用 fill 还是 stroke都可以，二选一即可
    if (fill) {
      ctx.setFillStyle(color)
    } else {
      ctx.setStrokeStyle(color)
    }
    // 左上角
    ctx.arc(x + r, y + r, r, Math.PI, Math.PI * 1.5)

    // border-top
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)

    // 右上角
    ctx.arc(x + w - r, y + r, r, Math.PI * 1.5, Math.PI * 2)

    // border-right
    ctx.lineTo(x + w, y + h - r)

    // 右下角
    ctx.arc(x + w - r, y + h - r, r, 0, Math.PI * 0.5)

    // border-bottom
    ctx.lineTo(x + r, y + h)
    // 左下角
    ctx.arc(x + r, y + h - r, r, Math.PI * 0.5, Math.PI)

    // border-left
    ctx.lineTo(x, y + r)

    // 这里是使用 fill 还是 stroke都可以，二选一即可，但是需要与上面对应
    if (fill) {
      ctx.fill()
    } else {
      ctx.stroke()
    }
    ctx.closePath()
    // 剪切
    // ctx.clip()
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
        isMaxMode: false,
        maxOrCurrentValue: MAX_VALUE,
      })
    } else {
      console.log("isMaxMode false!")
      bles.sendData(utils.MAX_MEASURE_CMD_CODE, "01", true);
      this.setData({
        maxOrCurrentValue: CURRENT_VALUE,
        isMaxMode: true
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