#!/usr/bin/env node
/**
 * 依赖解析模块
 * 解析代码文件的依赖关系
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * 解析 JS/TS 文件的 import 语句
 * @param {string} content - 文件内容
 * @returns {Array} 依赖列表
 */
export function parseJsTsImports(content) {
  const dependencies = [];

  // 匹配 import 语句
  // import ... from 'module'
  // import 'module'
  const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    dependencies.push({
      type: 'import',
      module: match[1],
      isRelative: match[1].startsWith('.') || match[1].startsWith('/')
    });
  }

  // 匹配 require 语句
  // require('module')
  const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = requireRegex.exec(content)) !== null) {
    dependencies.push({
      type: 'require',
      module: match[1],
      isRelative: match[1].startsWith('.') || match[1].startsWith('/')
    });
  }

  // 匹配动态 import
  // import('module')
  const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = dynamicImportRegex.exec(content)) !== null) {
    dependencies.push({
      type: 'dynamic-import',
      module: match[1],
      isRelative: match[1].startsWith('.') || match[1].startsWith('/')
    });
  }

  return dependencies;
}

/**
 * 解析 Vue 文件的依赖
 * @param {string} content - Vue 文件内容
 * @returns {Object} { imports, components }
 */
export function parseVueDependencies(content) {
  const result = {
    imports: [],
    components: []
  };

  // 解析 <script> 或 <script setup> 部分
  const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
  if (scriptMatch) {
    result.imports = parseJsTsImports(scriptMatch[1]);
  }

  // 解析 components 注册
  // components: { Comp1, Comp2 }
  const componentsMatch = content.match(/components\s*:\s*\{([^}]+)\}/g);
  if (componentsMatch) {
    for (const comp of componentsMatch) {
      const names = comp.match(/components\s*:\s*\{([^}]+)\}/);
      if (names) {
        const componentNames = names[1].split(',').map(n => n.trim().split(/\s+/)[0]);
        result.components.push(...componentNames.filter(n => n));
      }
    }
  }

  // 解析 Vue 3 script setup 的组件使用
  // 直接使用导入的组件
  if (scriptMatch) {
    const script = scriptMatch[1];
    // 匹配变量定义，可能是组件
    const componentDefRegex = /(?:const|let|var)\s+(\w+)\s*=\s*(?:defineComponent|resolveComponent|shallowRef)/g;
    let match;
    while ((match = componentDefRegex.exec(script)) !== null) {
      result.components.push(match[1]);
    }
  }

  return result;
}

/**
 * 解析 Java 文件的 import 语句
 * @param {string} content - Java 文件内容
 * @returns {Array} 依赖列表
 */
export function parseJavaImports(content) {
  const dependencies = [];

  // 匹配 import 语句
  const importRegex = /import\s+(?:static\s+)?([^;]+);/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    dependencies.push({
      type: 'import',
      module: match[1].trim(),
      isRelative: false // Java import 通常是绝对路径
    });
  }

  // 匹配 @Autowired 注入
  const autowiredRegex = /@Autowired\s+(?:private\s+)?(\w+)\s+(\w+)\s*;/g;
  while ((match = autowiredRegex.exec(content)) !== null) {
    dependencies.push({
      type: 'autowired',
      class: match[1],
      name: match[2]
    });
  }

  return dependencies;
}

/**
 * 根据文件类型解析依赖
 * @param {string} filePath - 文件路径
 * @param {string} content - 文件内容
 * @returns {Array|Object} 依赖信息
 */
export function parseFileDependencies(filePath, content) {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case '.js':
    case '.ts':
    case '.jsx':
    case '.tsx':
    case '.mjs':
    case '.cjs':
      return parseJsTsImports(content);

    case '.vue':
      return parseVueDependencies(content);

    case '.java':
      return parseJavaImports(content);

    default:
      return [];
  }
}

/**
 * 解析相对路径依赖，获取实际文件路径
 * @param {string} fromFile - 源文件路径
 * @param {string} modulePath - 模块路径
 * @param {string} repoPath - 仓库根路径
 * @returns {string|null} 实际文件路径或 null
 */
export function resolveDependencyPath(fromFile, modulePath, repoPath) {
  if (!modulePath.startsWith('.')) {
    return null; // 非相对路径，跳过
  }

  const fromDir = path.dirname(path.join(repoPath, fromFile));
  let resolvedPath = path.resolve(fromDir, modulePath);

  // 尝试不同的扩展名
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '.vue', '.mjs', '.cjs', '/index.ts', '/index.js'];

  for (const ext of extensions) {
    const tryPath = resolvedPath + ext;
    if (tryPath.startsWith(repoPath)) {
      return path.relative(repoPath, tryPath);
    }
  }

  // 尝试目录
  if (resolvedPath.startsWith(repoPath)) {
    return path.relative(repoPath, resolvedPath);
  }

  return null;
}

