export interface BaseNotification {
    _id: string;
    type: 'poke' | 'message' | 'friend_request' | 'comment' | 'like';
    fromUserId: string;
    fromUsername: string;
    toUserId: string;
    createdAt: string;
    seen: boolean;
}

export interface PokeNotification extends BaseNotification {
    type: 'poke';
}

export interface MessageNotification extends BaseNotification {
    type: 'message';
    message: string;
}

export interface FriendRequestNotification extends BaseNotification {
    type: 'friend_request';
}

export interface CommentNotification extends BaseNotification {
    type: 'comment';
    postId: string;
    comment: string;
}

export interface LikeNotification extends BaseNotification {
    type: 'like';
    postId: string;
}

export type Notification = PokeNotification | MessageNotification | FriendRequestNotification | CommentNotification | LikeNotification;