import TopBar from "./components/TopBar"
import LeftPanel from "./components/LeftPanel"
import MapView from "./components/MapView"

export default function App() {
  return (
    <div className="w-screen h-screen bg-zinc-950 text-white overflow-hidden">

      <TopBar />

      <div className="flex h-[calc(100vh-64px)]">

        <LeftPanel />

        <MapView />

      </div>

    </div>
  )
}