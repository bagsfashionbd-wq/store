import { en } from './en'
import { bn } from './bn'

export type Language = 'en' | 'bn'
export type TranslationDictionary = typeof en

export const translations: Record<Language, TranslationDictionary> = {
  en,
  bn
}

export { en, bn }
