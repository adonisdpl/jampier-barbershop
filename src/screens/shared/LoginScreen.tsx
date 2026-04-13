import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native'
import { supabase } from '../../lib/supabase'

export default function LoginScreen() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isLogin, setIsLogin]   = useState(true)
  const [loading, setLoading]   = useState(false)

  async function handleAuth() {
    if (!email || !password) { Alert.alert('Erreur', 'Remplissez tous les champs.'); return }
    setLoading(true)
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        if (!fullName) { Alert.alert('Erreur', 'Entrez votre prénom.'); return }
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName } }
        })
        if (error) throw error
        Alert.alert('Compte créé !', 'Vérifiez votre email pour confirmer.')
      }
    } catch (e: any) {
      Alert.alert('Erreur', e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={s.logo}>Jampiero</Text>
      <Text style={s.subtitle}>BarberoShop</Text>
      <View style={s.divider} />

      {!isLogin && (
        <TextInput
          style={s.input}
          placeholder="Prénom et nom"
          placeholderTextColor="#555"
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
        />
      )}
      <TextInput
        style={s.input}
        placeholder="Email"
        placeholderTextColor="#555"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={s.input}
        placeholder="Mot de passe"
        placeholderTextColor="#555"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={s.btn} onPress={handleAuth} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#1a1a1a" />
          : <Text style={s.btnText}>{isLogin ? 'Se connecter' : 'Créer un compte'}</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={s.toggle}>
        <Text style={s.toggleText}>
          {isLogin ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container:   { flex:1, backgroundColor:'#1a1a1a', alignItems:'center', justifyContent:'center', padding:32 },
  logo:        { color:'#c9a96e', fontSize:32, fontStyle:'italic', letterSpacing:2 },
  subtitle:    { color:'#888', fontSize:14, letterSpacing:4, marginBottom:8 },
  divider:     { width:40, height:1, backgroundColor:'#c9a96e', marginBottom:32 },
  input:       { width:'100%', borderWidth:1, borderColor:'#333', backgroundColor:'#222', color:'#fff', padding:14, marginBottom:12, borderRadius:4, fontSize:15 },
  btn:         { width:'100%', backgroundColor:'#c9a96e', padding:16, alignItems:'center', borderRadius:4, marginTop:8 },
  btnText:     { color:'#1a1a1a', fontSize:15, letterSpacing:2 },
  toggle:      { marginTop:20 },
  toggleText:  { color:'#666', fontSize:13 },
})
