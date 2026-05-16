export type Category = string

export interface CustomCategory {
  name: string
  accent: string
}

export interface ContactCard {
  id: string
  name: string
  title: string
  company: string
  email: string
  phone: string
  website: string
  tags: CustomCategory[]
  aiDescription: string
  userNotes: string
  capturedAt: string
}
