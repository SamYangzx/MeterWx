// pages/calibrate/calibrate.js
var app = getApp();
var utils = require("../../utils/util.js");
var bles = require("../../utils/ble.js");

var measure = '0 N'
Page({

  /**
   * 页面的初始数据
   */
  data: {

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

  reset: function (e) {
    this.setData({
      measure: '0'
    })
    bles.sendData(utils.RESET_CMD_CODE, "", true);
  },

  confirm: function (e) {
    this.setData({
      measure: '100'
    })
    // bles.setData(utils.CONFIRM_CAL_CMD_CODE, );
  },

  save: function (e) {
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