export interface Clip {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  title: string;
  videoUrl: string;
  createdAt: string;
  userId?: string;
}

export interface VideoFile {
  file: File;
  url: string;
  duration: number;
}

export interface User {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
  };
}