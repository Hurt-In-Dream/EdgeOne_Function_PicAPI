// EdgeOne Pages Function export
export function onRequest(context) {
  return handleRequest(context.request, context.env);
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

// 缓存对象
let countsCache = null;
let countsCacheTime = 0;
const CACHE_TTL = 60 * 1000; // 1 分钟缓存

/**
 * 从本地 counts.json 文件获取图片数量
 * 这个文件由 GitHub 同步功能自动更新
 */
async function getCounts(request) {
  const now = Date.now();

  // 使用缓存
  if (countsCache && (now - countsCacheTime) < CACHE_TTL) {
    return countsCache;
  }

  try {
    // 获取当前域名
    const url = new URL(request.url);
    const countsUrl = `${url.origin}/counts.json`;

    const response = await fetch(countsUrl, {
      cf: { cacheTtl: 60 } // Cloudflare edge cache
    });

    if (response.ok) {
      countsCache = await response.json();
      countsCacheTime = now;
      return countsCache;
    }
  } catch (e) {
    console.error('Failed to fetch counts.json:', e);
  }

  // 返回默认值
  return {
    h: 0, v: 0,
    r18h: 0, r18v: 0,
    pidh: 0, pidv: 0,
    tagh: 0, tagv: 0
  };
}

/**
 * 生成真正的随机数 - 使用多种随机源
 */
function getSecureRandom(max) {
  if (max <= 0) return 1;

  // 使用 crypto API 如果可用
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return (array[0] % max) + 1;
  }

  // 回退方案：多个 Math.random() 组合
  const r1 = Math.random();
  const r2 = Math.random();
  const r3 = Math.random();
  const combined = Math.floor((r1 + r2 + r3) / 3 * max);
  return (combined % max) + 1;
}

/**
 * 生成随机图片URL
 */
function getRandomImageUrl(type, counts) {
  const dirMap = {
    h: { path: '/ri/h/', count: counts.h || 0 },
    v: { path: '/ri/v/', count: counts.v || 0 },
    r18h: { path: '/ri/r18/h/', count: counts.r18h || 0 },
    r18v: { path: '/ri/r18/v/', count: counts.r18v || 0 },
    pidh: { path: '/ri/pid/h/', count: counts.pidh || 0 },
    pidv: { path: '/ri/pid/v/', count: counts.pidv || 0 },
    tagh: { path: '/ri/tag/h/', count: counts.tagh || 0 },
    tagv: { path: '/ri/tag/v/', count: counts.tagv || 0 }
  };

  const config = dirMap[type];
  if (!config || config.count < 1) return null;

  const randomNum = getSecureRandom(config.count);
  return config.path + randomNum + '.webp';
}

/**
 * 从多个类型中随机选择
 */
function getRandomFromTypes(types, counts) {
  const validTypes = [];
  let totalWeight = 0;

  for (const type of types) {
    const count = counts[type] || 0;
    if (count > 0) {
      validTypes.push({ type, count });
      totalWeight += count;
    }
  }

  if (validTypes.length === 0) return null;

  let random = Math.random() * totalWeight;
  let selectedType = validTypes[0].type;

  for (const item of validTypes) {
    random -= item.count;
    if (random <= 0) {
      selectedType = item.type;
      break;
    }
  }

  return getRandomImageUrl(selectedType, counts);
}

