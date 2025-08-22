import { useState, useEffect, useCallback } from 'react';
import api from '@/services/api';
import { User } from '@/types/user'; // Assuming a User type exists

interface Pagination {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
  from: number;
  to: number;
}

interface Filters {
  search?: string;
  plan?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const usePaginatedUsers = (initialPerPage = 10) => {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    lastPage: 1,
    perPage: initialPerPage,
    total: 0,
    from: 0,
    to: 0,
  });
  const [filters, setFilters] = useState<Filters>({
    sortBy: 'created_at',
    sortOrder: 'desc',
  });
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async (page = 1, currentFilters: Filters) => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: pagination.perPage,
        ...currentFilters,
      };
      const response: any = await api.get('/admin/users', { params });
      if (response.success) {
        setUsers(response.data);
        setPagination({
          currentPage: response.pagination.current_page,
          lastPage: response.pagination.last_page,
          perPage: response.pagination.per_page,
          total: response.pagination.total,
          from: (response.pagination.current_page - 1) * response.pagination.per_page + 1,
          to: (response.pagination.current_page - 1) * response.pagination.per_page + response.data.length,
        });
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.perPage]);

  useEffect(() => {
    fetchUsers(1, filters);
  }, [filters, fetchUsers]);

  const setPage = (page: number) => {
    fetchUsers(page, filters);
  };

  const applyFilters = (newFilters: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const refresh = () => {
    fetchUsers(pagination.currentPage, filters);
  };

  return {
    users,
    pagination,
    filters,
    loading,
    setPage,
    applyFilters,
    refresh,
  };
};
