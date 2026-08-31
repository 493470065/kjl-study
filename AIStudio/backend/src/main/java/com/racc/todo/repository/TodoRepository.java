package com.racc.todo.repository;

import com.racc.todo.entity.TodoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TodoRepository extends JpaRepository<TodoEntity, Long> {

    /** 当前用户全部待办，按创建时间倒序（最新在前） */
    List<TodoEntity> findByUserIdOrderByCreatedAtDesc(Long userId);

    /** 按 id + 用户隔离查询，确保只能操作自己的待办 */
    Optional<TodoEntity> findByIdAndUserId(Long id, Long userId);
}
