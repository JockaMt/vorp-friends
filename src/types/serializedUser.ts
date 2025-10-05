export interface SerializedUser {
  id: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  imageUrl: string;
  hasImage: boolean;
  createdAt: number;
  updatedAt: number;
  emailAddresses: Array<{
    id: string;
    emailAddress: string;
  }>;
  publicMetadata: Record<string, any>;
}