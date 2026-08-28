const fs = require('fs');
let content = fs.readFileSync('F:/AI管理平台/backend/src/main/java/com/racc/knowledge/repository/KnowledgeDocumentRepository.java', 'utf8');
content = content.replace(
    'SELECT rowid FROM knowledge_fts WHERE knowledge_fts MATCH ?1 ORDER BY rank LIMIT ?2',
    'SELECT id FROM knowledge_documents WHERE title LIKE ?1 OR content LIKE ?1 LIMIT ?2'
);
fs.writeFileSync('F:/AI管理平台/backend/src/main/java/com/racc/knowledge/repository/KnowledgeDocumentRepository.java', content, 'utf8');
console.log('Fixed');