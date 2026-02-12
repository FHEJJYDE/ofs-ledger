import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types/auth'
import { useNavigate } from 'react-router-dom'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ data: any, error: any }>
  signUp: (email: string, password: string) => Promise<{ data: any, error: any }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchAttempted, setFetchAttempted] = useState(false)
  const navigate = useNavigate()

  // Add a safety timeout to prevent infinite loading
  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        console.log('Auth safety timeout triggered - forcing loading to complete')
        setLoading(false)
      }
    }, 2000) // Reduced from 3 seconds to 2 seconds

    return () => clearTimeout(safetyTimeout)
  }, [loading])

  useEffect(() => {
    // Check active sessions and sets the user
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchProfile(session.user.id)
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error('Error getting session:', error)
        setLoading(false)
      }
    }

    checkSession()

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        try {
          await fetchProfile(session.user.id)
        } catch (error) {
          console.error('Error in auth state change:', error)
          setLoading(false)
        }
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    // Prevent multiple fetch attempts for the same user
    if (fetchAttempted && profile && profile.id === userId) {
      setLoading(false)
      return
    }

    setFetchAttempted(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // If the profile doesn't exist, create a default one
        if (error.code === 'PGRST116') {
          const newProfile = {
            id: userId,
            full_name: user?.email?.split('@')[0] || 'User',
            avatar_url: null,
            role: user?.email === 'pastendro@gmail.com' ? 'admin' : 'user', // Grant admin access to pastendro@gmail.com
          }

          const { error: insertError } = await supabase
            .from('profiles')
            .insert([newProfile])

          if (insertError) {
            console.error('Error creating profile:', insertError)

            // If we can't create the profile in the database, still set it locally
            // This ensures the user can access admin features
            if (user?.email === 'pastendro@gmail.com') {
              console.log('Setting admin role for pastendro@gmail.com')
              setProfile({
                ...newProfile,
                role: 'admin'
              } as Profile)
            } else {
              setProfile(newProfile as Profile)
            }
          } else {
            setProfile(newProfile as Profile)
          }
        }
      } else {
        // If this is pastendro@gmail.com, ensure they have admin role
        if (user?.email === 'pastendro@gmail.com' && data.role !== 'admin') {
          console.log('Setting admin role for pastendro@gmail.com')
          const updatedProfile = {
            ...data,
            role: 'admin'
          }
          setProfile(updatedProfile)

          // Try to update in database too
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', userId)

          if (updateError) {
            console.error('Error updating profile to admin:', updateError)
          }
        } else {
          setProfile(data)
        }
      }
    } catch (error) {
      console.error('Unexpected error fetching profile:', error)

      // Ensure pastendro@gmail.com gets admin access even if there are errors
      if (user?.email === 'pastendro@gmail.com') {
        console.log('Setting admin role for pastendro@gmail.com despite errors')
        setProfile({
          id: userId,
          full_name: user.email.split('@')[0] || 'Admin User',
          avatar_url: null,
          role: 'admin',
          email: user.email
        } as Profile)
      }
    } finally {
      setLoading(false)
    }
  };

  const value = {
    user,
    profile,
    loading,
    signIn: async (email: string, password: string) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })

        if (data.session?.user) {
          await fetchProfile(data.session.user.id)
        }
        return { data, error }
      } catch (unexpectedError) {
        console.error('Unexpected error during sign in:', unexpectedError)
        return { data: null, error: unexpectedError }
      }
    },
    signUp: async (email: string, password: string) => {
      try {
        const { data, error } = await supabase.auth.signUp({ email, password })

        if (data.session?.user) {
          // Create a default profile for new users
          const newProfile = {
            id: data.session.user.id,
            full_name: email.split('@')[0] || 'User',
            avatar_url: null,
            role: email === 'pastendro@gmail.com' ? 'admin' : 'user', // Grant admin access to pastendro@gmail.com
          }

          await supabase
            .from('profiles')
            .insert([newProfile])

          setProfile(newProfile as Profile)
        }
        return { data, error }
      } catch (unexpectedError) {
        console.error('Unexpected error during sign up:', unexpectedError)
        return { data: null, error: unexpectedError }
      }
    },
    signOut: async () => {
      try {
        // Clear local state first for immediate UI feedback
        setUser(null);
        setProfile(null);
        setFetchAttempted(false);

        // Sign out from Supabase
        const { error } = await supabase.auth.signOut();

        if (error) {
          console.error('Error signing out:', error);
          throw error;
        }

        // Navigate to home page
        navigate('/');
      } catch (error) {
        console.error('Error signing out:', error);
        // Still navigate even if there's an error
        navigate('/');
      }
    },
    refreshProfile: async () => {
      if (user?.id) {
        // Reset fetch attempted flag to allow a fresh fetch
        setFetchAttempted(false)
        setLoading(true) // Set loading to true to indicate refresh is happening
        try {
          await fetchProfile(user.id)
          return Promise.resolve(true) // Return success
        } catch (error) {
          console.error('Error refreshing profile:', error)
          return Promise.resolve(false) // Return failure
        }
      } else {
        return Promise.resolve(false)
      }
    }
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
