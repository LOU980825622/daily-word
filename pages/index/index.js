const app = getApp() // 获取应用实例
Page({
  data: {
    imgDefault: [
      'http://img.pconline.com.cn/images/upload/upc/tx/wallpaper/1208/16/c1/12954112_1345086682474.jpg',
      'https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1550727168365&di=7e75320d405262e9078989b0ea98d7a2&imgtype=0&src=http%3A%2F%2Fwww.totorowiki.com%2Fd%2Ffile%2Fp%2F20181024%2F2357901-9f296eaba1d5d012.jpg',
      'https://ss2.bdstatic.com/70cFvnSh_Q1YnxGkpoWK1HF6hhy/it/u=1936444329,1732158491&fm=26&gp=0.jpg',
      'https://ss1.bdstatic.com/70cFvXSh_Q1YnxGkpoWK1HF6hhy/it/u=3247559437,3366090658&fm=26&gp=0.jpg'
    ],
    bakBtn: [
      '背景1',
      '背景2',
      '背景3',
      '背景4',
      '手机\n相册'
    ],
    textPosition: [
      '文字在图片上',
      '文字在上\n图片在下',
      '文字在下\n图片在上'
    ],
    colors: [
      '#363636',
      '#00a126',
      '#009c9c',
      '#a42629',
      '#df00d1',
      '#ff9193',
      '#ff0000',
      '#70149e',
      '#ac00ff',
      '#70ff91',
      '#0091ff',
      '#ff9700',
      '#fbff00',
      '#d19275',
      '#DBDB70',
      '#C0C0C0',
      '#215E21',
      '#ffffff',
      '#C0D9D9',
      '#4D4DFF',
      '#00009C',
      '#D9D9F3',
      '#E6E8FA',
      '#D8BFD8',
      '#99CC32',
      '#38B0DE',
      '#FF1CAE',
      '#CFB53B'
    ],
    wordLen: 0,
    nameLen: 0,
    backIndex: 0,
    kinds: {
      backsrc: '',
      styleIndex: 0,
      hasTime: false,
      colorIndex: 0,
      colorChosen: '#363636',
      word: '',
      name: '',
      backIndex: 0
    }
  },
  onLoad: function () {
    this.setData({
      'kinds.backsrc': this.data.imgDefault[this.data.backIndex] || ''
    });
  },
  // 选择背景图
  backTap(e) {
    let tapIndex = e.currentTarget.dataset.id;
    if (this.data.backIndex === tapIndex) {
      return false;
    }
    if (tapIndex !== 4) { // 选择系统自带背景图
      this.setData({
        backIndex: tapIndex,
        'kinds.backsrc': this.data.imgDefault[tapIndex],
        'kinds.backIndex': tapIndex
      })
    } else { // 选择本地图片
      wx.chooseImage({
        count: 1,
        sizeType: ['original', 'compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          var tempFilePaths = res.tempFilePaths; // 腾讯服务器返回的图片
          this.setData({
            backIndex: -1,
            'kinds.backsrc': tempFilePaths[0],
            'kinds.backIndex': 4
          })
        }
      })
    }
  },
  // 文字选择样式
  styleTap(e) {
    let tapIndex = e.currentTarget.dataset.id;
    if (this.data.kinds.styleIndex === tapIndex) {
      return false;
    }
    this.setData({
      'kinds.styleIndex': tapIndex
    })
  },
  // 日期选项
  timeSwitch(e) {
    let hasTime = e.detail.value;
    this.setData({
      'kinds.hasTime': hasTime
    })
  },
  // 选择颜色
  colorTap(e) {
    let tapIndex = e.currentTarget.dataset.id;
    if (this.data.kinds.colorIndex === tapIndex) {
      return false;
    }
    this.setData({
      'kinds.colorIndex': tapIndex,
      'kinds.colorChosen': this.data.colors[tapIndex]
    })
  },
  // 寄语模拟数据的双向绑定
  textareaChange(e) {
    let type = e.currentTarget.dataset.type;
    let str = e.currentTarget.dataset.string;
    console.log(e);
    this.setData({
      [type]: e.detail.value,
      [str]: e.detail.value.length || 0
    })
  },
  // 生成海报
  createPoster() {
    wx.setStorage({
      key: 'kinds',
      data: this.data.kinds,
      success: () => {
        wx.navigateTo({
          url: '/pages/show/show?data1=' + 1234
        })
      }
    })
  }
})
