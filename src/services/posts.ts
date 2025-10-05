import type { Post, CreatePostData, Comment, CreateCommentData, PaginatedResponse } from '@/types';

class PostService {
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
    return response.json();
  }

  async createComment(commentData: CreateCommentData): Promise<Comment> {
    const response = await fetch(`/api/posts/comments/${commentData.postId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: commentData.content })
    });

    if (!response.ok) {
      throw new Error('Erro ao criar comentário');
    }
    
    const result = await response.json();
    return result.data;
  }
}

export const postService = new PostService();