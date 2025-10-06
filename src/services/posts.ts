import type { Post, CreatePostData, Comment, CreateCommentData, PaginatedResponse } from '@/types';

class PostService {
  // Simple in-memory cache for comments per post
  private commentsCache: Map<string, { data: Comment[]; ts: number }> = new Map();
  // cache time-to-live in ms
  private cacheTTL = 60 * 1000; // 60 seconds

  async getFeed(page = 1, limit = 10): Promise<PaginatedResponse<Post>> {
    const response = await fetch(`/api/posts/feed?page=${page}&limit=${limit}`);
    if (!response.ok) {
      throw new Error('Erro ao buscar feed');
    }
    return response.json();
  }

  async createPost(postData: CreatePostData): Promise<Post> {
    const formData = new FormData();
    formData.append('content', postData.content);
    
    if (postData.images) {
      postData.images.forEach((image) => {
        formData.append('images', image);
      });
    }

    const response = await fetch('/api/posts', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Erro ao criar post');
    }
    
    const result = await response.json();
    return result.data;
  }

  async deletePost(postId: string): Promise<void> {
    const response = await fetch(`/api/posts/${postId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Erro ao deletar post');
    }
  }

  async likePost(postId: string): Promise<void> {
    const response = await fetch(`/api/posts/like/${postId}`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error('Erro ao curtir post');
    }
  }

  async unlikePost(postId: string): Promise<void> {
    const response = await fetch(`/api/posts/like/${postId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Erro ao descurtir post');
    }
  }

  async getComments(postId: string, page = 1, limit = 10): Promise<PaginatedResponse<Comment>> {
    const response = await fetch(`/api/posts/comments/${postId}?page=${page}&limit=${limit}`);
    if (!response.ok) {
      throw new Error('Erro ao buscar comentários');
    }
    // only use cache for first page (we cache the initial batch)
    if (page === 1) {
      const cached = this.commentsCache.get(postId);
      if (cached && (Date.now() - cached.ts) < this.cacheTTL) {
        // return a shape compatible with the API (data + pagination meta)
        return Promise.resolve({ data: cached.data, page: 1, limit, total: cached.data.length } as unknown as PaginatedResponse<Comment>);
      }
    }

    const result = await response.json();

    // cache only first page results
    if (page === 1) {
      try {
        const data = result.data || [];
        this.commentsCache.set(postId, { data, ts: Date.now() });
      } catch (e) {
        // ignore cache failures
      }
    }

    return result;
  }

  async createComment(commentData: CreateCommentData): Promise<Comment> {
    const response = await fetch(`/api/posts/comments/${commentData.postId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: commentData.content, parentId: commentData.parentId ?? null })
    });

    if (!response.ok) {
      throw new Error('Erro ao criar comentário');
    }
    
    const result = await response.json();
    // update cache: append the created comment for the post if cached
    try {
      const created: Comment = result.data;
      const cached = this.commentsCache.get(commentData.postId);
      if (cached) {
        cached.data = [...cached.data, created];
        cached.ts = Date.now();
        this.commentsCache.set(commentData.postId, cached);
      }
    } catch (e) {
      // ignore cache update errors
    }

    return result.data;
  }

  async editComment(postId: string, commentId: string, content: string): Promise<Comment> {
    const response = await fetch(`/api/posts/comments/${postId}/${commentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });

    if (!response.ok) {
      throw new Error('Erro ao editar comentário');
    }

    const result = await response.json();
    // update cache if present
    try {
      const updated: Comment = result.data;
      const cached = this.commentsCache.get(postId);
      if (cached) {
        cached.data = cached.data.map(c => c.id === updated.id ? updated : c);
        cached.ts = Date.now();
        this.commentsCache.set(postId, cached);
      }
    } catch (e) {
      // ignore
    }

    return result.data;
  }

  async deleteComment(postId: string, commentId: string): Promise<void> {
    const response = await fetch(`/api/posts/comments/${postId}/${commentId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Erro ao deletar comentário');
    }
    // update cache if present by removing the deleted comment (and replies if any)
    try {
      const cached = this.commentsCache.get(postId);
      if (cached) {
        cached.data = cached.data.filter(c => c.id !== commentId && c.parentId !== commentId);
        cached.ts = Date.now();
        this.commentsCache.set(postId, cached);
      }
    } catch (e) {
      // ignore
    }
  }
}

export const postService = new PostService();