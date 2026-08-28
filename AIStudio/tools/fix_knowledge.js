const fs = require('fs');
let content = fs.readFileSync('F:/AI管理平台/backend/src/main/java/com/racc/knowledge/controller/KnowledgeController.java', 'utf8');

const oldStart = '    /**\n     * 上传文档：支持两种方式——';
const oldEnd = 'return ResponseEntity.badRequest().body(Map.of("error", "请提供文件或 JSON body"));\n    }\n';
const startIdx = content.indexOf(oldStart);
const endIdx = content.indexOf(oldEnd, startIdx) + oldEnd.length;

const newCode =
`    /**
     * 上传文档（JSON body）
     */
    @PostMapping(consumes = "application/json")
    public ResponseEntity<?> uploadDocumentJson(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(knowledgeService.uploadDocument(body));
    }

    /**
     * 上传文档（multipart/form-data）
     */
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<?> uploadDocumentFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String tags,
            @RequestParam(required = false) String sourceType,
            @RequestParam(required = false) String productLine) {
        return ResponseEntity.ok(
                knowledgeService.uploadDocumentFile(file, category, tags, sourceType, productLine));
    }`;

if (startIdx >= 0) {
    content = content.substring(0, startIdx) + newCode + content.substring(endIdx);
    fs.writeFileSync('F:/AI管理平台/backend/src/main/java/com/racc/knowledge/controller/KnowledgeController.java', content, 'utf8');
    console.log('Fixed OK');
} else {
    console.log('Pattern not found, startIdx=' + startIdx);
}