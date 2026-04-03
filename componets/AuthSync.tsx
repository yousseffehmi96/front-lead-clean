"use client"
import { useUser } from "@clerk/nextjs"
import { useDispatch } from "react-redux"
import { useEffect } from "react"
import { setUser } from "@/store/UserSlice"

export default function AuthSync() {
    const { user, isLoaded, isSignedIn } = useUser()
    const dispatch = useDispatch()

    useEffect(() => {
  if (user) {
    dispatch(setUser({ userId: user.id, email: user.primaryEmailAddress?.emailAddress|| '' }))
  }
}, [user, dispatch])

    return null
}