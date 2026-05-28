export default function RightPanel() {

    return (

        <div className="absolute right-4 bottom-4 z-50 w-72 bg-zinc-900/90 backdrop-blur border border-zinc-700 rounded-2xl p-5">

            <div className="text-xl font-bold mb-4 text-cyan-400">

                Nexora Status

            </div>

            <div className="space-y-3 text-sm">

                <div className="flex justify-between">

                    <span>Global Tension</span>

                    <span className="text-red-400">
                        12%
                    </span>

                </div>

                <div className="flex justify-between">

                    <span>World Economy</span>

                    <span className="text-green-400">
                        Stable
                    </span>

                </div>

            </div>

        </div>
    )
}