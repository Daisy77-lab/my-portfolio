/* Presentation assets only. Replace src/alt/note here when approved screens arrive.
   A null src deliberately renders a material slot, never an invented product UI. */
window.PALMX_SHOWCASE = {
  pc: {
    name: 'PC', title: '把创作带入加工',
    description: '从模型准备、加工仿真，到激光创作与 AI 协作。',
    groups: [
      {id: 'cnc', title: 'CNC 准备', scenes: [0, 1, 2, 3]},
      {id: 'simulation', title: '加工仿真', scenes: [4, 5]},
      {id: 'laser', title: '激光 2D', scenes: [6, 7, 8, 9, 10]},
      {id: 'ai', title: '加工与 AI', scenes: [11]}
    ],
    scenes: [
      {title: '夹具选择', description: '根据毛坯尺寸与夹持方向，选择合适的夹具。', src: 'assets/palmx-pc-fixture.webp', alt: 'PalmX Studio 模型视图：按毛坯尺寸选择夹具与夹持方向', note: 'PC 软件界面'},
      {title: '零件摆放', description: '在毛坯内调整零件位置、方向与大小。', src: 'assets/palmx-pc-part-adjust.webp', alt: 'PalmX Studio 调整零件：移动、旋转、缩放与自动摆放', note: 'PC 软件界面'},
      {title: '局部精度', description: '在模型上标记需要精加工的区域。', src: 'assets/palmx-pc-precision.webp', alt: 'PalmX Studio 局部精度：在模型表面标记不同精度等级', note: 'PC 软件界面'},
      {title: '图案贴合', description: '将图案放到模型表面，调整位置、尺寸与投影方向。', src: 'assets/palmx-pc-pattern-placement.webp', alt: 'PalmX Studio 模型与图案：在三维模型上调整图案尺寸、位置与投影方向', note: 'PC 软件界面'},
      {title: 'NC 文件准备', description: '导入程序，补充毛坯、零点与刀具信息。', src: 'assets/palmx-pc-nc-import.webp', alt: 'PalmX Studio 导入 NC 文件并补充毛坯、零点与刀具信息', note: 'PC 软件界面'},
      {title: '双视图仿真', description: '结合机床视图与局部视图，查看刀轨和加工过程。', src: 'assets/palmx-pc-simulation.webp', alt: 'PalmX Studio 双视图仿真：机床、刀轨、残留体与仿真详情', note: 'PC 软件界面'},
      {title: '2D 画布', description: '在同一画布里编排文本、图形、编码与图片。', src: 'assets/palmx-pc-laser-canvas.webp', alt: 'PalmX Studio 激光 2D 画布：文本、几何图形、编码与图片编辑', note: 'PC 软件界面'},
      {title: '颜色分解', description: '预览图片色层，选择需要保留的颜色。', src: 'assets/palmx-pc-color-separation.webp', alt: 'PalmX Studio 颜色分解：预览图片色层并选择保留颜色', note: 'PC 软件界面'},
      {title: '材料测试', description: '用功率与速度阵列比较加工效果。', src: 'assets/palmx-pc-laser-test.webp', alt: 'PalmX Studio 材料测试阵列：按功率与速度配置测试格', note: 'PC 软件界面'},
      {title: '材料库', description: '按材料查找和复用加工参数方案。', src: 'assets/palmx-pc-materials.webp', alt: 'PalmX Studio 材料库：查看材料分类与加工参数方案', note: 'PC 软件界面'},
      {title: '新增材料', description: '把试片照片与测试参数对应，积累材料经验。', src: 'assets/palmx-pc-material-create.webp', alt: 'PalmX Studio 新增材料：将试片照片与测试工程参数对应', note: 'PC 软件界面'},
      {title: '加工监控与 AI', description: '把加工状态、异常提示与助手对话放在同一现场。', src: 'assets/palmx-pc-ai-machining.webp', alt: 'PalMake Studio 加工与 AI 协作方案：加工监控、异常提示、排期与智能助手对话', note: 'AI 协作方案'}
    ]
  },
  hmi: {
    name: 'HMI', title: '在设备旁完成确认',
    description: '检查准备条件，确认后启动加工。',
    device: 'assets/palmx-g1-hybrid-cutout.webp',
    groups: [
      {id: 'prepare', title: '任务准备', scenes: [0, 1, 2]},
      {id: 'check', title: '定位检查', scenes: [3, 4, 5, 6]},
      {id: 'run', title: '加工执行', scenes: [7, 8]},
      {id: 'manage', title: '设备管理', scenes: [9, 10, 11]}
    ],
    scenes: [
      {title: '加工引导', src: 'assets/palmx-hmi-workflow-web.mp4', poster: 'assets/palmx-hmi-workflow-poster.webp', alt: 'PalmX HMI 交互原型演示：刀具准备、装夹确认、加工进度与完成取件', note: '交互原型演示'},
      {title: '设备首页', src: 'assets/palmx-hmi-home.webp', alt: 'HMI 首页：机台概览、加工文件、刀具与手动控制入口', note: '浏览器原型截图'},
      {title: '项目详情', src: 'assets/palmx-hmi-project.webp', alt: 'HMI 项目详情：桌面支架预览、材料尺寸与所需刀具', note: '浏览器原型截图'},
      {title: '机旁检查', src: 'assets/palmx-hmi-preflight.webp', alt: 'HMI 加工前检查：工件预览、工件坐标系与六把所需刀具', note: '浏览器原型截图'},
      {title: '刀具核对', src: 'assets/palmx-hmi-tool-review.webp', alt: 'HMI 刀具核对：并排对照机台刀具与项目所需刀具', note: '浏览器原型截图'},
      {title: '视觉定位', src: 'assets/palmx-hmi-vision.webp', alt: 'HMI 视觉定位：工件扫描示意与开始扫描入口', note: '浏览器原型截图'},
      {title: '探针定位', src: 'assets/palmx-hmi-probe.webp', alt: 'HMI 长方体探针定位：五面测量示意、探测参数与工件原点结果', note: '浏览器原型截图'},
      {title: '加工执行', src: 'assets/palmx-hmi-running.webp', alt: 'HMI 加工中：项目预览、当前刀具、进给与主轴转速、程序进度及暂停停止控制', note: '浏览器原型截图'},
      {title: 'G 代码', src: 'assets/palmx-hmi-gcode.webp', alt: 'HMI G 代码预览：跟随当前执行行并查看程序进度', note: '浏览器原型截图'},
      {title: '刀具管理', src: 'assets/palmx-hmi-tools.webp', alt: 'HMI 刀具管理：主轴刀具、刀长、六个刀位与刀库操作', note: '浏览器原型截图'},
      {title: '设备控制', src: 'assets/palmx-hmi-control.webp', alt: 'HMI 设备控制：轴控制、MDI 和设备复位入口', note: '浏览器原型截图'},
      {title: '轴控制', src: 'assets/palmx-hmi-axis.webp', alt: 'HMI 轴控制：五轴运动示意、实时坐标、点动倍率和各轴回零', note: '浏览器原型截图'}
    ]
  },
  app: {
    name: 'App + Community', title: '让作品与设备连接起来',
    mobileScenes: [
      {title: '登录', description: '登录账号，开始连接设备。', src: 'assets/palmx-app-sign-in.webp'},
      {title: '连接机台', description: '按机台联网情况，选择接入方式。', src: 'assets/palmx-app-connect.webp'},
      {title: '确认绑定', description: '核对设备与账号，完成绑定。', src: 'assets/palmx-app-bind.webp'},
      {title: '连接完成', description: '进入设备监控、通知与作品入口。', src: 'assets/palmx-app-connected.webp'},
      {title: '选择任务', description: '从作品详情选择加工任务。', src: 'assets/palmx-app-task.webp'},
      {title: '加工准备', description: '选择工艺、刀具、毛坯与材料。', src: 'assets/palmx-app-prepare.webp'},
      {title: '任务下发', description: '发送任务后，到机台确认启动。', src: 'assets/palmx-app-sent.webp'},
      {title: '实时监控', description: '查看加工画面、进度与设备数据。', src: 'assets/palmx-app-monitor.webp'},
      {title: '异常状态', description: '了解暂停原因与待处理事项。', src: 'assets/palmx-app-status.webp'},
      {title: '加工记录', description: '回看已完成、中止与失败的任务。', src: 'assets/palmx-app-records.webp'},
      {title: '通知管理', description: '集中查看报警、完成与维护消息。', src: 'assets/palmx-app-notifications.webp'},
      {title: '通知设置', description: '按消息类型管理推送偏好。', src: 'assets/palmx-app-preferences.webp'},
      {title: '个人页面', description: '管理作品、记录与个人资源。', src: 'assets/palmx-app-profile.webp'}
    ],
    scenes: [
      {title: '社区首页', surface: 'Community', description: '从推荐作品出发，发现新的创作灵感。', src: 'assets/palmx-community-home.webp', crop: 'community-browser', alt: 'Palmake 社区首页：桌面 HiFi 解码器机箱、推荐作品与热门推荐', note: 'Community 交互原型'},
      {title: '兴趣偏好', surface: 'Community', description: '选择创作方向与常用材料，让推荐更贴近兴趣。', src: 'assets/palmx-community-interests.webp', crop: 'community-browser', alt: 'Palmake 兴趣偏好原型：选择感兴趣的创作方向与常用材料', note: 'Community 交互原型'},
      {title: 'AI 创作', surface: 'Community', description: '从一句描述或一张图片，开始 CNC 模型创作。', src: 'assets/palmx-community-ai-create.webp', crop: 'community-browser', alt: 'PalmLab AI 创作原型：描述想法或上传图片，进入模型创作工作台', note: 'Community 交互原型'},
      {title: '创作竞赛', surface: 'Community', description: '围绕主题参与创作，在竞赛中交流作品。', src: 'assets/palmx-community-contests.webp', crop: 'community-browser', alt: 'Palmake 创作竞赛原型：参赛作品、竞赛状态与主题赛事', note: 'Community 交互原型'},
      {title: '作品发布', surface: 'Community', description: '上传工艺包，由 AI 助手协助整理发布信息。', src: 'assets/palmx-community-publish.webp', crop: 'community-browser', alt: 'Palmake 作品发布原型：AI 发布助手、工艺包上传与轻量分享', note: 'Community 交互原型'},
      {title: '个人主页', surface: 'Community', description: '汇集作品、方案与 AI 创作，连接创作者。', src: 'assets/palmx-community-profile.webp', crop: 'community-browser', alt: 'Palmake 个人主页原型：作品与方案分类、AI 创作入口及个人资料', note: 'Community 交互原型'}
    ]
  }
};
