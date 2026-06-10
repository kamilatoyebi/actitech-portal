import { supabase } from './supabase'

/**
 * Notification Service - Handles all notification-related operations
 */

// Create a notification
export async function createNotification(userId, data) {
  const { type, title, message, requestId = null, actionUrl = null } = data
  
  try {
    const { data: notif, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        request_id: requestId,
        type,
        title,
        message,
        action_url: actionUrl,
        read: false,
      })
      .select()
      .single()

    if (error) throw error
    return notif
  } catch (err) {
    console.error('Error creating notification:', err)
    throw err
  }
}

// Get unread notifications for user
export async function getUnreadNotifications(userId) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('read', false)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Error fetching unread notifications:', err)
    return []
  }
}

// Get all notifications for user
export async function getAllNotifications(userId, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Error fetching notifications:', err)
    return []
  }
}

// Mark notification as read
export async function markAsRead(notificationId) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ 
        read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (err) {
    console.error('Error marking notification as read:', err)
    throw err
  }
}

// Mark all notifications as read for user
export async function markAllAsRead(userId) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ 
        read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) throw error
    return data
  } catch (err) {
    console.error('Error marking all as read:', err)
    throw err
  }
}

// Delete notification
export async function deleteNotification(notificationId) {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (error) throw error
  } catch (err) {
    console.error('Error deleting notification:', err)
    throw err
  }
}

// Clear all notifications for user
export async function clearAllNotifications(userId) {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)

    if (error) throw error
  } catch (err) {
    console.error('Error clearing notifications:', err)
    throw err
  }
}

// Subscribe to real-time notifications for a user
export function subscribeToNotifications(userId, callback) {
  const subscription = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log('New notification received:', payload.new)
        callback(payload.new)
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log('Notification updated:', payload.new)
        callback(payload.new, 'update')
      }
    )
    .subscribe()

  return subscription
}

// Request Service - Handles request operations

// Create a new request
export async function createRequest(userId, data) {
  const { title, description, category, priority = 'medium' } = data
  
  try {
    const { data: request, error } = await supabase
      .from('requests')
      .insert({
        requester_id: userId,
        title,
        description,
        category,
        priority,
        status: 'draft',
      })
      .select()
      .single()

    if (error) throw error
    return request
  } catch (err) {
    console.error('Error creating request:', err)
    throw err
  }
}

// Submit request (change status from draft to submitted)
export async function submitRequest(requestId, hodId) {
  try {
    const { data: request, error } = await supabase
      .from('requests')
      .update({
        status: 'hod_review',
        hod_id: hodId,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select()
      .single()

    if (error) throw error
    return request
  } catch (err) {
    console.error('Error submitting request:', err)
    throw err
  }
}

// Get requests for user
export async function getUserRequests(userId) {
  try {
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .eq('requester_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Error fetching requests:', err)
    return []
  }
}

// Get requests pending HOD review
export async function getHODPendingRequests(hodId) {
  try {
    const { data, error } = await supabase
      .from('requests')
      .select('*, requester:requester_id(id, email, full_name, department)')
      .eq('hod_id', hodId)
      .eq('status', 'hod_review')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Error fetching HOD pending requests:', err)
    return []
  }
}

// Get requests pending management review
export async function getManagementPendingRequests(managementId) {
  try {
    const { data, error } = await supabase
      .from('requests')
      .select('*, requester:requester_id(id, email, full_name, department), hod:hod_id(id, email, full_name)')
      .eq('management_id', managementId)
      .eq('status', 'management_review')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Error fetching management pending requests:', err)
    return []
  }
}

// Update request status
export async function updateRequestStatus(requestId, newStatus, metadata = {}) {
  try {
    const updateData = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    }

    if (newStatus === 'management_review') {
      updateData.hod_approved_at = new Date().toISOString()
    } else if (newStatus === 'approved') {
      updateData.management_approved_at = new Date().toISOString()
    }

    const { data: request, error } = await supabase
      .from('requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single()

    if (error) throw error
    return request
  } catch (err) {
    console.error('Error updating request status:', err)
    throw err
  }
}

// Get request by ID
export async function getRequestById(requestId) {
  try {
    const { data, error } = await supabase
      .from('requests')
      .select('*, requester:requester_id(id, email, full_name, department), hod:hod_id(id, email, full_name), management:management_id(id, email, full_name)')
      .eq('id', requestId)
      .single()

    if (error) throw error
    return data
  } catch (err) {
    console.error('Error fetching request:', err)
    return null
  }
}
