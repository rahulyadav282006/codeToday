import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import App from './App.jsx'
import './index.css'

const theme = createTheme({
  palette: {
    primary: { main: '#3730a3' },
    secondary: { main: '#06b6d4' },
  },
  typography: {
    fontFamily: "'DM Sans', sans-serif",
    h1: { fontFamily: "'Syne', sans-serif" },
    h2: { fontFamily: "'Syne', sans-serif" },
    h3: { fontFamily: "'Syne', sans-serif" },
    h4: { fontFamily: "'Syne', sans-serif" },
    h5: { fontFamily: "'Syne', sans-serif" },
    h6: { fontFamily: "'Syne', sans-serif" },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', borderRadius: 8, fontFamily: "'DM Sans', sans-serif" }
      }
    }
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
