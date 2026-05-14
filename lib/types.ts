export type Category = string

export interface ContactCard {
  id: string
  name: string
  title: string
  company: string
  email: string
  phone: string
  website: string
  category: Category
  aiDescription: string
  userNotes: string
  capturedAt: string
  accent?: string
}
