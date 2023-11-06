export interface CommentRequest {
  user: string
  data: string
}
export interface Comment extends CommentRequest {
  timestamp: number
}
