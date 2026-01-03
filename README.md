# EdgeOne 随机图片 API

基于 EdgeOne Pages Functions 的随机二次元图片 API。

## 🌐 API 使用

### 基础地址
```
https://your-domain/pic
```

### 参数说明

#### 普通图片
| 参数 | 说明 | 示例 |
|------|------|------|
| `?img=h` | 横屏随机图片 | `/pic?img=h` |
| `?img=v` | 竖屏随机图片 | `/pic?img=v` |
| `?img=ua` | 设备自适应 (PC→横屏, 手机→竖屏) | `/pic?img=ua` |

#### 标签搜索图片
| 参数 | 说明 |
|------|------|
| `?img=tagh` | 标签横屏随机 |
| `?img=tagv` | 标签竖屏随机 |
| `?img=tagua` | 标签自适应 |

#### PID 抓取图片
| 参数 | 说明 |
|------|------|
| `?img=pidh` | PID横屏随机 |
| `?img=pidv` | PID竖屏随机 |
| `?img=pidua` | PID自适应 |

#### 全部图片随机 (普通+标签+PID)
| 参数 | 说明 |
|------|------|
| `?img=allh` | 所有横屏图片随机 |
| `?img=allv` | 所有竖屏图片随机 |
| `?img=allua` | 所有图片自适应 |

#### R18 图片 (需谨慎使用)
| 参数 | 说明 |
|------|------|
| `?img=r18h` | R18 横屏 |
| `?img=r18v` | R18 竖屏 |
| `?img=r18ua` | R18 自适应 |

#### 全部包含 R18
| 参数 | 说明 |
|------|------|
| `?img=allr18h` | 全部横屏含 R18 |
| `?img=allr18v` | 全部竖屏含 R18 |
| `?img=allr18ua` | 全部自适应含 R18 |

## 📁 目录结构

```
EdgeOne_Function_PicAPI/
├── functions/
│   └── pic.js          # 主函数逻辑
├── ri/                  # 图片存储目录
│   ├── h/              # 普通横屏 (1.webp, 2.webp...)
│   ├── v/              # 普通竖屏
│   ├── r18/
│   │   ├── h/          # R18 横屏
│   │   └── v/          # R18 竖屏
│   ├── pid/
│   │   ├── h/          # PID 横屏
│   │   └── v/          # PID 竖屏
│   └── tag/
│       ├── h/          # 标签横屏
│       └── v/          # 标签竖屏
├── index.html          # 根路径重定向
├── .gitignore          # 忽略 webp 文件
└── README.md           # 本文档
```

## ⚙️ 工作原理

1. **实时统计**: 通过 GitHub API 获取每个目录的图片数量 (5分钟缓存)
2. **随机选择**: 生成随机数选择图片文件
3. **302 重定向**: 返回图片 URL 重定向

## 🔗 配合 PIXIV-GETNEW 使用

本项目作为 [PIXIV-GETNEW](../PIXIV-GETNEW) 的图片输出端：

1. PIXIV-GETNEW 从 Pixiv 抓取图片到 R2
2. 通过 GitHub 同步功能将图片上传到本仓库
3. 本 API 从仓库随机返回图片

### 同步流程
```
Pixiv → PIXIV-GETNEW → R2 存储 → GitHub 同步 → 本仓库 → API 输出
```

## 🚀 部署

### 部署到 EdgeOne Pages

1. Fork 本仓库
2. 登录 [腾讯云 EdgeOne](https://console.cloud.tencent.com/edgeone)
3. 创建 Pages 项目，关联 GitHub 仓库
4. 构建设置:
   - 构建命令: 留空
   - 输出目录: `/`
5. 部署完成后绑定自定义域名

### 本地开发

```bash
# 克隆仓库 (不会下载 webp 图片)
git clone https://github.com/Hurt-In-Dream/EdgeOne_Function_PicAPI.git

# 编辑 functions/pic.js
```

## 📊 API 响应

### 成功时
返回 302 重定向到图片 URL：
```
HTTP/1.1 302 Found
Location: /ri/h/42.webp
```

### 无图片时
返回使用帮助页面 (text/plain)

## ⚠️ 注意事项

1. **GitHub API 限制**: 未认证请求每小时 60 次，但有 5 分钟缓存
2. **R18 内容**: 建议将仓库设为 Private
3. **图片命名**: 必须为 `数字.webp` 格式 (1.webp, 2.webp...)
4. **本地不存储**: .gitignore 配置为忽略 webp 文件

## 📝 更新日志

### 2026-01-03
- 添加标签搜索支持 (tagh/tagv/tagua)
- 添加全部随机参数 (allh/allv/allua)
- 添加全部含R18参数 (allr18h/allr18v/allr18ua)
- 修复随机数重复问题
- 添加防缓存 HTTP 头

## 📄 License

MIT
