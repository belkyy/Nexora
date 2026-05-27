export default function EventCard() {
    return (
        <div className="bg-zinc-800 rounded-xl p-4">

            <h2 className="text-lg font-bold mb-2 text-yellow-400">
                Current Event
            </h2>

            <p className="text-sm mb-4">
                Bitcoin market is rapidly growing. Financial advisors suggest investment.
            </p>

            <div className="flex flex-col gap-2">

                <button className="bg-green-600 hover:bg-green-500 transition rounded-lg p-2">
                    Invest 150B$
                </button>

                <button className="bg-blue-600 hover:bg-blue-500 transition rounded-lg p-2">
                    Put money into bonds
                </button>

                <button className="bg-zinc-700 hover:bg-zinc-600 transition rounded-lg p-2">
                    Ignore
                </button>

            </div>

        </div>
    )
}