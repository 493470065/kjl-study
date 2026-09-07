#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PR 需求合规性检查工具（整合版）

功能：
1. 获取 TFS/Azure DevOps PR 信息
2. 获取关联的工作项需求
3. 获取代码变更（Diff）
4. 异常检测（无工作项/无 commit → 直接发布提示评论）
5. 调用 LLM 进行需求合规性分析
6. 解析 LLM 结果并发布评论

使用方式：
  python3 pr_check.py "http://tfs.../pullrequest/123"
  python3 pr_check.py "http://tfs.../pullrequest/123" --api-key "your-api-key"
"""

# Python 版本检测
import sys

# 修复 Windows 控制台 Unicode 字符编码问题
def setup_console_encoding():
    """配置控制台编码以支持 Unicode 字符（如 ✓ ✗ 等）"""
    if sys.platform == 'win32':
        try:
            # Python 3.7+ 可以直接使用 reconfigure
            if hasattr(sys.stdout, 'reconfigure'):
                sys.stdout.reconfigure(encoding='utf-8')
                sys.stderr.reconfigure(encoding='utf-8')
            else:
                # Python 3.6 回退方案
                import io
                sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
                sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
        except Exception:
            # 如果配置失败，使用默认编码
            pass

setup_console_encoding()

if sys.version_info < (3, 6):
    print("=" * 60)
    print("错误: 本脚本需要 Python 3.6 或更高版本")
    print(f"当前版本: Python {sys.version}")
    print("=" * 60)
    print("\n请安装 Python 3.6+:")
    print("  - Windows: 从 https://www.python.org/downloads/ 下载安装")
    print("  - Linux: sudo apt-get install python3 (或使用 pyenv)")
    print("  - macOS: brew install python3")
    print("\n安装后，使用以下命令运行:")
    print("  - Windows: py -3 scripts/pr_check.py <PR_URL>")
    print("  - Linux/Mac: python3 scripts/pr_check.py <PR_URL>")
    sys.exit(1)

import os
import json
import argparse
import urllib.request
import urllib.parse
import base64
import difflib
import re
from typing import Optional, Dict, List
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path


def check_dependencies():
    """检查必需的依赖模块"""
    missing = []

    try:
        import yaml
    except ImportError:
        missing.append('pyyaml')

    if missing:
        print("=" * 60)
        print("缺少必需的 Python 依赖模块")
        print("=" * 60)
        print(f"\n缺少的模块: {', '.join(missing)}\n")
        print("请运行以下命令安装:")
        print("  - Windows: py -3 -m pip install -r requirements.txt")
        print("  - Linux/Mac: python3 -m pip install -r requirements.txt")
        print("\n或单独安装:")
        for module in missing:
            print(f"  - py -3 -m pip install {module}")
        sys.exit(1)

    import yaml
    return yaml


# 导入 yaml（检查依赖）
yaml = check_dependencies()


class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    CYAN = '\033[0;36m'
    NC = '\033[0m'


@dataclass
class WorkItem:
    id: str
    title: str
    description: str
    acceptance_criteria: str = ""
    work_item_type: str = ""
    state: str = ""
    url: str = ""


@dataclass
class FileChange:
    filename: str
    edit_type: str
    num_plus_lines: int
    num_minus_lines: int
    patch: str


@dataclass
class PRData:
    pr_url: str
    pr_title: str
    pr_description: str
    source_branch: str
    target_branch: str
    author: str
    work_items: List[WorkItem]
    files: List[FileChange]
    commits: List[Dict]


class TFSProvider:
    def __init__(self, pr_url: str, pat: Optional[str] = None):
        self.pr_url = pr_url
        self.pat = pat
        self.organization = None
        self.project = None
        self.repo = None
        self.repo_id = None
        self.pr_number = None
        self.server = None
        self.api_version = "4.1"
        self.pr_data = None

    def parse_url(self) -> bool:
        parsed = urllib.parse.urlparse(self.pr_url)
        path_parts = parsed.path.strip("/").split("/")
        path_parts = [urllib.parse.unquote(part) for part in path_parts]

        if "dev.azure.com" in parsed.netloc:
            self.server = "dev.azure.com"
            try:
                self.organization = path_parts[0]
                self.project = path_parts[1]
                git_idx = path_parts.index("_git")
                self.repo = path_parts[git_idx + 1]
                pr_idx = path_parts.index("pullrequest")
                self.pr_number = int(path_parts[pr_idx + 1])
            except:
                return False
        elif ".visualstudio.com" in parsed.netloc:
            self.server = parsed.netloc
            try:
                self.organization = path_parts[0]
                self.project = path_parts[0]
                git_idx = path_parts.index("_git")
                self.repo = path_parts[git_idx + 1]
                pr_idx = path_parts.index("pullrequest")
                self.pr_number = int(path_parts[pr_idx + 1])
            except:
                return False
        else:
            self.server = parsed.netloc
            try:
                if "tfs" in [p.lower() for p in path_parts]:
                    tfs_idx = [i for i, p in enumerate(path_parts) if p.lower() == "tfs"][0]
                    self.organization = path_parts[tfs_idx + 1]
                    git_idx = path_parts.index("_git")
                    self.project = path_parts[git_idx - 1]
                    self.repo = path_parts[git_idx + 1]
                    pr_idx = path_parts.index("pullrequest")
                    self.pr_number = int(path_parts[pr_idx + 1])
            except:
                return False
        return True

    def get_api_base(self) -> str:
        if self.server == "dev.azure.com":
            return f"https://{self.server}/{self.organization}/{self.project}/_apis"
        elif ".visualstudio.com" in self.server:
            return f"https://{self.server}/{self.project}/_apis"
        else:
            scheme = "https" if self.server.startswith("https") else "http"
            return f"{scheme}://{self.server}/tfs/{urllib.parse.quote(self.organization)}/{urllib.parse.quote(self.project)}/_apis"

    def make_request(self, endpoint: str, params: Optional[Dict] = None) -> Optional[Dict]:
        url = f"{self.get_api_base()}{endpoint}"
        if params:
            query = "&".join([f"{k}={urllib.parse.quote(str(v))}" for k, v in params.items()])
            url += "?" + query

        try:
            req = urllib.request.Request(url)
            if self.pat:
                auth = base64.b64encode(f":{self.pat}".encode()).decode()
                req.add_header('Authorization', f'Basic {auth}')
            req.add_header('Accept', 'application/json')

            with urllib.request.urlopen(req, timeout=60) as resp:
                return json.loads(resp.read().decode())
        except Exception as e:
            print(f"{Colors.RED}API Error: {e}{Colors.NC}")
            return None

    def get_pr_metadata(self) -> Dict:
        endpoint = f"/git/repositories/{self.repo}/pullrequests/{self.pr_number}"
        self.pr_data = self.make_request(endpoint, {"api-version": self.api_version})
        if self.pr_data:
            self.repo_id = self.pr_data.get('repository', {}).get('id', '')
        return self.pr_data

    def get_linked_work_items(self) -> List[WorkItem]:
        try:
            endpoint = f"/git/repositories/{self.repo_id}/pullrequests/{self.pr_number}/workitems"
            resp = self.make_request(endpoint, {"api-version": self.api_version})
            if not resp or 'value' not in resp:
                return []

            ids = [ref.get('id') for ref in resp.get('value', [])]
            if not ids:
                return []

            endpoint = f"/wit/workitems"
            # 尝试使用 $select 来获取 System.Parent 字段，同时使用 $expand=Fields
            params = {
                "api-version": self.api_version,
                "ids": ",".join(str(i) for i in ids),
                "$expand": "Fields",
                "$select": "System.Id,System.Title,System.WorkItemType,System.Parent,System.Description,Winning.Demand.Analysis"
            }
            resp = self.make_request(endpoint, params)

            # 用于存储父级工作项
            parent_work_item = None
            parent_fetched = False

            items = []
            if resp and 'value' in resp:
                for item in resp['value']:
                    fields = item.get('fields', {})
                    item_id = str(item.get('id', ''))
                    work_item_type = fields.get('System.WorkItemType', '')

                    # 如果是"任务"类型且还没获取过父级，尝试获取父级工作项
                    if work_item_type == '任务' and not parent_fetched:
                        parent_id = ''

                        # 使用单独的 API 调用来获取工作项的 relations
                        # 参考: GET /wit/workitems/{id}?$expand=relations&api-version=4.1
                        try:
                            item_endpoint = f"/wit/workitems/{item_id}"
                            item_params = {"api-version": self.api_version, "$expand": "relations"}
                            item_resp = self.make_request(item_endpoint, item_params)

                            if item_resp and 'relations' in item_resp:
                                relations = item_resp['relations']
                                for rel in relations:
                                    rel_type = rel.get('rel', '')
                                    # 父级工作项的关系类型是 Hierarchy-Reverse
                                    if rel_type == 'System.LinkTypes.Hierarchy-Reverse':
                                        rel_url = rel.get('url', '')
                                        # 从 URL 中提取父级工作项 ID（支持 workitems 和 workItems 两种格式）
                                        match = re.search(r'/work[Ii]tems/(\d+)', rel_url)
                                        if match:
                                            parent_id = match.group(1)
                                            break
                        except Exception as e:
                            print(f"{Colors.YELLOW}获取工作项 {item_id} 的父级失败: {e}{Colors.NC}")

                        # 如果找到了父级 ID，获取父级工作项的详细内容并添加到结果中
                        if parent_id:
                            try:
                                parent_params = {"api-version": self.api_version, "ids": parent_id, "$expand": "Fields"}
                                parent_resp = self.make_request(endpoint, parent_params)

                                if parent_resp and 'value' in parent_resp and len(parent_resp['value']) > 0:
                                    parent_item = parent_resp['value'][0]
                                    parent_fields = parent_item.get('fields', {})
                                    parent_description = parent_fields.get('System.Description', '') or ''
                                    parent_demand_analysis = parent_fields.get('Winning.Demand.Analysis', '') or ''

                                    # 清理 HTML 标签
                                    parent_description_text = re.sub(r'<[^>]+>', ' ', parent_description)
                                    parent_description_text = re.sub(r'\s+', ' ', parent_description_text).strip()

                                    parent_demand_text = re.sub(r'<[^>]+>', ' ', parent_demand_analysis)
                                    parent_demand_text = re.sub(r'\s+', ' ', parent_demand_text).strip()

                                    # 创建父级工作项对象
                                    parent_work_item = WorkItem(
                                        id=parent_id,
                                        title=parent_fields.get('System.Title', ''),
                                        description=parent_description_text[:10000],
                                        acceptance_criteria=parent_demand_text[:5000],
                                        work_item_type=parent_fields.get('System.WorkItemType', ''),
                                        state=parent_fields.get('System.State', ''),
                                        url=parent_item.get('url', '')
                                    )
                                    print(f"{Colors.GREEN}✓ 获取父级工作项: #{parent_id} {parent_work_item.title[:50]}{Colors.NC}")
                            except Exception as e:
                                print(f"{Colors.YELLOW}获取父级工作项 {parent_id} 内容失败: {e}{Colors.NC}")

                        # 标记已尝试获取父级，避免重复尝试
                        parent_fetched = True

                    # 非任务类型的工作项才添加到返回结果中
                    if work_item_type != '任务':
                        # 获取当前工作项的需求描述
                        description = fields.get('System.Description', '') or ''
                        demand_analysis = fields.get('Winning.Demand.Analysis', '') or ''

                        # 清理 HTML 标签
                        description_text = re.sub(r'<[^>]+>', ' ', description)
                        description_text = re.sub(r'\s+', ' ', description_text).strip()

                        demand_analysis_text = re.sub(r'<[^>]+>', ' ', demand_analysis)
                        demand_analysis_text = re.sub(r'\s+', ' ', demand_analysis_text).strip()

                        items.append(WorkItem(
                            id=item_id,
                            title=fields.get('System.Title', ''),
                            description=description_text[:10000],
                            acceptance_criteria=demand_analysis_text[:5000],
                            work_item_type=work_item_type,
                            state=fields.get('System.State', ''),
                            url=item.get('url', '')
                        ))

            # 如果获取到了父级工作项，添加到结果的开头
            if parent_work_item:
                items.insert(0, parent_work_item)
            return items
        except Exception as e:
            print(f"{Colors.YELLOW}获取工作项失败: {e}{Colors.NC}")
            return []

    def get_diff_files(self) -> List[FileChange]:
        if not self.pr_data:
            self.get_pr_metadata()

        base_sha = self.pr_data.get('lastMergeTargetCommit', {}).get('commitId', '')
        head_sha = self.pr_data.get('lastMergeSourceCommit', {}).get('commitId', '')

        if not base_sha or not head_sha:
            return []

        # 获取所有 commits
        commits = self.get_commits()
        if not commits:
            return []

        # 用于去重的文件集合（按文件路径）
        # 值为 (path, change_type)
        files_dict = {}

        # 遍历每个 commit，获取其变更列表
        for commit_idx, commit in enumerate(commits):
            commit_id = commit.get('commitId', '')
            if not commit_id:
                continue

            # 获取该 commit 的变更
            endpoint = f"/git/repositories/{self.repo_id}/commits/{commit_id}"
            resp = self.make_request(endpoint, {"api-version": self.api_version, "changeCount": 100})

            if resp and 'changes' in resp:
                for change in resp.get('changes', []):
                    item = change.get('item', {})
                    path = item.get('path', '')
                    change_type = change.get('changeType', 'edit')

                    if not path:
                        continue

                    # 跳过目录
                    is_folder = item.get('isFolder', False)
                    if is_folder or path.endswith('/'):
                        continue

                    # 如果文件已存在，更新（后面的 commit 会覆盖前面的）
                    files_dict[path] = {
                        'path': path,
                        'change_type': change_type,
                        'commit_idx': commit_idx
                    }

        # 对每个文件，比较 base 和 head 的内容
        files = []
        skipped_folders = 0

        for path, info in files_dict.items():
            change_type = info['change_type']

            new_content = "" if change_type != 'delete' else ""
            if change_type != 'delete':
                new_content = self._get_file_content(path, head_sha) or ""

            original_content = ""
            if change_type in ('edit', 'delete'):
                original_content = self._get_file_content(path, base_sha) or ""

            patch = self._generate_patch(path, original_content, new_content)

            edit_type = "modified"
            if change_type == 'add':
                edit_type = "added"
            elif change_type == 'delete':
                edit_type = "deleted"

            num_plus = sum(1 for l in patch.split('\n') if l.startswith('+') and not l.startswith('++'))
            num_minus = sum(1 for l in patch.split('\n') if l.startswith('-') and not l.startswith('--'))

            files.append(FileChange(filename=path, edit_type=edit_type,
                                   num_plus_lines=num_plus, num_minus_lines=num_minus, patch=patch))

        if skipped_folders > 0:
            print(f"{Colors.CYAN}  已跳过 {skipped_folders} 个目录{Colors.NC}")

        return files

    def _get_file_content(self, path: str, commit_id: str) -> str:
        endpoint = f"/git/repositories/{self.repo_id}/items"
        params = {"api-version": self.api_version, "path": path, "version": commit_id,
                 "versionType": "commit", "includeContent": "true"}

        try:
            url = f"{self.get_api_base()}{endpoint}"
            query = "&".join([f"{k}={urllib.parse.quote(str(v))}" for k, v in params.items()])
            url += "?" + query

            req = urllib.request.Request(url)
            if self.pat:
                auth = base64.b64encode(f":{self.pat}".encode()).decode()
                req.add_header('Authorization', f'Basic {auth}')
            req.add_header('Accept', '*/*')

            with urllib.request.urlopen(req, timeout=60) as resp:
                return resp.read().decode('utf-8')
        except:
            return ""

    def _generate_patch(self, path: str, original: str, new: str) -> str:
        try:
            lines = difflib.unified_diff(original.splitlines(keepends=True), new.splitlines(keepends=True),
                                        fromfile=f"a/{path}", tofile=f"b/{path}")
            return ''.join(lines)
        except:
            return ""

    def get_commits(self) -> List[Dict]:
        endpoint = f"/git/repositories/{self.repo}/pullrequests/{self.pr_number}/commits"
        resp = self.make_request(endpoint, {"api-version": self.api_version})
        return resp.get('value', []) if resp else []

    def get_pr_data(self) -> PRData:
        pr_meta = self.get_pr_metadata()
        return PRData(
            pr_url=self.pr_url,
            pr_title=pr_meta.get('title', ''),
            pr_description=pr_meta.get('description', ''),
            source_branch=pr_meta.get('sourceRefName', '').replace('refs/heads/', ''),
            target_branch=pr_meta.get('targetRefName', '').replace('refs/heads/', ''),
            author=pr_meta.get('createdBy', {}).get('displayName', ''),
            work_items=self.get_linked_work_items(),
            files=self.get_diff_files(),
            commits=self.get_commits()
        )

    def make_post_request(self, endpoint: str, data: Dict, params: Optional[Dict] = None) -> Optional[Dict]:
        """发送 POST 请求"""
        url = f"{self.get_api_base()}{endpoint}"
        if params:
            query = "&".join([f"{k}={urllib.parse.quote(str(v))}" for k, v in params.items()])
            url += "?" + query

        try:
            req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), method='POST')
            if self.pat:
                auth = base64.b64encode(f":{self.pat}".encode()).decode()
                req.add_header('Authorization', f'Basic {auth}')
            req.add_header('Content-Type', 'application/json')
            req.add_header('Accept', 'application/json')

            with urllib.request.urlopen(req, timeout=60) as resp:
                return json.loads(resp.read().decode())
        except Exception as e:
            print(f"{Colors.RED}POST Error: {e}{Colors.NC}")
            return None

    def make_patch_request(self, endpoint: str, data: Dict, params: Optional[Dict] = None) -> Optional[Dict]:
        """发送 PATCH 请求（用于更新工作项）"""
        url = f"{self.get_api_base()}{endpoint}"
        if params:
            query = "&".join([f"{k}={urllib.parse.quote(str(v))}" for k, v in params.items()])
            url += "?" + query

        try:
            req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), method='PATCH')
            if self.pat:
                auth = base64.b64encode(f":{self.pat}".encode()).decode()
                req.add_header('Authorization', f'Basic {auth}')
            req.add_header('Content-Type', 'application/json-patch+json')
            req.add_header('Accept', 'application/json')

            with urllib.request.urlopen(req, timeout=60) as resp:
                return json.loads(resp.read().decode())
        except Exception as e:
            print(f"{Colors.RED}PATCH Error: {e}{Colors.NC}")
            return None

    def add_work_item_tag(self, work_item_id: str, tag: str) -> bool:
        """给工作项添加标签"""
        try:
            # 先获取工作项的当前标签
            endpoint = f"/wit/workitems/{work_item_id}"
            resp = self.make_request(endpoint, {"api-version": self.api_version, "$expand": "None"})

            current_tags = []
            if resp and 'fields' in resp:
                current_tags_str = resp['fields'].get('System.Tags', '')
                if current_tags_str:
                    current_tags = [t.strip() for t in current_tags_str.split(';') if t.strip()]

            # 检查标签是否已存在
            if tag in current_tags:
                print(f"{Colors.YELLOW}  标签 '{tag}' 已存在于工作项 {work_item_id}{Colors.NC}")
                return True

            # 添加新标签
            current_tags.append(tag)
            new_tags_str = '; '.join(current_tags)

            # 更新工作项
            patch_data = [
                {
                    "op": "add",
                    "path": "/fields/System.Tags",
                    "value": new_tags_str
                }
            ]

            endpoint = f"/wit/workitems/{work_item_id}"
            result = self.make_patch_request(endpoint, patch_data, {"api-version": self.api_version})

            if result:
                return True
            return False

        except Exception as e:
            print(f"{Colors.YELLOW}  更新工作项 {work_item_id} 标签失败: {e}{Colors.NC}")
            return False

    def add_tag_to_linked_work_items(self, tag: str = "AI-PR-CHECK") -> int:
        """给所有关联的工作项添加标签，返回成功数量"""
        if not self.pr_data:
            return 0

        work_items = self.get_linked_work_items()
        if not work_items:
            return 0

        success_count = 0
        print(f"{Colors.CYAN}给关联工作项添加标签 '{tag}'...{Colors.NC}")

        for wi in work_items:
            if self.add_work_item_tag(wi.id, tag):
                print(f"{Colors.GREEN}  ✓ 工作项 {wi.id}: {wi.title[:50]}{Colors.NC}")
                success_count += 1
            else:
                print(f"{Colors.RED}  ✗ 工作项 {wi.id}: {wi.title[:50]}{Colors.NC}")

        return success_count

    def publish_comment(self, comment: str, thread_id: Optional[int] = None, add_tag: bool = True) -> bool:
        """发布评论到 PR

        Args:
            comment: 评论内容
            thread_id: 线程 ID（如果提供则更新已有评论）
            add_tag: 是否给关联工作项添加 AI-PR-CHECK 标签
        """
        try:
            if thread_id:
                endpoint = f"/git/repositories/{self.repo_id}/pullrequests/{self.pr_number}/threads/{thread_id}/comments"
                data = {"content": comment}
            else:
                endpoint = f"/git/repositories/{self.repo_id}/pullrequests/{self.pr_number}/threads"
                data = {
                    "comments": [{"content": comment, "commentType": "text"}],
                    "status": "active"
                }

            response = self.make_post_request(endpoint, data, {"api-version": self.api_version})
            if response is None:
                return False

            # 评论发布成功后，给关联工作项添加标签
            if add_tag:
                self.add_tag_to_linked_work_items("AI-PR-CHECK")

            return True

        except Exception as e:
            print(f"{Colors.RED}Error publishing comment: {e}{Colors.NC}")
            return False

    def get_threads(self) -> List[Dict]:
        endpoint = f"/git/repositories/{self.repo_id}/pullrequests/{self.pr_number}/threads"
        response = self.make_request(endpoint, {"api-version": self.api_version})
        return response.get('value', []) if response else []

    def find_bot_thread(self, header: str) -> Optional[int]:
        threads = self.get_threads()
        for thread in threads:
            comments = thread.get('comments', [])
            if comments:
                first_comment = comments[0]
                content = first_comment.get('content', '')
                if header in content:
                    return thread.get('id')
        return None


class LLMAnalyzer:
    """LLM 分析器 - 支持多种 LLM 提供商"""

    # 支持的模型配置
    MODELS = {
        "zhipu": {
            "name": "智谱 AI (ChatGLM)",
            "default_model": "glm-5",
            "api_url": "https://open.bigmodel.cn/api/coding/paas/v4/chat/completions",
            "headers_template": {
                "Authorization": "Bearer {api_key}",
                "content-type": "application/json"
            },
            "body_template": {
                "model": "{model}",
                "messages": [{"role": "user", "content": "{prompt}"}],
                "temperature": 0.2,
                "max_tokens": 65536
            },
            "response_path": "choices.0.message.content",
            "env_key": "ZHIPU_API_KEY",
            "config_key": "zhipu_api_key"
        },
        "minimax": {
            "name": "MiniMax",
            "default_model": "MiniMax-M2.5",
            "api_url": "https://api.minimax.chat/v1/text/chatcompletion_v2",
            "headers_template": {
                "Authorization": "Bearer {api_key}",
                "content-type": "application/json"
            },
            "body_template": {
                "model": "{model}",
                "messages": [{"role": "user", "content": "{prompt}"}],
                "temperature": 0.2,
                "max_tokens": 42000
            },
            "response_path": "choices.0.message.content",
            "env_key": "MINIMAX_API_KEY",
            "config_key": "minimax_api_key"
        },
        "kimi": {
            "name": "Kimi (Moonshot AI)",
            "default_model": "kimi-k2.5",
            "api_url": "https://api.moonshot.cn/v1/chat/completions",
            "headers_template": {
                "Authorization": "Bearer {api_key}",
                "content-type": "application/json"
            },
            "body_template": {
                "model": "{model}",
                "messages": [{"role": "user", "content": "{prompt}"}],
                "temperature": 1,
                "max_tokens": 32000
            },
            "response_path": "choices.0.message.content",
            "env_key": "KIMI_API_KEY",
            "config_key": "kimi_api_key"
        }
    }

    def __init__(self, provider: str = "zhipu", api_key: Optional[str] = None, model: Optional[str] = None):
        """
        初始化 LLM 分析器

        Args:
            provider: 提供商名称 (zhipu, minimax, kimi)
            api_key: API Key
            model: 模型名称（可选，使用默认模型）
        """
        self.provider = provider.lower()
        if self.provider not in self.MODELS:
            raise ValueError(f"不支持的 LLM 提供商: {provider}，支持的: {list(self.MODELS.keys())}")

        self.config = self.MODELS[self.provider]
        self.api_key = api_key
        self.model = model or self.config["default_model"]

    def get_api_key(self) -> Optional[str]:
        """获取 API Key（优先级：参数 > 环境变量 > 配置文件）"""
        if self.api_key:
            return self.api_key

        # 从环境变量获取
        env_key = self.config["env_key"]
        api_key = os.environ.get(env_key)
        if api_key:
            return api_key

        # 从配置文件获取
        config_file = Path(__file__).parent.parent / "config" / "config.json"
        if config_file.exists():
            try:
                with open(config_file) as f:
                    config = json.load(f)
                    config_key = self.config["config_key"]
                    if config.get(config_key):
                        return config[config_key]
            except:
                pass

        return None

    def analyze(self, pr_data: PRData, save_prompt_file: Optional[str] = None) -> Optional[Dict]:
        """分析 PR 需求合规性"""
        api_key = self.get_api_key()
        if not api_key:
            print(f"{Colors.RED}错误: 需要提供 {self.config['name']} API Key{Colors.NC}")
            print(f"{Colors.YELLOW}提示: 通过环境变量 {self.config['env_key']} 或配置文件 {self.config['config_key']} 配置{Colors.NC}")
            return None

        # 构建 prompt
        prompt = self._build_prompt(pr_data)

        # 保存 prompt 到文件（如果指定）
        if save_prompt_file:
            try:
                # 从配置中获取 temperature 和 max_tokens
                temperature = self.config["body_template"].get("temperature", 0.7)
                max_tokens = self.config["body_template"].get("max_tokens", 4000)

                with open(save_prompt_file, 'w', encoding='utf-8') as f:
                    json.dump({
                        "provider": self.provider,
                        "model": self.model,
                        "api_url": self.config["api_url"],
                        "request_body": {
                            "model": self.model,
                            "messages": [{"role": "user", "content": prompt}],
                            "temperature": temperature,
                            "max_tokens": max_tokens
                        }
                    }, f, ensure_ascii=False, indent=2)
                print(f"{Colors.GREEN}✓ Prompt 已保存到 {save_prompt_file}{Colors.NC}")
            except Exception as e:
                print(f"{Colors.YELLOW}警告: 无法保存 prompt 文件: {e}{Colors.NC}")

        try:
            print(f"{Colors.CYAN}调用 {self.config['name']} ({self.model}) 分析中...{Colors.NC}")

            # 构建请求头
            headers = {}
            for key, value_template in self.config["headers_template"].items():
                headers[key] = value_template.format(api_key=api_key)

            # 构建请求体
            body = {}
            for key, value_template in self.config["body_template"].items():
                if key == "messages":
                    body[key] = [{"role": "user", "content": prompt}]
                elif isinstance(value_template, str) and "{prompt}" in value_template:
                    body[key] = value_template.format(prompt=prompt)
                elif isinstance(value_template, str) and "{model}" in value_template:
                    body[key] = value_template.format(model=self.model)
                else:
                    body[key] = value_template

            # 调试信息
            print(f"{Colors.YELLOW}API URL: {self.config['api_url']}{Colors.NC}")

            req = urllib.request.Request(
                self.config["api_url"],
                data=json.dumps(body).encode('utf-8'),
                method='POST',
                headers=headers
            )

            with urllib.request.urlopen(req, timeout=120) as resp:
                response_data = resp.read().decode()
                response = json.loads(response_data)

            # 调试：显示响应结构
            print(f"{Colors.YELLOW}响应状态: 成功{Colors.NC}")

            # 提取内容
            text = self._extract_response(response)
            if text:
                return self._parse_response(text)
            else:
                print(f"{Colors.YELLOW}警告: 无法从响应中提取内容{Colors.NC}")
                print(f"{Colors.YELLOW}响应路径: {self.config['response_path']}{Colors.NC}")
                print(f"{Colors.YELLOW}响应数据: {json.dumps(response, ensure_ascii=False)[:500]}{Colors.NC}")
            return None

        except urllib.error.HTTPError as e:
            print(f"{Colors.RED}LLM API HTTP 错误: {e.code} - {e.reason}{Colors.NC}")
            if e.fp:
                try:
                    error_body = e.fp.read().decode()
                    print(f"{Colors.RED}错误详情: {error_body}{Colors.NC}")
                except:
                    pass
            return None
        except urllib.error.URLError as e:
            print(f"{Colors.RED}网络错误: {e.reason}{Colors.NC}")
            print(f"{Colors.YELLOW}提示: 请检查网络连接和 API 端点是否正确{Colors.NC}")
            return None
        except json.JSONDecodeError as e:
            print(f"{Colors.RED}响应解析失败: {e}{Colors.NC}")
            return None
        except Exception as e:
            print(f"{Colors.RED}LLM 调用失败: {e}{Colors.NC}")
            import traceback
            print(f"{Colors.YELLOW}详细错误: {traceback.format_exc()}{Colors.NC}")
            return None

    def _extract_response(self, response: Dict) -> Optional[str]:
        """从 API 响应中提取文本内容"""
        try:
            path = self.config["response_path"]
            parts = path.split(".")
            result = response
            for part in parts:
                if part.isdigit():
                    result = result[int(part)]
                else:
                    result = result[part]
            return result
        except (KeyError, IndexError, TypeError):
            return None

    def _build_prompt(self, pr_data: PRData) -> str:
        """构建 LLM prompt（基于 PR-Agent 格式）"""
        prompt = """你是一个 PR 审查专家，分析 Pull Request 的代码实现是否满足关联工作项的需求。

