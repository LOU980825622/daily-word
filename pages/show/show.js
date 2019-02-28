// pages/show/show.js
const PRE_LINE_COUNT = 15; // 每一行的字数
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
    },  // 手指移动之前的位置
    textHalfWidth: 135, // 画布绘制字体的宽度的一半(270位最小宽度)
    flag: true
  },
  onLoad: function (options) {
    this.setData({
      cvs: wx.createCanvasContext('cvs') // 创建画布
    })
    wx.getStorage({ // 获取存在缓存的信息
      key: 'kinds',
      success: (res) => {
        this.setData({
          kinds: res.data
        })
        let textArrLen = Math.ceil(this.data.kinds.word.length / PRE_LINE_COUNT); // ‘寄语’分行
        let i = 0;
        do {
          let arrItem = this.data.kinds.word.substr(PRE_LINE_COUNT * i, PRE_LINE_COUNT);
          this.setData({
            textArr: this.data.textArr.concat(arrItem)
          })
          i++;
        } while (textArrLen > i);
        const textBlockHeight = this.data.kinds.name !== '' ? 25 * textArrLen + 35 : 25 * textArrLen; // 计算画布中文字的高度
        const query = wx.createSelectorQuery();
        // query.select('#dommy-dom').boundingClientRect().exec((res) => { // 计算背景图的尺寸，以便计算画布尺寸
        //   this.drawKind(res, textBlockHeight);
        // })
        if (this.data.kinds.backIndex === 4) {
          this.setData({
            cachePath: this.data.kinds.backsrc
          })
          query.select('#dommy-dom').boundingClientRect().exec((res) => { // 计算背景图的尺寸，以便计算画布尺寸
            this.drawKind(res, textBlockHeight);
          })
        } else {
          wx.downloadFile({ // 将背景图保存在本地
            url: this.data.kinds.backsrc,
            success: (res) => {
              if (res.statusCode === 200) {
                this.setData({
                  cachePath: res.tempFilePath
                })
                query.select('#dommy-dom').boundingClientRect().exec((res) => { // 计算背景图的尺寸，以便计算画布尺寸
                  this.drawKind(res, textBlockHeight);
                })
              }
            }
          })
        }
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
      destWidth: this.data.canvasHalfWidth * 4,  //2倍关系
      destHeight: this.data.canvasHeight * 2, //2倍关系
      canvasId: 'cvs',
      fileType: 'jpg',
      quality: 1,
      success(resp) {
        wx.saveImageToPhotosAlbum({
          filePath: resp.tempFilePath,
          success(res) {
            wx.showToast({
              title: '保存成功',
              icon: 'success',
              duration: 1000
            })
          },
          fail(res) {
            wx.showToast({
              title: '保存失败',
              icon: 'success',
              duration: 1000
            })
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
  drawKind(res, textBlockHeight) {
    if (this.data.kinds.styleIndex === 0) { // 文字在图片内
      this.setData({
        canvasHeight: res[0].height * 2,
        canvasHalfWidth: res[0].width,
        'textOffset.x': res[0].width,
        'textOffset.y': res[0].height,
        textHeight: textBlockHeight
      })
      this.drawImg()
    } else {
      const len = this.data.textArr.length;
      const ctx = this.data.cvs; // 保存画布引用
      this.setData({
        canvasHeight: res[0].height * 2 + textBlockHeight + 20,
        canvasHalfWidth: res[0].width,
        textHeight: textBlockHeight
      })
      ctx.setFillStyle('white');
      ctx.fillRect(0, 0, res[0].width * 2, this.data.canvasHeight);
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
    // ctx.drawImage(this.data.kinds.backsrc, 0, 0, this.data.canvasHalfWidth * 2, this.data.canvasHeight); // 画背景图（微信开发者工具）
    ctx.drawImage(this.data.cachePath, 0, 0, this.data.canvasHalfWidth * 2, this.data.canvasHeight); // 画背景图（真机）
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
    ctx.setFontSize(18)
    ctx.setTextAlign('center');
    ctx.setTextBaseline('top');
    ctx.setFillStyle(this.data.kinds.colorChosen);
    for (let i = 0; i < len; i++) {
      ctx.fillText(this.data.textArr[i], this.data.textOffset.x, 25 * i + posY);
      let textHalfWidth = ctx.measureText(this.data.textArr[i]).width / 2;
      if (textHalfWidth > this.data.textHalfWidth) {
        this.setData({
          textHalfWidth: textHalfWidth
        })
      }
    };
    if (this.data.kinds.name !== '') {
      ctx.setTextAlign('right');
      ctx.fillText('-- ' + this.data.kinds.name, this.data.textHalfWidth + this.data.textOffset.x, 25 * len + 10 + posY);
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