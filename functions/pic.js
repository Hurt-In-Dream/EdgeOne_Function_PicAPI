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

// 图片目录配置 - 包括标签目录
const imageDirs = {
  h: 'ri/h',
  v: 'ri/v',
  r18h: 'ri/r18/h',
  r18v: 'ri/r18/v',
  pidh: 'ri/pid/h',
  pidv: 'ri/pid/v',
  tagh: 'ri/tag/h',
  tagv: 'ri/tag/v'
};

// 缓存对象 - 存储每个目录的文件数量
const cache = {};
const CACHE_TTL = 5 * 60 * 1000; // 缓存 5 分钟

/**
 * 从 GitHub API 获取目录中的文件数量
 */
async function getFileCount(dir) {
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
      if (cache[dir]) return cache[dir].count;
      return 0;
    }

    const files = await response.json();

    if (!Array.isArray(files)) {
      return cache[dir]?.count || 0;
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

    const count = maxNum > 0 ? maxNum : 0;
    cache[dir] = { count, timestamp: now };
    return count;
  } catch (error) {
    console.error(`Failed to fetch file count for ${dir}:`, error);
    return cache[dir]?.count || 0;
  }
}

/**
 * 获取所有目录的文件数量
 */
async function getAllCounts() {
  const counts = {};
  const promises = Object.entries(imageDirs).map(async ([key, dir]) => {
    counts[key] = await getFileCount(dir);
  });
  await Promise.all(promises);
  return counts;
}

/**
 * 生成真正的随机数 - 使用加密随机
 */
function getSecureRandom(max) {
  // 使用时间戳 + 随机数组合生成更随机的数
  const timestamp = Date.now();
  const random1 = Math.random();
  const random2 = Math.random();
  const combined = (timestamp * random1 * random2) % max;
  return Math.floor(Math.abs(combined)) + 1;
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
 * 从多个类型中随机选择一个并返回图片URL
 */
function getRandomFromTypes(types, counts) {
  // 收集所有有效的类型和它们的权重(基于图片数量)
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

  // 根据权重随机选择一个类型
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

    const counts = await getAllCounts();

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

    // === 标签搜索图片 (新增) ===
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

    // === 全部图片随机 (新增) ===
    // allh - 所有横屏图片 (普通+PID+标签)
    if (imgType === 'allh') {
      const imageUrl = getRandomFromTypes(['h', 'pidh', 'tagh'], counts);
      if (imageUrl) return redirectToImage(imageUrl);
    }

    // allv - 所有竖屏图片 (普通+PID+标签)
    if (imgType === 'allv') {
      const imageUrl = getRandomFromTypes(['v', 'pidv', 'tagv'], counts);
      if (imageUrl) return redirectToImage(imageUrl);
    }

    // allua - 所有图片自适应 (普通+PID+标签)
    if (imgType === 'allua') {
      const types = isMobile ? ['v', 'pidv', 'tagv'] : ['h', 'pidh', 'tagh'];
      const imageUrl = getRandomFromTypes(types, counts);
      if (imageUrl) return redirectToImage(imageUrl);
    }

    // === 全部包含R18 (新增) ===
    // allr18h - 所有横屏包含R18
    if (imgType === 'allr18h') {
      const imageUrl = getRandomFromTypes(['h', 'pidh', 'tagh', 'r18h'], counts);
      if (imageUrl) return redirectToImage(imageUrl);
    }

    // allr18v - 所有竖屏包含R18
    if (imgType === 'allr18v') {
      const imageUrl = getRandomFromTypes(['v', 'pidv', 'tagv', 'r18v'], counts);
      if (imageUrl) return redirectToImage(imageUrl);
    }

    // allr18ua - 所有图片包含R18自适应
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
    helpText += '💡 数量实时获取，每 5 分钟更新\n';

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