/**
 * 递归解析文件的所有依赖
 * @param {string} repoPath - 仓库路径
 * @param {string} filePath - 起始文件路径
 * @param {number} maxDepth - 最大递归深度
 * @param {Set} visited - 已访问文件集合
 * @param {Object} options - 配置选项
 * @returns {Promise<Object>} 依赖树
 */
export async function resolveAllDependencies(repoPath, filePath, maxDepth = 2, visited = new Set(), options = {}) {
  const result = {
    file: filePath,
    dependencies: [],
    depth: maxDepth
  };

  if (maxDepth <= 0 || visited.has(filePath)) {
    return result;
  }

  visited.add(filePath);

  try {
    const fullPath = path.join(repoPath, filePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    const deps = parseFileDependencies(filePath, content);

    // 处理 JS/TS 依赖
    const imports = Array.isArray(deps) ? deps : (deps.imports || []);

    for (const dep of imports) {
      if (!dep.isRelative) continue;

      const resolvedPath = resolveDependencyPath(filePath, dep.module, repoPath);
      if (resolvedPath && !visited.has(resolvedPath)) {
        const depInfo = {
          path: resolvedPath,
          module: dep.module,
          type: dep.type
        };

        // 递归解析
        if (maxDepth > 1) {
          const subDeps = await resolveAllDependencies(repoPath, resolvedPath, maxDepth - 1, visited, options);
          depInfo.dependencies = subDeps.dependencies;
        }

        result.dependencies.push(depInfo);
      }
    }

    // 处理 Vue 组件
    if (!Array.isArray(deps) && deps.components) {
      result.components = deps.components;
    }

  } catch (error) {
    // 文件不存在或读取失败
    result.error = error.message;
  }

  return result;
}

/**
 * 获取文件的所有依赖文件路径（扁平化）
 * @param {string} repoPath - 仓库路径
 * @param {string} filePath - 起始文件路径
 * @param {number} maxDepth - 最大递归深度
 * @returns {Promise<Array>} 依赖文件路径列表
 */
export async function getAllDependencyPaths(repoPath, filePath, maxDepth = 2) {
  const visited = new Set();
  const paths = [];

  async function collect(currentPath, depth) {
    if (depth <= 0 || visited.has(currentPath)) return;
    visited.add(currentPath);

    try {
      const fullPath = path.join(repoPath, currentPath);
      const content = await fs.readFile(fullPath, 'utf-8');
      const deps = parseFileDependencies(currentPath, content);
      const imports = Array.isArray(deps) ? deps : (deps.imports || []);

      for (const dep of imports) {
        if (!dep.isRelative) continue;

        const resolvedPath = resolveDependencyPath(currentPath, dep.module, repoPath);
        if (resolvedPath && !visited.has(resolvedPath)) {
          paths.push(resolvedPath);
          await collect(resolvedPath, depth - 1);
        }
      }
    } catch (error) {
      // 忽略错误
    }
  }

  await collect(filePath, maxDepth);
  return paths;
}

/**
 * 分析变更文件的依赖关系
 * @param {string} repoPath - 仓库路径
 * @param {Array} changedFiles - 变更文件列表
 * @param {number} maxDepth - 最大依赖深度
 * @returns {Promise<Object>} 依赖分析结果
 */
export async function analyzeDependencies(repoPath, changedFiles, maxDepth = 2) {
  const result = {
    changedFiles: changedFiles.map(f => f.path),
    dependencies: [],
    dependencyMap: {} // 文件 -> 依赖列表
  };

  for (const file of changedFiles) {
    // 跳过删除的文件
    if (file.changeTypeCode === 'D') continue;

    // 跳过非代码文件
    const ext = path.extname(file.path).toLowerCase();
    if (!['.js', '.ts', '.jsx', '.tsx', '.vue', '.mjs', '.java'].includes(ext)) continue;

    try {
      const depPaths = await getAllDependencyPaths(repoPath, file.path, maxDepth);
      result.dependencyMap[file.path] = depPaths;

      for (const depPath of depPaths) {
        if (!result.dependencies.includes(depPath)) {
          result.dependencies.push(depPath);
        }
      }
    } catch (error) {
      // 忽略错误
    }
  }

  return result;
}

export default {
  parseJsTsImports,
  parseVueDependencies,
  parseJavaImports,
  parseFileDependencies,
  resolveDependencyPath,
  resolveAllDependencies,
  getAllDependencyPaths,
  analyzeDependencies
};
