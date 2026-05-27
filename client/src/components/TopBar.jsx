export default function TopBar() {
    return (
        <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-900">

            <div className="text-2xl font-bold tracking-wider text-cyan-400">
                NEXORA
            </div>

            <div className="flex gap-6 text-sm">

                <div>
                    💰 Budget: <span className="text-green-400">250B$</span>
                </div>

                <div>
                    👥 Population: <span className="text-blue-400">42M</span>
                </div>

                <div>
                    ⚔ Army: <span className="text-red-400">120K</span>
                </div>

                <div>
                    📈 Economy: <span className="text-yellow-400">Stable</span>
                </div>

            </div>

        </div>
    )
}