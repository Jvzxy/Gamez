import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { AppShell } from './components/layout/AppShell'
import { ChatPage } from './pages/chat/ChatPage'
import { GamePage } from './pages/game/GamePage'
import { GamesCatalogPage } from './pages/games/GamesCatalogPage'
import { HomePage } from './pages/home/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProfilePage } from './pages/profile/ProfilePage'
import { RoomSettingsPage } from './pages/room-settings/RoomSettingsPage'
import { AccountSettings } from './pages/settings/AccountSettings'
import { SecuritySettings } from './pages/settings/SecuritySettings'
import { SettingsLayout } from './pages/settings/SettingsLayout'
import { ChatProvider } from './state/ChatProvider'
import { UserProvider } from './state/UserProvider'

function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <ChatProvider>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<HomePage />} />
              <Route path="profile/:username?" element={<ProfilePage />} />
              <Route path="chat/:threadId?" element={<ChatPage />} />
              <Route path="chat/:threadId/settings" element={<RoomSettingsPage />} />
              <Route path="games" element={<GamesCatalogPage />} />
              <Route path="game" element={<Navigate to="/games" replace />} />
              <Route path="game/:gameId/:matchId?" element={<GamePage />} />
              <Route path="settings" element={<SettingsLayout />}>
                <Route index element={<Navigate to="account" replace />} />
                <Route path="account" element={<AccountSettings />} />
                <Route path="security" element={<SecuritySettings />} />
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </ChatProvider>
      </UserProvider>
    </BrowserRouter>
  )
}

export default App
