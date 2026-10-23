import { type conversations } from './conversations'

export type ChatUser = (typeof conversations)[number]
export type Convo = ChatUser['messages'][number]
