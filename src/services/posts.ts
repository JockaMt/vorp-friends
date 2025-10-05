import { apiClient } from './api';
import { API_ENDPOINTS } from '@/constants';
import type { Post, CreatePostData, Comment, CreateCommentData, PaginatedResponse } from '@/types';

class PostService {
  async getFeed(page = 1, limit = 10): Promise<PaginatedResponse<Post>> {
    return apiClient.get<PaginatedResponse<Post>>(
      `${API_ENDPOINTS.POSTS.FEED}?page=${page}&limit=${limit}`
    );
  }

  async createPost(postData: CreatePostData): Promise<Post> {
    const formData = new FormData();
    formData.append('content', postData.content);
    
    if (postData.images) {
      postData.images.forEach((image, index) => {
        formData.append(`images`, image);
      });
    }

    const response = await apiClient.upload<{ data: Post }>(
      API_ENDPOINTS.POSTS.CREATE,
      formData
    );
    
    return response.data;
  }

  async deletePost(postId: string): Promise<void> {
    await apiClient.delete(`${API_ENDPOINTS.POSTS.DELETE}/${postId}`);
  }

  async likePost(postId: string): Promise<void> {
    await apiClient.post(`${API_ENDPOINTS.POSTS.LIKE}/${postId}`);
  }

  async unlikePost(postId: string): Promise<void> {
    await apiClient.delete(`${API_ENDPOINTS.POSTS.UNLIKE}/${postId}`);
  }

  async getComments(postId: string, page = 1, limit = 10): Promise<PaginatedResponse<Comment>> {
    return apiClient.get<PaginatedResponse<Comment>>(
      `${API_ENDPOINTS.POSTS.COMMENTS}/${postId}?page=${page}&limit=${limit}`
    );
  }

  async createComment(commentData: CreateCommentData): Promise<Comment> {
    const response = await apiClient.post<{ data: Comment }>(
      `${API_ENDPOINTS.POSTS.COMMENTS}/${commentData.postId}`,
      { content: commentData.content }
    );
    
    return response.data;
  }
}

export const postService = new PostService();