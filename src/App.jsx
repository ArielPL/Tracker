import { TrackerProvider } from './context/TrackerContext'
import { Layout }          from './components/Layout'

export default function App() {
  return (
    <TrackerProvider>
      <Layout />
    </TrackerProvider>
  )
}
