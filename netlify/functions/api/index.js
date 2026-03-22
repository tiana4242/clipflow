import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// Mock API endpoints for frontend functionality
export async function handler(event, context) {
  const { path, httpMethod } = event

  try {
    switch (true) {
      case path.startsWith('/api/clips'):
        return await handleClips(event, path, httpMethod)
      case path.startsWith('/api/auth'):
        return await handleAuth(event, path, httpMethod)
      default:
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Not found' })
        }
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    }
  }
}

async function handleClips(event, path, method) {
  const user = await authenticateUser(event.headers)
  
  if (!user) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' })
    }
  }

  switch (method) {
    case 'GET':
      return await getClips(user.id)
    case 'POST':
      return await createClip(user.id, JSON.parse(event.body))
    default:
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' })
      }
  }
}

async function handleAuth(event, path, method) {
  switch (method) {
    case 'POST':
      if (path.includes('/login')) {
        return await login(JSON.parse(event.body))
      }
      if (path.includes('/signup')) {
        return await signup(JSON.parse(event.body))
      }
    default:
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' })
      }
  }
}

async function authenticateUser(headers) {
  const token = headers.authorization?.replace('Bearer ', '')
  if (!token) return null
  
  try {
    const { data: { user } } = await supabase.auth.getUser(token)
    return user
  } catch {
    return null
  }
}

// Mock implementations - replace with actual database calls
async function getClips(userId) {
  const { data } = await supabase
    .from('clips')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  return {
    statusCode: 200,
    body: JSON.stringify(data || [])
  }
}

async function createClip(userId, clipData) {
  const { data } = await supabase
    .from('clips')
    .insert({ ...clipData, user_id: userId })
    .select()
    .single()
  
  return {
    statusCode: 201,
    body: JSON.stringify(data)
  }
}

async function login(credentials) {
  const { data, error } = await supabase.auth.signInWithPassword(credentials)
  
  if (error) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: error.message })
    }
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify({ user: data.user, session: data.session })
  }
}

async function signup(credentials) {
  const { data, error } = await supabase.auth.signUp(credentials)
  
  if (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: error.message })
    }
  }
  
  return {
    statusCode: 201,
    body: JSON.stringify({ user: data.user, session: data.session })
  }
}
