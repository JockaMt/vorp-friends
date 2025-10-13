export interface Post {
  id: string;
  content: string;
  authorId: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  images?: string[];
  images?: { uuid: string; url: string }[];
  location?: string;
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  parentId?: string | null;
}

export interface CreatePostData {
  content: string;
  images?: File[];
}

export interface CreateCommentData {
  content: string;
  postId: string;
  parentId?: string | null;
}