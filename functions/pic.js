// EdgeOne Pages Function export
export function onRequest(context) {
  return handleRequest(context.request);
}

// 检测是否为移动设备
function isMobileDevice(userAgent) {
  if (!userAgent) return false;

  var mobileKeywords = [
    'Mobile', 'Android', 'iPhone', 'iPad', 'iPod', 'BlackBerry',
    'Windows Phone', 'Opera Mini', 'IEMobile', 'Mobile Safari',
    'webOS', 'Kindle', 'Silk', 'Fennec', 'Maemo', 'Tablet'
  ];

  var lowerUserAgent = userAgent.toLowerCase();

  // 检查移动设备关键词
  for (var i = 0; i < mobileKeywords.length; i++) {
    if (lowerUserAgent.includes(mobileKeywords[i].toLowerCase())) {
      return true;
    }
  }

  // 检查移动设备正则表达式
  var mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
  return mobileRegex.test(userAgent);
}

// 图片配置
const imageConfig = {
  // 普通图片
  h: { path: '/ri/h/', max: 882 },
  v: { path: '/ri/v/', max: 3289 },
  // R18图片
  r18h: { path: '/ri/r18/h/', max: 100 },
  r18v: { path: '/ri/r18/v/', max: 100 },
  // PID图片
  pidh: { path: '/ri/pid/h/', max: 100 },
  pidv: { path: '/ri/pid/v/', max: 100 }
};

// 生成随机图片URL
function getRandomImageUrl(type) {
  const config = imageConfig[type];
  if (!config) return null;

  const randomNum = Math.floor(Math.random() * config.max) + 1;
  return config.path + randomNum + '.webp';
}

// 返回图片重定向响应
function redirectToImage(imageUrl) {
  return new Response(null, {
    status: 302,
    headers: {
      'Location': imageUrl,
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

async function handleRequest(request) {
  try {
    var url = new URL(request.url);
    var imgType = url.searchParams.get('img');
    var userAgent = request.headers.get('User-Agent') || '';
    var isMobile = isMobileDevice(userAgent);

    // 横屏图片
    if (imgType === 'h') {
      return redirectToImage(getRandomImageUrl('h'));
    }

    // 竖屏图片
    if (imgType === 'v') {
      return redirectToImage(getRandomImageUrl('v'));
    }

    // 自适应图片
    if (imgType === 'ua') {
      const type = isMobile ? 'v' : 'h';
      return redirectToImage(getRandomImageUrl(type));
    }

    // R18 横屏图片
    if (imgType === 'r18h') {
      return redirectToImage(getRandomImageUrl('r18h'));
    }

    // R18 竖屏图片
    if (imgType === 'r18v') {
      return redirectToImage(getRandomImageUrl('r18v'));
    }

    // R18 自适应图片
    if (imgType === 'r18ua') {
      const type = isMobile ? 'r18v' : 'r18h';
      return redirectToImage(getRandomImageUrl(type));
    }

    // PID 横屏图片
    if (imgType === 'pidh') {
      return redirectToImage(getRandomImageUrl('pidh'));
    }

    // PID 竖屏图片
    if (imgType === 'pidv') {
      return redirectToImage(getRandomImageUrl('pidv'));
    }

    // PID 自适应图片
    if (imgType === 'pidua') {
      const type = isMobile ? 'pidv' : 'pidh';
      return redirectToImage(getRandomImageUrl(type));
    }

    // 显示使用说明
    var helpText = '🖼️ 随机图片展示器\n\n';
    helpText += '📌 使用方法:\n\n';
    helpText += '【普通图片】\n';
    helpText += '• ?img=h   - 获取横屏随机图片\n';
    helpText += '• ?img=v   - 获取竖屏随机图片\n';
    helpText += '• ?img=ua  - 根据设备类型自动选择图片\n\n';
    helpText += '【R18图片】\n';
    helpText += '• ?img=r18h  - 获取R18横屏随机图片\n';
    helpText += '• ?img=r18v  - 获取R18竖屏随机图片\n';
    helpText += '• ?img=r18ua - 根据设备类型自动选择R18图片\n\n';
    helpText += '【PID图片】\n';
    helpText += '• ?img=pidh  - 获取PID横屏随机图片\n';
    helpText += '• ?img=pidv  - 获取PID竖屏随机图片\n';
    helpText += '• ?img=pidua - 根据设备类型自动选择PID图片\n\n';
    helpText += '📊 图片统计:\n';
    helpText += '• 普通横屏: ' + imageConfig.h.max + ' 张\n';
    helpText += '• 普通竖屏: ' + imageConfig.v.max + ' 张\n';
    helpText += '• R18横屏: ' + imageConfig.r18h.max + ' 张\n';
    helpText += '• R18竖屏: ' + imageConfig.r18v.max + ' 张\n';
    helpText += '• PID横屏: ' + imageConfig.pidh.max + ' 张\n';
    helpText += '• PID竖屏: ' + imageConfig.pidv.max + ' 张\n';

    return new Response(helpText, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    var errorDetails = '❌ 内部错误\n\n';
    errorDetails += '错误消息: ' + error.message + '\n';
    errorDetails += '错误堆栈: ' + error.stack + '\n';
    errorDetails += '请求地址: ' + request.url + '\n';
    errorDetails += '时间戳: ' + new Date().toISOString();

    return new Response(errorDetails, {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}
