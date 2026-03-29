/**
 * Search Context - 全局搜索状态管理
 * 
 * 提供跨路由的搜索功能
 */
import { createContext, useContext, useState, useCallback, useMemo } from 'react'

interface SearchContextType {
  searchQuery: string
  setSearchQuery: (query: string) => void
  clearSearch: () => void
  isSearching: boolean
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('')

  const clearSearch = useCallback(() => {
    setSearchQuery('')
  }, [])

  const value = useMemo(() => ({
    searchQuery,
    setSearchQuery,
    clearSearch,
    isSearching: searchQuery.length > 0,
  }), [searchQuery, clearSearch])

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  )
}

export function useSearch() {
  const context = useContext(SearchContext)
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider')
  }
  return context
}

/**
 * 过滤任务列表的辅助函数
 */
export function filterTasks<T extends { title: string; note?: string; tags?: { name: string }[] }>(
  tasks: T[] | undefined,
  query: string
): T[] {
  if (!tasks || !query.trim()) return tasks || []
  
  const lowerQuery = query.toLowerCase().trim()
  
  return tasks.filter(task => {
    // 搜索标题
    if (task.title.toLowerCase().includes(lowerQuery)) return true
    
    // 搜索备注
    if (task.note?.toLowerCase().includes(lowerQuery)) return true
    
    // 搜索标签
    if (task.tags?.some(tag => tag.name.toLowerCase().includes(lowerQuery))) return true
    
    return false
  })
}

/**
 * 过滤项目的辅助函数
 */
export function filterProjects<T extends { title: string; note?: string }>(
  projects: T[] | undefined,
  query: string
): T[] {
  if (!projects || !query.trim()) return projects || []
  
  const lowerQuery = query.toLowerCase().trim()
  
  return projects.filter(project => {
    if (project.title.toLowerCase().includes(lowerQuery)) return true
    if (project.note?.toLowerCase().includes(lowerQuery)) return true
    return false
  })
}

export default useSearch
