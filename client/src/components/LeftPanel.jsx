import EventCard from "./EventCard"

export default function LeftPanel() {
    return (
        <div className="w-80 border-r border-zinc-800 bg-zinc-900 p-4 flex flex-col gap-4">

            <div className="bg-zinc-800 rounded-xl p-4">

                <h2 className="text-lg font-bold mb-2 text-cyan-400">
                    National Status
                </h2>

                <div className="space-y-2 text-sm">
                    <p>Unemployment: 6%</p>
                    <p>Farming: 71%</p>
                    <p>Technology: 43%</p>
                    <p>Happiness: 68%</p>
                    <p>Oil Production: Medium</p>
                </div>

            </div>

            <EventCard />

        </div>
    )
}