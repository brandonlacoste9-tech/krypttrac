import Image from 'next/image'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center space-y-8">
        {/* Crown Logo */}
        <div className="flex justify-center">
          <div className="relative w-32 h-32 rounded-3xl bg-gradient-to-br from-purple-600 via-pink-600 to-purple-700 p-1 shadow-2xl">
            <div className="w-full h-full bg-slate-900 rounded-3xl flex items-center justify-center">
              <Image
                src="/kk-logo.png"
                alt="Krypttrac"
                width={100}
                height={100}
                className="drop-shadow-2xl"
              />
            </div>
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Krypttrac
          </h1>
          <p className="text-2xl text-gray-400 mt-4">Built for Kings 👑</p>
        </div>

        {/* CTA */}
        <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl text-white font-bold text-lg transition-all hover:scale-105 shadow-xl">
          Enter Dashboard
        </button>
      </div>
    </div>
  )
}
