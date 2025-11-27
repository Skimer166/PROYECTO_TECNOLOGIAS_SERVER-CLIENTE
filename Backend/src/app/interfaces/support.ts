export interface SupportSession {
  userId: string;
  userName: string;
  messages: { 
    sender: string; 
    text: string; 
    time: Date; 
    isSystem?: boolean 
  }[];
  active: boolean;
}