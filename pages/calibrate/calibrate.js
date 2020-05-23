// pages/calibrate/calibrate.js
var app = getApp();
var utils = require("../../utils/util.js");
var bles = require("../../utils/ble.js");

const SENT_COLOR = "#888888"
const SELECT_COLOR = "#000000"

var measure = '0'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    calibratePoints: [{
      id: 0,
      value: "",
      color: SELECT_COLOR,
      hide: false
    }],
    whichIndex: 0,
    lastIndex: 0,

    measure: measure,
    unit: app.globalData.unit,
    currentStr: "",
    showResetDlg: false,
    showSaveDlg: false,
    buttons: [{
      text: '取消'
    }, {
      text: '确定'
    }],

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

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
    that.setData({
      unit: app.globalData.unit,
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

  bindKeyInput: function (e) {
    var that = this;
    that.data.currentStr = e.detail.value
    console.log("input: " + that.data.currentStr);
    that.data.calibratePoints[this.data.whichIndex].value = that.data.currentStr
    that.setData({
      calibratePoints: this.data.calibratePoints,
    })
  },

  bindFocus: function (event) {
    var that = this;
    var index = this.data.whichIndex;
    console.log("bindFocus.index: " + index);

    that.data.calibratePoints[index].color = SELECT_COLOR;
    that.setData({
      calibratePoints: this.data.calibratePoints,
      lastIndex: index,
      currentStr: that.data.calibratePoints[index].value,
    });
    console.log("bindFocus.currentStr: " + that.data.currentStr)

  },

  bindBlur: function (event) {
    var that = this;
    var index = this.data.whichIndex;
    console.log("bindBlur.index: " + index);
    that.data.calibratePoints[this.data.lastIndex].value = that.data.currentStr

  },

  whichSelected: function (event) {
    this.setData({
      whichIndex: event.currentTarget.id
    })
    console.log("whichSelected.whichInput: " + this.data.whichIndex);
  },

  addCalibratePoint: function () {
    //添加行时，index比实际值大1
    var index = parseInt(this.data.whichIndex, 10)
    this.setData({
      whichIndex: index + 1
    })
    console.log("addCalibratePoint whichInput: " + this.data.whichIndex)

    var that = this;
    var length = that.data.calibratePoints.length;
    if (length > 0) {
      that.data.calibratePoints[length - 1].hide = true;
    } else {
      console.log("error! Length is wrong!");
    }
    var obj = [{
      id: length,
      value: "",
      hide: false
    }];

    this.data.calibratePoints = that.data.calibratePoints.concat(obj);
    this.setData({
      calibratePoints: this.data.calibratePoints
    });

    // bles.sendData(utils.CALIBRATE_CMD_CODE, that.data.currentStr, false);
    that.data.currentStr = "";

  },

  reset: function (e) {
    this.setData({
      showResetDlg: true,
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

  confirm: function (e) {
    var that = this;
    that.data.calibratePoints[this.data.whichIndex].color = SENT_COLOR;
    that.setData({
      calibratePoints: that.data.calibratePoints
    })
    var valueUnit = this.data.currentStr + app.globalData.unit;
    bles.sendData(utils.CONFIRM_CAL_CMD_CODE, valueUnit, false);
  },

  save: function (e) {
    this.setData({
      showSaveDlg: true,
    })
  },

  realSave(e) {
    this.setData({
      showSaveDlg: false,
    })
    bles.sendData(utils.SAVE_CALIBRATE_CMD_CODE, "", true);
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