// pages/show/show.js
Page({
  data: {
    kinds: {},
    canvasHeight: 0, // 画布高度
    cvs: null,
    cachePath: '', // 下载在本地的图片路径
    textArr: [], // 将寄语分行
    canvasHalfWidth: 175, // 画布中线
    textOffset: {
      x: 0,
      y: 0
    }, // 文字的偏移量（手指位置拖动在此基础上修改）
    textStatus: false,
    textHeight: 0, // 画布中文字的高度
    fingerPosition: {
      x: 0,
      y: 0
    }, // 手指移动之前的位置
    textHalfWidth: 135, // 画布绘制字体的宽度的一半(270位最小宽度)
    flag: true,
    textBlockHeight: 0, // 图片上文字高度
    imageRes: []
  },
  onLoad: function(options) {
    this.setData({
      cvs: wx.createCanvasContext('cvs') // 创建画布
    })
    wx.getStorage({ // 获取存在缓存的信息
      key: 'kinds',
      success: (res) => {
        this.setData({
          kinds: res.data
        })
        wx.showLoading({
          title: '加载中',
        })
        Promise.all([this.getScreenSize(), this.getImgSize(), this.imgDownPromise()])
          .then(res => {
            const canvasHalfWidth = Math.floor(res[0].screenWidth * 0.94 / 2);
            const canvasHalfHeight = Math.floor(res[1].height * canvasHalfWidth / res[1].width);
            const canvasHalfSize = {
              width: canvasHalfWidth,
              height: canvasHalfHeight
            }
            let perLineCount = 0;
            const ctx = this.data.cvs; // 保存画布引用
            ctx.setFontSize(this.data.kinds.sizeNum);
            let perTextWidth = ctx.measureText('语').width;
            perLineCount = Math.floor(canvasHalfWidth * 2 * 0.8 / perTextWidth);
            let textArrLen = Math.ceil(this.data.kinds.word.length / perLineCount); // ‘寄语’分行
            let i = 0;
            do {
              let arrItem = this.data.kinds.word.substr(perLineCount * i, perLineCount);
              this.setData({
                textArr: this.data.textArr.concat(arrItem)
              })
              i++;
            } while (textArrLen > i);
            const textBlockHeight = this.data.kinds.name !== '' ? this.data.kinds.sizeNum * 1.3 * (textArrLen + 1) + 10 : this.data.kinds.sizeNum * 1.3 * textArrLen; // 计算画布中文字的高度
            this.setData({
              textBlockHeight: textBlockHeight,
              imageRes: canvasHalfSize
            })
            wx.hideLoading()
            this.drawKind(this.data.imageRes, this.data.textBlockHeight);
          })
      }
    })
  },
  // 点击按钮保存图片
  createPic() {
    wx.canvasToTempFilePath({
      x: 0,
      y: 0,
      width: this.data.canvasHalfWidth * 2,
      height: this.data.canvasHeight,
      destWidth: this.data.canvasHalfWidth * 4, //2倍关系
      destHeight: this.data.canvasHeight * 2, //2倍关系
      canvasId: 'cvs',
      fileType: 'jpg',
      quality: 1,
      success(resp) {
        wx.getSetting({
          success: res => {
            if (res.authSetting['scope.writePhotosAlbum'] == false) {
              wx.showModal({
                title: '提示',
                content: '是否授权将图片保存到相册？',
                confirmColor: '#2ca2ed',
                success: res => {
                  //点击确定打开授权设置
                  if (res.confirm) {
                    wx.openSetting({
                      success: res => {
                        setTimeout(() => {
                          if (res.authSetting['scope.writePhotosAlbum'] == true) {
                            wx.saveImageToPhotosAlbum({
                              filePath: sharePicUrl,
                              success: res => {
                                this.closeShare();
                                wx.showToast({
                                  title: '保存成功！',
                                  icon: 'success',
                                  mask: true
                                })
                              },
                              fail: err => {
                                wx.showToast({
                                  title: '保存失败！',
                                  icon: 'none',
                                  mask: true
                                })
                              }
                            })
                          } else {
                            wx.showToast({
                              title: '授权获取失败！',
                              icon: 'none',
                              mask: true
                            })
                          }
                        }, 500)
                      }
                    })
                  }
                }
              })
            } else {
              wx.saveImageToPhotosAlbum({
                filePath: resp.tempFilePath,
                success: res => {
                  wx.showToast({
                    title: '保存成功！',
                    icon: 'success',
                    mask: true
                  })
                }
              })
            }
          }
        })
      },
      fail(res) {
        wx.showToast({
          title: '图片生成失败',
          icon: 'success',
          duration: 1000
        })
      }
    })
  },
  // 下载图片的异步函数
  imgDownPromise() {
    return new Promise((resolve) => {
      if (this.data.kinds.styleIndex === 0 && this.data.kinds.backColor && this.data.kinds.backColor !== '') {
        this.setData({
          cachePath: this.data.kinds.backsrc
        })
        resolve()
      } else {
        if (this.data.kinds.backIndex === 4) {
          this.setData({
            cachePath: this.data.kinds.backsrc
          })
          resolve()
        } else {
          wx.downloadFile({ // 将背景图保存在本地
            url: this.data.kinds.backsrc,
            success: (res) => {
              if (res.statusCode === 200) {
                this.setData({
                  cachePath: res.tempFilePath
                })
                resolve()
              }
            }
          })
        }
      }
    })
  },
  // 获取背景图尺寸的异步函数
  getImgSize(resolve) {
    return new Promise((resolve) => {
      wx.getImageInfo({
        src: this.data.kinds.backsrc,
        success: ((resp) => {
          resolve(resp)
        })
      })
    })
  },
  // 获取手机屏幕尺寸
  getScreenSize() {
    return new Promise((resolve) => {
      wx.getSystemInfo({
        success: res => {
          resolve(res)
        }
      })
    })
  },
  // 初始化画布内容
  drawKind(res, textBlockHeight) {
    if (this.data.kinds.styleIndex === 0) { // 文字在图片内
      this.setData({
        canvasHeight: res.height * 2,
        canvasHalfWidth: res.width,
        'textOffset.x': res.width,
        'textOffset.y': res.height,
        textHeight: textBlockHeight
      })
      this.drawImg()
    } else {
      const len = this.data.textArr.length;
      const ctx = this.data.cvs; // 保存画布引用
      this.setData({
        canvasHeight: res.height * 2 + textBlockHeight + 20,
        canvasHalfWidth: res.width,
        'textOffset.x': res.width,
        textHeight: textBlockHeight
      })
      let backColor = this.data.kinds.backColor || 'white';
      ctx.setFillStyle(backColor);
      ctx.fillRect(0, 0, res.width * 2, this.data.canvasHeight);
      if (this.data.kinds.styleIndex === 1) { // 文字在图片上方
        // ctx.drawImage(this.data.kinds.backsrc, 0, this.data.textHeight + 20, this.data.canvasHalfWidth * 2, this.data.canvasHeight - textBlockHeight - 20); // 画背景图（微信开发者工具）
        ctx.drawImage(this.data.cachePath, 0, this.data.textHeight + 20, this.data.canvasHalfWidth * 2, this.data.canvasHeight - textBlockHeight - 20); // 画背景图（真机）
        this.drawText(10)
      } else {
        // ctx.drawImage(this.data.kinds.backsrc, 0, 0, this.data.canvasHalfWidth * 2, this.data.canvasHeight - textBlockHeight - 20); // 画背景图（微信开发者工具）
        ctx.drawImage(this.data.cachePath, 0, 0, this.data.canvasHalfWidth * 2, this.data.canvasHeight - textBlockHeight - 20); // 画背景图（真机）
        this.drawText(this.data.canvasHeight - textBlockHeight - 10)
      }
      ctx.draw();
    }
  },
  drawImg() {
    const ctx = this.data.cvs; // 保存画布引用
    if (this.data.kinds.backColor && this.data.kinds.backColor !== '') {
      ctx.setFillStyle(this.data.kinds.backColor);
      ctx.fillRect(0, 0, this.data.canvasHalfWidth * 2, this.data.canvasHeight);
    } else {
      // ctx.drawImage(this.data.kinds.backsrc, 0, 0, this.data.canvasHalfWidth * 2, this.data.canvasHeight); // 画背景图（微信开发者工具）
      ctx.drawImage(this.data.cachePath, 0, 0, this.data.canvasHalfWidth * 2, this.data.canvasHeight); // 画背景图（真机）
    }
    let posX = this.data.textOffset.x - this.data.textHalfWidth;
    let posY = this.data.textOffset.y - this.data.textHeight / 2;
    // 文字位置极值处理
    if (posY < 0) {
      posY = 0;
      this.setData({
        'textOffset.y': this.data.textHeight / 2
      })
    }
    if (posY > this.data.canvasHeight - this.data.textHeight) {
      posY = this.data.canvasHeight - this.data.textHeight;
      this.setData({
        'textOffset.y': this.data.canvasHeight - this.data.textHeight / 2
      })
    }
    if (posX < 0) {
      this.setData({
        'textOffset.x': this.data.textHalfWidth
      })
    }
    if (posX > this.data.canvasHalfWidth * 2 - this.data.textHalfWidth * 2) {
      this.setData({
        'textOffset.x': this.data.canvasHalfWidth * 2 - this.data.textHalfWidth
      })
    }
    this.drawText(posY)
    ctx.draw();
  },
  // 触摸画布
  canvasTouch(e) {
    if (this.data.kinds.styleIndex === 0) {
      let touchX = e.changedTouches[0].x;
      let touchY = e.changedTouches[0].y;
      // 手指点击位置判断
      if (touchY > this.data.textOffset.y - this.data.textHeight / 2 && touchY < this.data.textOffset.y + this.data.textHeight / 2 && touchX > this.data.textOffset.x - this.data.textHalfWidth && touchX < this.data.textOffset.x + this.data.textHalfWidth) {
        this.setData({
          'fingerPosition.x': touchX,
          'fingerPosition.y': touchY,
          textStatus: true
        })
      }
    }
  },
  // 手指在画布上移动
  textMove(e) {
    if (this.data.kinds.styleIndex === 0 && this.data.textStatus) {
      if (this.data.flag) {
        this.setData({
          flag: false
        })
        setTimeout(() => {
          let fingerOffsetX = this.data.textOffset.x + (e.changedTouches[0].x - this.data.fingerPosition.x);
          let fingerOffsetY = this.data.textOffset.y + (e.changedTouches[0].y - this.data.fingerPosition.y);
          this.setData({
            'textOffset.x': fingerOffsetX,
            'textOffset.y': fingerOffsetY,
            'fingerPosition.x': e.changedTouches[0].x,
            'fingerPosition.y': e.changedTouches[0].y
          });
          this.drawImg();
          this.setData({
            flag: true
          })
        }, 20)
      }
    }
  },
  // 停止移动文字
  stopMoveText(e) {
    if (this.data.kinds.styleIndex === 0) {
      this.setData({
        textStatus: false
      })
    }
  },
  // 绘制文字函数封装
  drawText(posY) {
    const len = this.data.textArr.length;
    const ctx = this.data.cvs; // 保存画布引用
    ctx.setFontSize(this.data.kinds.sizeNum);
    ctx.setTextAlign('center');
    ctx.setTextBaseline('top');
    ctx.setFillStyle(this.data.kinds.colorChosen);
    for (let i = 0; i < len; i++) {
      ctx.fillText(this.data.textArr[i], this.data.textOffset.x, this.data.kinds.sizeNum * 1.3 * i + posY);
      let textHalfWidth = Math.ceil(ctx.measureText(this.data.textArr[i]).width / 2);
      if (textHalfWidth > this.data.textHalfWidth) {
        this.setData({
          textHalfWidth: textHalfWidth
        })
      }
    };
    if (this.data.kinds.name !== '') {
      ctx.setTextAlign('right');
      ctx.fillText('-- ' + this.data.kinds.name, this.data.textHalfWidth + this.data.textOffset.x, this.data.kinds.sizeNum * 1.3 * len + 10 + posY);
    }
    // 绘制时间
    if (this.data.kinds.hasTime) {
      const timeStamp = new Date();
      let time_year = timeStamp.getFullYear();
      let time_month = timeStamp.getMonth() + 1;
      let time_date = timeStamp.getDate();
      const dateString = `${time_year}.${time_month}.${time_date}`;
      ctx.setTextAlign('left');
      ctx.setFontSize(16);
      if (this.data.kinds.styleIndex !== 2) {
        ctx.setFillStyle('white');
      } else {
        ctx.setFillStyle(this.data.kinds.colorChosen);
      }
      ctx.fillText(dateString, 20, this.data.canvasHeight - 40);
    }
  }
})