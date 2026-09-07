#!/usr/bin/env node
/**
 * Git Integration
 * Git 集成模块 - 管理 Git 操作
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Git 集成类
 */
class GitIntegration {
  constructor(options = {}) {
    this.config = options.config || {};
    this.autoCommit = options.autoCommit !== false;
    this.createBranch = options.createBranch !== false;
    this.createPR = options.createPR || false;
    this.branchTemplate = options.branchTemplate || 'fix/bug-{bugId}';
    this.commitTemplate = options.commitTemplate || 'fix: [Bug {bugId}] {title}\n\nAuto-generated fix for bug {bugId}';
  }

  /**
   * 创建修复分支
   * @param {string} bugId - Bug ID
   * @param {string} repositoryPath - 仓库路径
   * @returns {Promise<object>} 分支信息
   */
  async createFixBranch(bugId, repositoryPath) {
    if (!this.createBranch) {
      return { skipped: true, reason: '分支创建已禁用' };
    }

    try {
      // 获取当前分支
      const currentBranch = this._getCurrentBranch(repositoryPath);

      // 生成分支名
      const branchName = this._generateBranchName(bugId);

      // 检查分支是否已存在
      const existingBranch = this._branchExists(branchName, repositoryPath);
      if (existingBranch) {
        // 切换到已存在的分支
        this._checkoutBranch(branchName, repositoryPath);
        return {
          success: true,
          branchName,
          currentBranch,
          action: 'checked-out'
        };
      }

      // 创建并切换到新分支
      this._createAndCheckoutBranch(branchName, repositoryPath);

      return {
        success: true,
        branchName,
        currentBranch,
        action: 'created'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 提交修复
   * @param {string} bugId - Bug ID
   * @param {object} changes - 修改信息
   * @param {string} repositoryPath - 仓库路径
   * @returns {Promise<object>} 提交信息
   */
  async commitFix(bugId, changes, repositoryPath) {
    if (!this.autoCommit) {
      return { skipped: true, reason: '自动提交已禁用' };
    }

    try {
      // 检查是否有修改
      const status = this._getGitStatus(repositoryPath);
      if (!status.hasChanges) {
        return {
          skipped: true,
          reason: '没有需要提交的修改'
        };
      }

      // 添加修改的文件
      this._stageChanges(repositoryPath);

      // 生成提交信息
      const commitMessage = this._generateCommitMessage(bugId, changes);

      // 提交
      const commitHash = this._commit(repositoryPath, commitMessage);

      return {
        success: true,
        commitHash,
        commitMessage,
        filesChanged: status.files.length,
        branch: status.branch
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 推送到远程
   * @param {string} branchName - 分支名
   * @param {string} repositoryPath - 仓库路径
   * @returns {Promise<object>} 推送结果
   */
  async pushToRemote(branchName, repositoryPath) {
    try {
      // 检查是否有远程仓库
      const hasRemote = this._hasRemote(repositoryPath);
      if (!hasRemote) {
        return {
          skipped: true,
          reason: '没有配置远程仓库'
        };
      }

      // 推送分支
      const result = this._push(repositoryPath, branchName);

      return {
        success: true,
        remote: result.remote,
        branch: branchName
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 创建 Pull Request
   * @param {string} bugId - Bug ID
   * @param {object} changes - 修改信息
   * @param {string} repositoryPath - 仓库路径
   * @returns {Promise<object>} PR 信息
   */
  async createPullRequest(bugId, changes, repositoryPath) {
    if (!this.createPR) {
      return { skipped: true, reason: 'PR 创建已禁用' };
    }

    try {
      const branchName = this._generateBranchName(bugId);
      const defaultBranch = this._getDefaultBranch(repositoryPath);

      // 生成 PR 标题和描述
      const prTitle = `Fix for Bug ${bugId}: ${changes.title || 'Automated fix'}`;
      const prDescription = this._generatePRDescription(bugId, changes);

      // 使用 gh CLI 创建 PR
      const hasGhCli = this._hasGitHubCLI();
      if (hasGhCli) {
        return await this._createPRWithCLI(prTitle, prDescription, branchName, defaultBranch, repositoryPath);
      }

      // 尝试使用 Git API
      return await this._createPRWithAPI(prTitle, prDescription, branchName, defaultBranch, repositoryPath);

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 回滚最后一次提交
   * @param {string} repositoryPath - 仓库路径
   * @returns {Promise<object>} 回滚结果
   */
  async rollbackLastCommit(repositoryPath) {
    try {
      // 获取最后一次提交信息
      const lastCommit = this._getLastCommitInfo(repositoryPath);

      // 回滚到上一次提交
      this._resetTo(repositoryPath, 'HEAD~1');

      return {
        success: true,
        rolledBackCommit: lastCommit
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取仓库信息
   * @param {string} repositoryPath - 仓库路径
   * @returns {object} 仓库信息
   */
  getRepositoryInfo(repositoryPath) {
    try {
      return {
        path: repositoryPath,
        branch: this._getCurrentBranch(repositoryPath),
        remote: this._getRemoteUrl(repositoryPath),
        commit: this._getCurrentCommit(repositoryPath),
        isDirty: this._isWorkingTreeDirty(repositoryPath),
        hasUncommittedChanges: this._hasUncommittedChanges(repositoryPath)
      };
    } catch (error) {
      return {
        error: error.message
      };
    }
  }

  /**
   * 获取当前分支
   */
  _getCurrentBranch(repositoryPath) {
    try {
      const result = execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: repositoryPath,
        encoding: 'utf-8'
      }).trim();
      return result;
    } catch (error) {
      throw new Error(`无法获取当前分支: ${error.message}`);
    }
  }

  /**
   * 获取当前提交
   */
  _getCurrentCommit(repositoryPath) {
    try {
      const result = execSync('git rev-parse HEAD', {
        cwd: repositoryPath,
        encoding: 'utf-8'
      }).trim();
      return result;
    } catch (error) {
      throw new Error(`无法获取当前提交: ${error.message}`);
    }
  }

  /**
   * 生成分支名
   */
  _generateBranchName(bugId) {
    return this.branchTemplate.replace('{bugId}', bugId);
  }

  /**
   * 检查分支是否存在
   */
  _branchExists(branchName, repositoryPath) {
    try {
      execSync(`git show-ref --verify --quiet refs/heads/${branchName}`, {
        cwd: repositoryPath
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 创建并切换到新分支
   */
  _createAndCheckoutBranch(branchName, repositoryPath) {
    execSync(`git checkout -b ${branchName}`, {
      cwd: repositoryPath,
      stdio: 'pipe'
    });
  }

  /**
   * 切换到已存在的分支
   */
  _checkoutBranch(branchName, repositoryPath) {
    execSync(`git checkout ${branchName}`, {
      cwd: repositoryPath,
      stdio: 'pipe'
    });
  }

  /**
   * 获取 Git 状态
   */
  _getGitStatus(repositoryPath) {
    try {
      const result = execSync('git status --porcelain', {
        cwd: repositoryPath,
        encoding: 'utf-8'
      });

      const lines = result.trim().split('\n').filter(line => line);
      const files = lines.map(line => {
        const status = line.substring(0, 2).trim();
        const filePath = line.substring(3);
        return { status, path: filePath };
      });

      return {
        hasChanges: files.length > 0,
        files,
        branch: this._getCurrentBranch(repositoryPath)
      };

    } catch (error) {
      return {
        hasChanges: false,
        files: [],
        branch: this._getCurrentBranch(repositoryPath)
      };
    }
  }

  /**
   * 暂存所有修改
   */
  _stageChanges(repositoryPath) {
    execSync('git add -A', {
      cwd: repositoryPath,
      stdio: 'pipe'
    });
  }

  /**
   * 提交修改
   */
  _commit(repositoryPath, message) {
    // 使用 heredoc 语法确保多行提交信息正确
    const result = execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, {
      cwd: repositoryPath,
      encoding: 'utf-8',
      stdio: 'pipe'
    });

    // 提取提交哈希
    const match = result.match(/\[([a-f0-9]+)\]/);
    return match ? match[1] : this._getCurrentCommit(repositoryPath);
  }

  /**
   * 生成提交信息
   */
  _generateCommitMessage(bugId, changes) {
    let message = this.commitTemplate;

    // 替换模板变量
    message = message.replace(/{bugId}/g, String(bugId));
    message = message.replace(/{title}/g, changes.title || 'Automated fix');
    message = message.replace(/{description}/g, changes.description || '');
    message = message.replace(/{filesChanged}/g, String(changes.filesModified || 0));

    return message;
  }

  /**
   * 检查是否有远程仓库
   */
  _hasRemote(repositoryPath) {
    try {
      execSync('git remote', {
        cwd: repositoryPath,
        stdio: 'pipe'
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 推送分支
   */
  _push(repositoryPath, branchName) {
    const result = execSync(`git push -u origin ${branchName}`, {
      cwd: repositoryPath,
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    return result;
  }

  /**
   * 获取默认分支
   */
  _getDefaultBranch(repositoryPath) {
    try {
      // 尝试获取远程主分支
      const result = execSync('git symbolic-ref refs/remotes/origin/HEAD', {
        cwd: repositoryPath,
        encoding: 'utf-8'
      });
      return result.replace('refs/remotes/origin/', '').trim();
    } catch (error) {
      // 默认返回 main 或 master
      const branches = execSync('git branch -r', {
        cwd: repositoryPath,
        encoding: 'utf-8'
      });
      if (branches.includes('origin/main')) return 'main';
      if (branches.includes('origin/master')) return 'master';
      return 'main';
    }
  }

  /**
   * 检查是否安装了 GitHub CLI
   */
  _hasGitHubCLI() {
    try {
      execSync('gh --version', { stdio: 'pipe' });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 使用 GitHub CLI 创建 PR
   */
  async _createPRWithCLI(title, description, branch, baseBranch, repositoryPath) {
    try {
      // 创建临时文件存储 PR 描述
      const tempFile = path.join(repositoryPath, '.pr-description.md');
      fs.writeFileSync(tempFile, description);

      // 使用 gh CLI 创建 PR
      const result = execSync(
        `gh pr create --base ${baseBranch} --head ${branch} --title "${title}" --body-file ${tempFile}`,
        {
          cwd: repositoryPath,
          encoding: 'utf-8'
        }
      );

      // 清理临时文件
      fs.unlinkSync(tempFile);

      // 提取 PR URL
      const prUrlMatch = result.match(/https:\/\/github\.com\/[\w-]+\/[\w-]+\/pull\/\d+/);
      const prUrl = prUrlMatch ? prUrlMatch[0] : null;

      return {
        success: true,
        prUrl,
        title,
        branch,
        baseBranch
      };

    } catch (error) {
      throw new Error(`使用 GitHub CLI 创建 PR 失败: ${error.message}`);
    }
  }

  /**
   * 使用 API 创建 PR
   */
  async _createPRWithAPI(title, description, branch, baseBranch, repositoryPath) {
    // 这里需要实现 GitHub/GitLab API 调用
    // 简化版本：返回创建 PR 的说明
    return {
      success: false,
      skipped: true,
      reason: '需要手动创建 Pull Request',
      instructions: {
        title,
        description,
        branch,
        baseBranch,
        url: this._getRemoteUrl(repositoryPath)
      }
    };
  }

  /**
   * 生成 PR 描述
   */
  _generatePRDescription(bugId, changes) {
    return `## Bug ${bugId} 修复

${changes.description || '自动生成的修复'}

### 修改内容

${changes.changes ? changes.changes.map(c => `- ${c}`).join('\n') : '- 自动修复'}

### 相关文件

${changes.filesModified ? changes.filesModified.map(f => `- ${f.filePath}`).join('\n') : ''}

### 检查清单

- [ ] 代码已通过本地测试
- [ ] 已添加必要的错误处理
- [ ] 代码符合项目规范

---

此 PR 由 AI 自动生成，请人工审核后合并。`;
  }

  /**
   * 获取远程仓库 URL
   */
  _getRemoteUrl(repositoryPath) {
    try {
      const result = execSync('git remote get-url origin', {
        cwd: repositoryPath,
        encoding: 'utf-8'
      });
      return result.trim();
    } catch (error) {
      return null;
    }
  }

  /**
   * 获取最后一次提交信息
   */
  _getLastCommitInfo(repositoryPath) {
    const result = execSync('git log -1 --pretty=format:"%H|%s|%an"', {
      cwd: repositoryPath,
      encoding: 'utf-8'
    });
    const [hash, subject, author] = result.split('|');
    return { hash, subject, author };
  }

  /**
   * 重置到指定提交
   */
  _resetTo(repositoryPath, ref) {
    execSync(`git reset --hard ${ref}`, {
      cwd: repositoryPath,
      stdio: 'pipe'
    });
  }

  /**
   * 检查工作区是否脏
   */
  _isWorkingTreeDirty(repositoryPath) {
    return this._hasUncommittedChanges(repositoryPath);
  }

  /**
   * 检查是否有未提交的修改
   */
  _hasUncommittedChanges(repositoryPath) {
    try {
      const result = execSync('git status --porcelain', {
        cwd: repositoryPath,
        encoding: 'utf-8'
      });
      return result.trim().length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * 克隆仓库
   */
  async cloneRepository(url, targetPath) {
    try {
      execSync(`git clone "${url}" "${targetPath}"`, {
        stdio: 'pipe'
      });
      return {
        success: true,
        path: targetPath
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 拉取最新代码
   */
  async pull(repositoryPath) {
    try {
      const currentBranch = this._getCurrentBranch(repositoryPath);
      execSync(`git pull origin ${currentBranch}`, {
        cwd: repositoryPath,
        stdio: 'pipe'
      });
      return {
        success: true,
        branch: currentBranch
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取提交历史
   */
  getCommitHistory(repositoryPath, limit = 10) {
    try {
      const result = execSync(
        `git log -${limit} --pretty=format:"%H|%ai|%s|%an"`,
        {
          cwd: repositoryPath,
          encoding: 'utf-8'
        }
      );

      return result.trim().split('\n').map(line => {
        const [hash, date, subject, author] = line.split('|');
        return { hash, date, subject, author };
      });

    } catch (error) {
      return [];
    }
  }
}

/**
 * 创建 Git 集成实例
 */
function createGitIntegration(options) {
  return new GitIntegration(options);
}

export {
  GitIntegration,
  createGitIntegration
};

export default GitIntegration;
