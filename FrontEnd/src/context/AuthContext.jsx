import {useEffect,useMemo,useState} from 'react'
import {listPermissionsRequest,loginRequest,logoutRequest,registerRequest,sessionRequest} from '../auth/auth.service'
import {AuthContext} from './auth-context.js'

const USER_KEY='authUser'
const storedUser=()=>{try{return JSON.parse(sessionStorage.getItem(USER_KEY))}catch{return null}}

export function AuthProvider({children}){
 const [user,setUser]=useState(storedUser)
 const [loading,setLoading]=useState(true)

 useEffect(()=>{let active=true;(async()=>{
  const current=await sessionRequest()
  if(!active)return
  if(current){
   try{current.permisos=await listPermissionsRequest()}catch{current.permisos=current.permisos||[]}
   sessionStorage.setItem(USER_KEY,JSON.stringify(current));setUser(current)
  }else{sessionStorage.removeItem(USER_KEY);localStorage.removeItem('authToken');localStorage.removeItem('authUser');setUser(null)}
  setLoading(false)
 })();return()=>{active=false}},[])

 const value=useMemo(()=>({
  token:null,user,loading,isAuthenticated:Boolean(user),
  login:async credentials=>{const result=await loginRequest(credentials);const next=result.user||await sessionRequest();if(next){try{next.permisos=await listPermissionsRequest()}catch{next.permisos=[]};sessionStorage.setItem(USER_KEY,JSON.stringify(next))}setUser(next);return result},
  register:registerRequest,
  logout:async()=>{await logoutRequest();sessionStorage.removeItem(USER_KEY);localStorage.removeItem('activeProject');setUser(null)},
 }),[user,loading])
 return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
