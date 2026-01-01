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

  for (var i = 0; i < mobileKeywords.length; i++) {
    if (lowerUserAgent.includes(mobileKeywords[i].toLowerCase())) {
      return true;
    }
  }

  var mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
  return mobileRegex.test(userAgent);
}

// GitHub 仓库配置
const GITHUB_OWNER = 'Hurt-In-Dream';
const GITHUB_REPO = 'EdgeOne_Function_PicAPI';
const GITHUB_BRANCH = 'main';

// 图片目录配置
const imageDirs = {
  h: 'ri/h',
  v: 'ri/v',
  r18h: 'ri/r18/h',
  r18v: 'ri/r18/v',
  pidh: 'ri/pid/h',
  pidv: 'ri/pid/v'
};

// 缓存对象 - 存储每个目录的文件数量
// 格式: { [dir]: { count: number, timestamp: number } }
const cache = {};
const CACHE_TTL = 5 * 60 * 1000; // 缓存 5 分钟

/**
 * 从 GitHub API 获取目录中的文件数量
 * @param {string} dir - 目录路径
 * @returns {Promise<number>} - 文件数量
 */
async function getFileCount(dir) {
  // 检查缓存
  const now = Date.now();
  if (cache[dir] && (now - cache[dir].timestamp) < CACHE_TTL) {
    return cache[dir].count;
  }

  try {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${dir}?ref=${GITHUB_BRANCH}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'EdgeOne-Function'
      }
    });

    if (!response.ok) {
      // 如果目录不存在或请求失败，返回缓存值或默认值
      if (cache[dir]) {
        return cache[dir].count;
      }
      return 1; // 至少返回 1 避免除零错误
    }

    const files = await response.json();

    if (!Array.isArray(files)) {
      return cache[dir]?.count || 1;
    }

    // 只计算 .webp 文件，并找到最大编号
    let maxNum = 0;
    for (const file of files) {
      const match = file.name.match(/^(\d+)\.webp$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }

    // 如果没有找到任何编号文件，使用文件总数
    const count = maxNum > 0 ? maxNum : files.length;

    // 更新缓存
    cache[dir] = { count, timestamp: now };

    return count;
  } catch (error) {
    console.error(`Failed to fetch file count for ${dir}:`, error);
    // 返回缓存值或默认值
    return cache[dir]?.count || 1;
  }
}

/**
 * 获取所有目录的文件数量
 * @returns {Promise<Object>} - 各目录的文件数量
 */
async function getAllCounts() {
  const counts = {};

  // 并行获取所有目录的数量
  const promises = Object.entries(imageDirs).map(async ([key, dir]) => {
    counts[key] = await getFileCount(dir);
  });

  await Promise.all(promises);
  return counts;
}

/**
 * 生成随机图片URL
 * @param {string} type - 图片类型
 * @param {Object} counts - 各目录的文件数量
 * @returns {string|null} - 图片URL或null
 */
function getRandomImageUrl(type, counts) {
  const dirMap = {
    h: { path: '/ri/h/', count: counts.h },
    v: { path: '/ri/v/', count: counts.v },
    r18h: { path: '/ri/r18/h/', count: counts.r18h },
    r18v: { path: '/ri/r18/v/', count: counts.r18v },
    pidh: { path: '/ri/pid/h/', count: counts.pidh },
    pidv: { path: '/ri/pid/v/', count: counts.pidv }
  };

  const config = dirMap[type];
  if (!config || config.count < 1) return null;

  const randomNum = Math.floor(Math.random() * config.count) + 1;
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

    // 获取所有目录的文件数量
    const counts = await getAllCounts();

    // 横屏图片
    if (imgType === 'h') {
      const imageUrl = getRandomImageUrl('h', counts);
      if (imageUrl) return redirectToImage(imageUrl);
    }

    // 竖屏图片
    if (imgType === 'v') {
      const imageUrl = getRandomImageUrl('v', counts);
      if (imageUrl) return redirectToImage(imageUrl);
    }

    // 自适应图片
    if (imgType === 'ua') {
      const type = isMobile ? 'v' : 'h';
      const imageUrl = getRandomImageUrl(type, counts);
      if (imageUrl) return redirectToImage(imageUrl);
    }

    // R18 横屏图片
    if (imgType === 'r18h') {
      const imageUrl = getRandomImageUrl('r18h', counts);
      if (imageUrl) return redirectToImage(imageUrl);
    }

    // R18 竖屏图片
    if (imgType === 'r18v') {
      const imageUrl = getRandomImageUrl('r18v', counts);
      if (imageUrl) return redirectToImage(imageUrl);
    }

    // R18 自适应图片
    if (imgType === 'r18ua') {
      const type = isMobile ? 'r18v' : 'r18h';
      const imageUrl = getRandomImageUrl(type, counts);
      if (imageUrl) return redirectToImage(imageUrl);
    }

    // PID 横屏图片
    if (imgType === 'pidh') {
      const imageUrl = getRandomImageUrl('pidh', counts);
      if (imageUrl) return redirectToImage(imageUrl);
    }

    // PID 竖屏图片
    if (imgType === 'pidv') {
      const imageUrl = getRandomImageUrl('pidv', counts);
      if (imageUrl) return redirectToImage(imageUrl);
    }

    // PID 自适应图片
    if (imgType === 'pidua') {
      const type = isMobile ? 'pidv' : 'pidh';
      const imageUrl = getRandomImageUrl(type, counts);
      if (imageUrl) return redirectToImage(imageUrl);
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
    helpText += '📊 图片统计 (实时):\n';
    helpText += '• 普通横屏: ' + counts.h + ' 张\n';
    helpText += '• 普通竖屏: ' + counts.v + ' 张\n';
    helpText += '• R18横屏: ' + counts.r18h + ' 张\n';
    helpText += '• R18竖屏: ' + counts.r18v + ' 张\n';
    helpText += '• PID横屏: ' + counts.pidh + ' 张\n';
    helpText += '• PID竖屏: ' + counts.pidv + ' 张\n\n';
    helpText += '💡 图片数量实时从 GitHub 获取，每 5 分钟更新一次\n';

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
