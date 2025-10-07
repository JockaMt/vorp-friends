export interface Friendship {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  requester: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  addressee: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface FriendshipStatus {
  status: 'none' | 'sent' | 'received' | 'accepted' | 'rejected' | 'blocked' | 'self';
  message: string;
  friendshipId?: string;
  canSendRequest: boolean;
  canRespond: boolean;
  friendship?: {
    requesterId: string;
    addresseeId: string;
    createdAt: Date;
    updatedAt: Date;
  };
}