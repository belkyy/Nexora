export default function LeftPanel() {

    return (

        <div className="absolute left-4 bottom-4 z-50 w-72 bg-zinc-900/90 backdrop-blur border border-zinc-700 rounded-2xl p-5">

            <div className="text-xl font-bold mb-4 text-cyan-400">

                Controls

            </div>

            <div className="space-y-3 text-sm text-zinc-300">

                <div>Z → Terrain Mode</div>

                <div>X → Resource Mode</div>

                <div>Mouse Wheel → Zoom</div>

                <div>Drag Mouse → Move Camera</div>

            </div>

        </div>
    )
}