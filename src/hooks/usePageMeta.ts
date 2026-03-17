import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

interface PageMetaOptions {
  title?: string
  description?: string
  titleKey?: string
  descriptionKey?: string
}

export function usePageMeta(options: PageMetaOptions) {
  const { t } = useTranslation()
  
  useEffect(() => {
    const title = options.titleKey ? t(options.titleKey) : options.title
    const description = options.descriptionKey ? t(options.descriptionKey) : options.description
    
    if (title) {
      document.title = `${title} | ${t('app.name')}`
    }
    
    if (description) {
      let meta = document.querySelector('meta[name="description"]')
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute('name', 'description')
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', description)
    }
  }, [options, t])
}