// 返回图片重定向响应
function redirectToImage(imageUrl) {
  return new Response(null, {
    status: 302,
    headers: {
      'Location': imageUrl,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
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

    // 获取图片数量 (从本地 counts.json)
    const counts = await getCounts(request);

    // === 普通图片 ===
    if (imgType === 'h') {
      const imageUrl = getRandomImageUrl('h', counts);
      if (imageUrl) return redirectToImage(imageUrl);
    }

    if (imgType === 'v') {
      const imageUrl = getRandomImageUrl('v', counts);
      if (imageUrl) return redirectToImage(imageUrl);
    }

    if (imgType === 'ua') {
      const type = isMobile ? 'v' : 'h';
      const imageUrl = getRandomImageUrl(type, counts);
      if (imageUrl) return redirectToImage(imageUrl);
    }

    // === R18 图片 ===
    if (imgType === 'r18h') {
      const imageUrl = getRandomImageUrl('r18h', counts);
      if (imageUrl) return redirectToImage(imageUrl);
    }

    if (imgType === 'r18v') {
      const imageUrl = getRandomImageUrl('r18v', counts);
      if (imageUrl) return redirectToImage(imageUrl);
    }

    if (imgType === 'r18ua') {
      const type = isMobile ? 'r18v' : 'r18h';
      const imageUrl = getRandomImageUrl(type, counts);
      if (imageUrl) return redirectToImage(imageUrl);
    }

    // === PID 图片 ===
    if (imgType === 'pidh') {
      const imageUrl = getRandomImageUrl('pidh', counts);
      if (imageUrl) return redirectToImage(imageUrl);
    }

    if (imgType === 'pidv') {
      const imageUrl = getRandomImageUrl('pidv', counts);
      if (imageUrl) return redirectToImage(imageUrl);
    }

    if (imgType === 'pidua') {
      const type = isMobile ? 'pidv' : 'pidh';
      const imageUrl = getRandomImageUrl(type, counts);
      if (imageUrl) return redirectToImage(imageUrl);
    }

    // === 标签搜索图片 ===
    if (imgType === 'tagh') {
      const imageUrl = getRandomImageUrl('tagh', counts);
      if (imageUrl) return redirectToImage(imageUrl);
    }

    if (imgType === 'tagv') {
      const imageUrl = getRandomImageUrl('tagv', counts);
      if (imageUrl) return redirectToImage(imageUrl);
    }

    if (imgType === 'tagua') {
      const type = isMobile ? 'tagv' : 'tagh';
      const imageUrl = getRandomImageUrl(type, counts);
      if (imageUrl) return redirectToImage(imageUrl);
    }

    // === 全部图片随机 ===
    if (imgType === 'allh') {
      const imageUrl = getRandomFromTypes(['h', 'pidh', 'tagh'], counts);
      if (imageUrl) return redirectToImage(imageUrl);
    }

    if (imgType === 'allv') {
      const imageUrl = getRandomFromTypes(['v', 'pidv', 'tagv'], counts);
      if (imageUrl) return redirectToImage(imageUrl);
    }

    if (imgType === 'allua') {
      const types = isMobile ? ['v', 'pidv', 'tagv'] : ['h', 'pidh', 'tagh'];
      const imageUrl = getRandomFromTypes(types, counts);
      if (imageUrl) return redirectToImage(imageUrl);
    }

    // === 全部包含R18 ===
    if (imgType === 'allr18h') {
      const imageUrl = getRandomFromTypes(['h', 'pidh', 'tagh', 'r18h'], counts);
      if (imageUrl) return redirectToImage(imageUrl);
    }

    if (imgType === 'allr18v') {
      const imageUrl = getRandomFromTypes(['v', 'pidv', 'tagv', 'r18v'], counts);
      if (imageUrl) return redirectToImage(imageUrl);
    }

    if (imgType === 'allr18ua') {
      const types = isMobile ? ['v', 'pidv', 'tagv', 'r18v'] : ['h', 'pidh', 'tagh', 'r18h'];
      const imageUrl = getRandomFromTypes(types, counts);
      if (imageUrl) return redirectToImage(imageUrl);
    }

    // 计算总数
    const totalH = (counts.h || 0) + (counts.pidh || 0) + (counts.tagh || 0);
    const totalV = (counts.v || 0) + (counts.pidv || 0) + (counts.tagv || 0);
    const totalR18H = totalH + (counts.r18h || 0);
    const totalR18V = totalV + (counts.r18v || 0);

    // 显示使用说明
    var helpText = '🖼️ 随机图片 API\n\n';
    helpText += '📌 使用方法:\n\n';
    helpText += '【普通图片】\n';
    helpText += '• ?img=h    - 横屏随机图片\n';
    helpText += '• ?img=v    - 竖屏随机图片\n';
    helpText += '• ?img=ua   - 设备自适应\n\n';
    helpText += '【标签搜索】\n';
    helpText += '• ?img=tagh  - 标签横屏随机\n';
    helpText += '• ?img=tagv  - 标签竖屏随机\n';
    helpText += '• ?img=tagua - 标签自适应\n\n';
    helpText += '【PID图片】\n';
    helpText += '• ?img=pidh  - PID横屏随机\n';
    helpText += '• ?img=pidv  - PID竖屏随机\n';
    helpText += '• ?img=pidua - PID自适应\n\n';
    helpText += '【全部随机 (普通+标签+PID)】\n';
    helpText += '• ?img=allh  - 所有横屏随机 (' + totalH + ' 张)\n';
    helpText += '• ?img=allv  - 所有竖屏随机 (' + totalV + ' 张)\n';
    helpText += '• ?img=allua - 所有自适应\n\n';
    helpText += '【R18图片】\n';
    helpText += '• ?img=r18h  - R18横屏随机\n';
    helpText += '• ?img=r18v  - R18竖屏随机\n';
    helpText += '• ?img=r18ua - R18自适应\n\n';
    helpText += '【全部包含R18】\n';
    helpText += '• ?img=allr18h  - 全部横屏含R18 (' + totalR18H + ' 张)\n';
    helpText += '• ?img=allr18v  - 全部竖屏含R18 (' + totalR18V + ' 张)\n';
    helpText += '• ?img=allr18ua - 全部自适应含R18\n\n';
    helpText += '📊 图片统计:\n';
    helpText += '• 排行横屏: ' + (counts.h || 0) + ' 张\n';
    helpText += '• 排行竖屏: ' + (counts.v || 0) + ' 张\n';
    helpText += '• 标签横屏: ' + (counts.tagh || 0) + ' 张\n';
    helpText += '• 标签竖屏: ' + (counts.tagv || 0) + ' 张\n';
    helpText += '• PID横屏: ' + (counts.pidh || 0) + ' 张\n';
    helpText += '• PID竖屏: ' + (counts.pidv || 0) + ' 张\n';
    helpText += '• R18横屏: ' + (counts.r18h || 0) + ' 张\n';
    helpText += '• R18竖屏: ' + (counts.r18v || 0) + ' 张\n\n';
    helpText += '💡 数量从 counts.json 读取，同步图片时自动更新\n';

    return new Response(helpText, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    return new Response('❌ 错误: ' + error.message, {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}
