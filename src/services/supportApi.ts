import api from './api'

export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export const supportAPI = {
  listFaqs: async () => {
    return api.get('/support/faqs')
  },
  listTickets: async (limit: number = 25) => {
    return api.get('/support/tickets', { params: { limit } })
  },
  startTicket: async (data: { category: string; priority: Priority }) => {
    return api.post('/support/tickets/start', data)
  },
  finalizeTicket: async (id: number | string, data: { subject: string; message: string }) => {
    return api.post(`/support/tickets/${id}/finalize`, data)
  },
  cancelTicket: async (id: number | string) => {
    return api.delete(`/support/tickets/${id}/cancel`)
  },
  getTicket: async (id: number | string) => {
    return api.get(`/support/tickets/${id}`)
  },
  addMessage: async (id: number | string, message: string) => {
    return api.post(`/support/tickets/${id}/messages`, { message })
  },
}

export default supportAPI