请按照以下格式输出分析结果（必须是有效的 YAML 格式，使用块标量指示符 '|' 用于多行值）：

```yaml
review:
  ticket_compliance_check:
    - ticket_url: |
        工作项 ID 或 URL
      ticket_requirements: |
        需求概述（从工作项描述和验收标准中提取）
      fully_compliant_requirements: |
        已满足的需求点列表（项目符号格式）
      not_compliant_requirements: |
        未满足的需求点列表（项目符号格式）
      requires_further_human_verification: |
        需要人工验证的点（项目符号格式）
```

字段说明：
- **ticket_url**: 工作项 ID 或完整 URL
- **ticket_requirements**: 复述工作项的所有需求、子任务、验收标准
- **fully_compliant_requirements**: 从 ticket_requirements 中列出已满足的项目（如无可留空）
- **not_compliant_requirements**: 从 ticket_requirements 中列出未满足的项目（如无可留空）
- **requires_further_human_verification**: 列出需要人工测试验证的项目（如无可留空）

---

## PR 信息

"""
        prompt += f"- **标题**: {pr_data.pr_title}\n"
        prompt += f"- **描述**: {pr_data.pr_description[:1000] if pr_data.pr_description else '无'}\n"
        prompt += f"- **分支**: {pr_data.source_branch} → {pr_data.target_branch}\n"
        prompt += f"- **作者**: {pr_data.author}\n\n"

        # 工作项 - PR-Agent 格式
        prompt += "## --PR Ticket Info--\n\n"
        if not pr_data.work_items:
            prompt += "*无关联工作项*\n\n"
        else:
            for wi in pr_data.work_items:
                prompt += f"=====\n"
                prompt += f"Ticket URL: '{wi.url or wi.id}'\n\n"
                prompt += f"Ticket Title: '{wi.title}'\n\n"

                if wi.state:
                    prompt += f"Ticket State: {wi.state}\n\n"
                if wi.work_item_type:
                    prompt += f"Ticket Type: {wi.work_item_type}\n\n"

                # 组合需求描述
                requirements = []
                if wi.description:
                    requirements.append(f"Description:\n{wi.description[:3000]}")
                if wi.acceptance_criteria:
                    requirements.append(f"Acceptance Criteria (Winning.Demand.Analysis):\n{wi.acceptance_criteria[:3000]}")

                if requirements:
                    prompt += f"Ticket Requirements:\n#####\n"
                    prompt += "\n".join(requirements)
                    prompt += "\n#####\n\n"

                prompt += f"=====\n\n"

        # 代码变更
        prompt += "## --PR Info--\n\n"
        prompt += f"Title: '{pr_data.pr_title}'\n\n"
        prompt += f"Branch: '{pr_data.source_branch} → {pr_data.target_branch}'\n\n"

        if pr_data.pr_description:
            prompt += f"PR Description:\n======\n{pr_data.pr_description[:2000]}\n======\n\n"

        # Diff 内容
        prompt += "The PR code diff:\n======\n"

        max_files_in_prompt = 50       # 增加到 50 个文件
        max_diff_length = 40000        # 增加到 40000 字符

        for f in pr_data.files[:max_files_in_prompt]:
            prompt += f"\n## File: '{f.filename}'\n\n"
            if f.patch:
                patch = f.patch
                if len(patch) > max_diff_length:
                    patch = patch[:max_diff_length] + "\n\n... (diff 已截断)"
                prompt += f"{patch}\n"

        if len(pr_data.files) > max_files_in_prompt:
            prompt += f"\n... 还有 {len(pr_data.files) - max_files_in_prompt} 个文件未显示\n"

        prompt += "\n======\n\n"

        # Commits
        if pr_data.commits:
            prompt += "Commits:\n"
            for c in pr_data.commits[:10]:
                short_sha = c.get('commitId', '')[:8]
                comment = c.get('comment', '')
                prompt += f"- `{short_sha}`: {comment}\n"
            prompt += "\n"

        prompt += "\nResponse (should be a valid YAML, and nothing else):\n```yaml\n"

        return prompt

    def _parse_response(self, text: str) -> Optional[Dict]:
        """解析 LLM 返回的结果"""
        # 清理文本，移除可能的 markdown 代码块标记
        yaml_text = text.strip()

        # 方法1: 提取 ```yaml ... ``` 代码块
        match = re.search(r'```yaml\s*\n(.*?)\n```', yaml_text, re.DOTALL)
        if match:
            yaml_text = match.group(1).strip()
        else:
            # 方法2: 提取 ``` ... ``` 代码块（不带 yaml 标记）
            match = re.search(r'```\s*\n(.*?)\n```', yaml_text, re.DOTALL)
            if match:
                yaml_text = match.group(1).strip()
            else:
                # 方法3: 移除开头和结尾的代码块标记
                yaml_text = re.sub(r'^```\w*\n', '', yaml_text)
                yaml_text = re.sub(r'\n```$', '', yaml_text)
                yaml_text = yaml_text.strip()

        # 尝试解析 YAML
        try:
            result = yaml.safe_load(yaml_text)
            if result and isinstance(result, dict):
                return result
        except Exception as e:
            # YAML 解析失败，尝试手动解析
            print(f"{Colors.YELLOW}YAML 解析失败: {e}，尝试备用解析...{Colors.NC}")

            # 备用方法：尝试提取关键信息
            try:
                # 检查是否包含 ticket_compliance_check
                if 'ticket_compliance_check' in yaml_text:
                    # 简单解析：查找 ticket_url 等关键字
                    return self._parse_yaml_fallback(yaml_text)
            except Exception as e2:
                print(f"{Colors.YELLOW}备用解析也失败: {e2}{Colors.NC}")

        # 返回原始文本作为兜底
        return {"raw_text": text}

    def _parse_yaml_fallback(self, text: str) -> Optional[Dict]:
        """备用 YAML 解析方法，处理简单的格式"""
        # 尝试清理文本中的常见问题
        cleaned = text

        # 移除行尾注释
        cleaned = re.sub(r'#.*$', '', cleaned, flags=re.MULTILINE)

        # 移除多余的空行
        cleaned = re.sub(r'\n\s*\n\s*\n', '\n\n', cleaned)

        # 再次尝试解析
        try:
            return yaml.safe_load(cleaned)
        except:
            return None


def generate_error_comment(pr_data: PRData, header: str, error_reasons: List[str]) -> str:
    """生成异常情况提示评论"""
    comment = f"## {header}\n\n"
    comment += f"**PR**: {pr_data.pr_title}\n"
    comment += f"**分支**: {pr_data.source_branch} → {pr_data.target_branch}\n"
    comment += f"**作者**: {pr_data.author}\n\n"

    comment += "### ⚠️ 无法进行需求合规性分析\n\n"
    comment += "原因：\n"
    for i, reason in enumerate(error_reasons, 1):
        comment += f"{i}. {reason}\n"

    comment += "\n---\n"
    comment += "*请修复以上问题后重新触发分析*"

    return comment


def extract_ticket_id(ticket_url: str) -> str:
    """从 URL 或 ID 中提取工作项 ID"""
    if not ticket_url or ticket_url == 'N/A':
        return 'N/A'

    # 如果本身就是纯数字
    if ticket_url.isdigit():
        return ticket_url

    # 尝试从 URL 中提取数字 ID
    # 匹配路径中的数字（通常是工作项 ID，4位及以上）
    match = re.search(r'/(\d{4,})(?:[/?]|$)', ticket_url)
    if match:
        return match.group(1)

    # 如果 URL 中没有找到数字 ID，尝试其他方式
    if '/' in ticket_url:
        # 移除查询参数
        url_without_query = ticket_url.split('?')[0]
        parts = url_without_query.split('/')
        for part in reversed(parts):
            if part.isdigit():
                return part

    return 'N/A'


def generate_comment_from_result(result_data: Dict, pr_data: PRData, header: str) -> str:
    """根据 LLM 分析结果生成评论（基于 PR-Agent 格式）"""
    comment = f"## {header}\n\n"
    comment += f"**PR**: {pr_data.pr_title}\n"
    comment += f"**分支**: {pr_data.source_branch} → {pr_data.target_branch}\n"
    comment += f"**作者**: {pr_data.author}\n\n"

    # 尝试解析 LLM 返回的分析结果
    ticket_results = []
    if isinstance(result_data, dict):
        review = result_data.get('review', {})
        if isinstance(review, dict):
            ticket_results = review.get('ticket_compliance_check', [])
        else:
            ticket_results = result_data.get('ticket_compliance_check', [])

    # 如果有原始文本，尝试从中提取
    if not ticket_results and 'raw_text' in result_data:
        comment += result_data['raw_text']
        return comment

    if ticket_results:
        # 有合规性分析结果
        comment += "### 📊 需求合规性分析\n\n"

        for item in ticket_results:
            ticket_url = item.get('ticket_url', 'N/A')
            requirements = item.get('ticket_requirements', '')
            fully = item.get('fully_compliant_requirements', '')
            not_compliant = item.get('not_compliant_requirements', '')
            needs_verify = item.get('requires_further_human_verification', '')

            # 判断合规状态
            if not_compliant and not fully:
                status_icon = '❌'
                status_text = '不符合'
            elif fully and not not_compliant and not needs_verify:
                status_icon = '✅'
                status_text = '完全符合'
            elif needs_verify and not not_compliant:
                status_icon = '🔍'
                status_text = '需要验证'
            else:
                status_icon = '⚠️'
                status_text = '部分符合'

            # 提取工作项 ID
            ticket_id = extract_ticket_id(ticket_url)

            # 从关联工作项中查找标题
            ticket_title = ''
            for wi in pr_data.work_items:
                if wi.id == ticket_id or wi.url == ticket_url:
                    ticket_title = wi.title
                    break

            comment += f"#### {status_icon} [{ticket_id}] {ticket_title}\n"
            comment += f"**合规性**: {status_text}\n\n"

            # 需求概述
            if requirements:
                comment += f"**📋 需求概述**:\n{requirements}\n\n"

            # 符合的需求
            if fully:
                comment += f"**✅ 符合需求**:\n{fully}\n\n"

            # 不符合的需求
            if not_compliant:
                comment += f"**❌ 不符合需求**:\n{not_compliant}\n\n"

            # 需要验证
            if needs_verify:
                comment += f"**🔍 需要人工验证**:\n{needs_verify}\n\n"

            comment += "---\n"
    else:
        # 没有详细分析，显示基本信息
        comment += "### 📋 关联工作项\n\n"
        for wi in pr_data.work_items:
            comment += f"- **[{wi.work_item_type}]** {wi.title} (#{wi.id})\n"

    # 文件变更
    files = pr_data.files
    comment += f"\n### 📁 文件变更\n"
    comment += f"- 变更文件: {len(files)} 个\n"
    comment += f"- 新增: +{sum(f.num_plus_lines for f in files)} 行\n"
    comment += f"- 删除: -{sum(f.num_minus_lines for f in files)} 行\n"

    comment += f"\n---\n*本评论由 PR 需求合规性检查工具自动生成*"

    return comment


def get_pat() -> Optional[str]:
    """获取 PAT"""
    pat = os.environ.get('TFS_PAT') or os.environ.get('AZURE_DEVOPS_PAT')
    if pat:
        return pat

    config_file = Path(__file__).parent.parent / "config" / "config.json"
    if config_file.exists():
        try:
            with open(config_file) as f:
                config = json.load(f)
                if config.get('pat'):
                    return config['pat']
        except:
            pass

    return None


def save_config(pat: str = None, api_key: str = None):
    """保存配置到文件"""
    config_file = Path(__file__).parent.parent / "config" / "config.json"
    config_file.parent.mkdir(exist_ok=True)

    config = {}
    if config_file.exists():
        try:
            with open(config_file) as f:
                config = json.load(f)
        except:
            pass

    if pat:
        config['pat'] = pat
    if api_key:
        config['anthropic_api_key'] = api_key

    with open(config_file, 'w') as f:
        json.dump(config, f, indent=2)


def get_default_provider() -> str:
    """从配置文件读取默认 LLM 提供商"""
    config_file = Path(__file__).parent.parent / "config" / "config.json"
    if config_file.exists():
        try:
            with open(config_file) as f:
                config = json.load(f)
                default_provider = config.get('default_provider', 'zhipu')
                # 验证 provider 是否有效
                if default_provider in LLMAnalyzer.MODELS:
                    return default_provider
                else:
                    print(f"{Colors.YELLOW}警告: 配置中的 default_provider '{default_provider}' 无效，使用默认值 zhipu{Colors.NC}")
        except Exception as e:
            print(f"{Colors.YELLOW}警告: 读取配置文件失败: {e}，使用默认值 zhipu{Colors.NC}")
    else:
        print(f"{Colors.YELLOW}提示: 配置文件不存在，使用默认值 zhipu{Colors.NC}")
    return 'zhipu'


def main():
    # 先读取默认 provider
    default_provider = get_default_provider()

    parser = argparse.ArgumentParser(description='PR 需求合规性检查工具（整合版）')
    parser.add_argument('pr_url', nargs='?', help='PR URL')
    parser.add_argument('--pat', help='TFS PAT token')
    parser.add_argument('--provider', choices=['zhipu', 'minimax', 'kimi'], default=default_provider,
                        help=f'LLM 提供商 (默认: {default_provider})')
    parser.add_argument('--model', help='LLM 模型名称（可选，使用默认模型）')
    parser.add_argument('--api-key', help='LLM API Key（覆盖配置文件）')
    parser.add_argument('--update-existing', action='store_true', help='更新已有评论')
    parser.add_argument('--header', default='🔍 PR 需求合规性检查', help='评论标题')
    parser.add_argument('--dry-run', action='store_true', help='仅分析不发布评论')
    parser.add_argument('--save-prompt', help='保存发送给 LLM 的 prompt 到 JSON 文件')
    parser.add_argument('--max-diff-length', type=int, default=15000, help='最大 diff 长度')
    parser.add_argument('--list-models', action='store_true', help='列出所有支持的模型')

    args = parser.parse_args()

    # 列出支持的模型
    if args.list_models:
        print(f"{Colors.CYAN}支持的 LLM 提供商和模型:{Colors.NC}\n")
        for key, config in LLMAnalyzer.MODELS.items():
            print(f"  {Colors.GREEN}{key}{Colors.NC} - {config['name']}")
            print(f"      默认模型: {config['default_model']}")
            print(f"      环境变量: {config['env_key']}")
            print(f"      配置键: {config['config_key']}")
            print()
        sys.exit(0)

    # 检查必需参数
    if not args.pr_url:
        parser.error("需要提供 PR_URL 参数")
        sys.exit(1)

    # 获取 PAT
    pat = args.pat or get_pat()
    if not pat:
        print(f"{Colors.YELLOW}警告: 未提供 TFS PAT 令牌，某些操作可能失败{Colors.NC}")
        print(f"提示: 使用 --pat 参数或设置 TFS_PAT 环境变量")

    # 初始化 TFS provider
    tfs_provider = TFSProvider(args.pr_url, pat)
    if not tfs_provider.parse_url():
        print(f"{Colors.RED}错误: 无法解析 PR URL{Colors.NC}")
        sys.exit(1)

    # 获取 PR 数据
    print(f"{Colors.CYAN}获取 PR 数据...{Colors.NC}")
    pr_data = tfs_provider.get_pr_data()

    print(f"{Colors.GREEN}✓ PR: {pr_data.pr_title}{Colors.NC}")
    print(f"  分支: {pr_data.source_branch} → {pr_data.target_branch}")
    print(f"  作者: {pr_data.author}")

    print(f"\n{Colors.GREEN}✓ 关联工作项: {len(pr_data.work_items)}{Colors.NC}")
    for wi in pr_data.work_items:
        print(f"  - [{wi.work_item_type}] {wi.title} (#{wi.id})")

    print(f"\n{Colors.GREEN}✓ 文件变更: {len(pr_data.files)}{Colors.NC}")
    total_plus = sum(f.num_plus_lines for f in pr_data.files)
    total_minus = sum(f.num_minus_lines for f in pr_data.files)
    print(f"  +{total_plus} / -{total_minus} 行")

    # ========== 异常检测 ==========
    has_commits = any(f.num_plus_lines > 0 or f.num_minus_lines > 0 for f in pr_data.files)
    has_work_items = len(pr_data.work_items) > 0

    error_reasons = []
    if not has_work_items:
        error_reasons.append("当前 PR 没有关联工作项，请先在 PR 中关联需求/任务")
    if not has_commits:
        error_reasons.append("当前 PR 没有关联 commit，可能还未合并代码或代码未推送")

    # 如果有异常，直接发布异常提示评论
    if error_reasons:
        print(f"\n{Colors.YELLOW}⚠️ 检测到异常:{Colors.NC}")
        for reason in error_reasons:
            print(f"  - {reason}")

        if not args.dry_run:
            comment = generate_error_comment(pr_data, args.header, error_reasons)
            print(f"\n{Colors.CYAN}发布异常提示评论...{Colors.NC}")
            if tfs_provider.publish_comment(comment):
                print(f"{Colors.GREEN}✓ 评论已发布{Colors.NC}")
            else:
                print(f"{Colors.RED}✗ 评论发布失败{Colors.NC}")
                sys.exit(1)
        else:
            print(f"\n{Colors.YELLOW}--dry-run 模式，跳过评论发布{Colors.NC}")

        sys.exit(0)

    # ========== 正常流程：调用 LLM ==========
    print(f"\n{Colors.CYAN}调用 LLM 进行需求合规性分析...{Colors.NC}")
    print(f"{Colors.CYAN}使用 LLM 提供商: {args.provider}{Colors.NC}")

    analyzer = LLMAnalyzer(provider=args.provider, api_key=args.api_key, model=args.model)
    result = analyzer.analyze(pr_data, save_prompt_file=args.save_prompt)

    if not result:
        print(f"{Colors.RED}LLM 分析失败{Colors.NC}")
        sys.exit(1)

    print(f"{Colors.GREEN}✓ LLM 分析完成{Colors.NC}")

    # 生成评论
    comment = generate_comment_from_result(result, pr_data, args.header)

    # 发布评论
    if not args.dry_run:
        thread_id = None
        if args.update_existing:
            thread_id = tfs_provider.find_bot_thread(args.header)
            if thread_id:
                print(f"{Colors.YELLOW}找到已有评论，更新中...{Colors.NC}")

        print(f"\n{Colors.CYAN}发布评论到 PR...{Colors.NC}")
        if tfs_provider.publish_comment(comment, thread_id):
            print(f"{Colors.GREEN}✓ 评论已发布成功{Colors.NC}")
        else:
            print(f"{Colors.RED}✗ 评论发布失败{Colors.NC}")
            sys.exit(1)
    else:
        print(f"\n{Colors.YELLOW}--dry-run 模式，跳过评论发布{Colors.NC}")
        print(f"\n{Colors.CYAN}评论内容预览:{Colors.NC}")
        print(comment)


if __name__ == "__main__":
    main()
