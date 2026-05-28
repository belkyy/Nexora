import WorldMap from "./components/Map/WorldMap"
import TopBar from "./components/UI/TopBar"
import LeftPanel from "./components/UI/LeftPanel"
import RightPanel from "./components/UI/RightPanel"

export default function App() {

  return (

    <div className="w-screen h-screen bg-zinc-950 text-white overflow-hidden relative">

      <TopBar />

      <LeftPanel />

      <RightPanel />

      <WorldMap />

    </div>
  )
}